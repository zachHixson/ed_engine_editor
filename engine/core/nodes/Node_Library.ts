import {SOCKET_TYPE, WIDGET} from './Node_Enums';
import { iNodeTemplate } from './iNodeTemplate';
import Cat_Events from './Cat_Events';
import Cat_Variables from './Cat_Variables';
import { ConstVector, Vector } from '../Vector';
import { iEditorNode, iEngineNode, iNodeConnection, iNodeSaveData, iEventContext } from '../LogicInterfaces';
import { Asset_Base, Game_Object, Instance_Base, Instance_Object, Instance_Sprite, iEditorNodeInput, iEditorNodeOutput, Sprite, Util } from '../core';
import { canConvertSocket, assetToInstance, instanceToAsset } from './Socket_Conversions';

export type GenericNode = iEditorNode | iEngineNode;

export function isEngineNode(node: any): node is iEngineNode {
    return !!node.engine;
}

export const NODE_LIST: iNodeTemplate[] = [
    ...Cat_Events,
    {// Branch
        id: 'branch',
        category: 'actual',
        inTriggers: [
            {id: '_i', execute: 'checkCondition'},
        ],
        outTriggers: ['true', 'false'],
        inputs: [
            {id: 'condition', type: SOCKET_TYPE.BOOL, default: false},
        ],
        methods: {
            checkCondition(this: iEngineNode, eventContext: iEventContext){
                const conditionVal = this.getInput<boolean>('condition', eventContext);
                const out = conditionVal ? 'true' : 'false';
                this.triggerOutput(out, eventContext);
            },
        },
    },
    {// Sequence
        id: 'sequence',
        category: 'actual',
        inTriggers: [
            {id: '_i', execute: 'startSequence'},
        ],
        outTriggers: ['#1', '#2'],
        afterSave(this: iEditorNode, saveData: iNodeSaveData){
            saveData.d = this.outTriggers.size;
        },
        afterLoad(this: iEditorNode, saveData: iNodeSaveData){
            const outputNumber = saveData.d;
            this.outTriggers.clear();

            for (let i = 0; i < outputNumber; i++){
                const id = '#' + (i + 1);
                this.outTriggers.set(id, {
                    id,
                    node: this,
                });
            }
        },
        onMount(this: iEditorNode){
            const wrapper = document.createElement('div');
            const removeBtn = document.createElement('button');
            const addBtn = document.createElement('button');

            wrapper.style.cssText = `
                display: flex;
                flex-direction: row;
                justify-content: flex-end;
                gap: 3px;
                padding: 5px;
            `;

            removeBtn.style.cssText = `
                display: flex;
                justify-content: center;
                align-items: center;
                width: 20px;
                height: 20px;
                border: 2px solid var(--border);
                border-radius: 5px;
            `;
            addBtn.style.cssText = removeBtn.style.cssText;
            
            removeBtn.innerHTML = '-';
            addBtn.innerHTML = '+';

            removeBtn.onclick = ()=>{
                if (this.outTriggers.size > 1){
                    const lastOutput = '#' + this.outTriggers.size;
                    const connections = this.editorAPI.getOutputConnections(this, lastOutput);

                    if (connections.length){
                        this.editorAPI.deleteConnections(connections, false);
                    }

                    this.outTriggers.delete(lastOutput);
                    this.emit('force-update');

                    setTimeout(()=>{
                        this.emit('update-connections');
                    });
                }
            };

            addBtn.onclick = ()=>{
                const nextOutputName = '#' + (this.outTriggers.size + 1);
                this.outTriggers.set(nextOutputName, {
                    id: nextOutputName,
                    node: this,
                });
                this.emit('force-update');
                setTimeout(()=>{
                    this.emit('update-connections');
                });
            };
            
            wrapper.append(removeBtn);
            wrapper.append(addBtn);

            this.domRef!.append(wrapper);
        },
        methods: {
            startSequence(this: iEngineNode, eventContext: iEventContext){
                for (let i = 0; i < this.outTriggers.size; i++){
                    const id = '#' + (i + 1);
                    this.triggerOutput(id, eventContext);
                }
            }
        }
    },
    {// Compare
        id: 'compare_numbers',
        category: 'actual',
        inputs: [
            {id: '_inp1', type: SOCKET_TYPE.NUMBER, default: 0},
            {id: '_inp2', type: SOCKET_TYPE.NUMBER, default: 0},
        ],
        widget: {
            id: 'compare_function',
            type: WIDGET.ENUM,
            options: {
                items: ['equal_sym', 'gt', 'lt', 'gte', 'lte'],
            },
        },
        outputs: [
            {id: 'equal', type: SOCKET_TYPE.BOOL, execute: 'compare'},
        ],
        methods: {
            compare(this: iEngineNode, eventContext: iEventContext){
                const compareFunc = this.getWidgetData();
                const inp1 = this.getInput<number>('_inp1', eventContext);
                const inp2 = this.getInput<number>('_inp2', eventContext);

                switch(compareFunc){
                    case 'equal_sym': return inp1 == inp2;
                    case 'gt': return inp1 > inp2;
                    case 'lt': return inp1 < inp2;
                    case 'gte': return inp1 >= inp2;
                    case 'lte': return inp1 <= inp2;
                }
            },
        },
    },
    {// Compare Instances
        id: 'compare_instances',
        category: 'actual',
        widget: {
            id: 'type',
            type: WIDGET.ENUM,
            options: {
                items: ['compare_instance', 'compare_type'],
            },
        },
        onBeforeMount(this: iEditorNode){
            this.method('editor_setSocketType');
        },
        onValueChange(this: iEditorNode){
            this.method('editor_setSocketType');
        },
        inputs: [
            {id: '_i1', type: SOCKET_TYPE.ASSET, default: null},
            {id: '_i2', type: SOCKET_TYPE.ASSET, default: null},
        ],
        outputs: [
            {id: 'result', type: SOCKET_TYPE.BOOL, execute: 'getResult'},
        ],
        methods: {
            getResult(this: iEngineNode, eventContext: iEventContext){
                const i1 = this.getInput<Asset_Base>('_i1', eventContext);
                const i2 = this.getInput<Asset_Base>('_i2', eventContext);

                return i1.id == i2.id;
            },
            editor_setSocketType(this: iEditorNode){
                const type = this.widgetData;
                const deleteConnections: iNodeConnection[] = [];
                let typeChanged = false;

                //change socket icons
                this.inputs?.forEach(input => {
                    const connection = this.editorAPI.getInputConnection(this, input.id);
                    const connectedSocket = connection ? this.editorAPI.getConnectedInputSocket(this, input.id, connection) : null;
                    typeChanged ||= type != input.type;
                    input.type = type == 'compare_type' ? SOCKET_TYPE.ASSET : SOCKET_TYPE.INSTANCE;
                    typeChanged && this.emit('force-socket-update', input.id);

                    if (connection && connectedSocket && !canConvertSocket(connectedSocket.type, input.type)){
                        deleteConnections.push(connection);
                    }
                });

                typeChanged && deleteConnections.length && this.editorAPI.deleteConnections(deleteConnections, true);
            }
        },
    },
    {// Logic
        id: 'logic',
        category: 'actual',
        widget: {
            id: 'logic_function',
            type: WIDGET.ENUM,
            options: {
                items: ['and', 'or', 'xor']
            },
        },
        inputs: [
            {id: '_inp1', type: SOCKET_TYPE.BOOL, default: false},
            {id: '_inp2', type: SOCKET_TYPE.BOOL, default: false},
        ],
        outputs: [
            {id: '_result', type: SOCKET_TYPE.BOOL, execute: 'result'},
        ],
        methods: {
            result(this: iEngineNode, eventContext: iEventContext){
                const logicFunc = this.getWidgetData();
                const inp1 = this.getInput<boolean>('_inp1', eventContext);
                const inp2 = this.getInput<boolean>('_inp2', eventContext);

                switch(logicFunc){
                    case 'and': return inp1 && inp2;
                    case 'or': return inp1 || inp2;
                    case 'xor': return !!(+inp1 ^ +inp2);
                }
            },
        },
    },
    {// list_loop
        id: 'list_loop',
        category: 'actual',
        inputs: [
            {id: 'iterations', type: SOCKET_TYPE.NUMBER, default: 0},
            {id: 'list', type: SOCKET_TYPE.ANY, hideInput: true, isList: true, default: []},
        ],
        outputs: [
            {id: 'index', type: SOCKET_TYPE.NUMBER, execute: 'getIndex'},
            {id: 'length', type: SOCKET_TYPE.NUMBER, execute: 'getLength'},
            {id: 'item', type: SOCKET_TYPE.ANY, disabled: true, execute: 'getItem'},
        ],
        inTriggers: [
            {id: '_i', execute: 'runLoop'},
        ],
        outTriggers: ['_o'],
        init(this: GenericNode){
            if (isEngineNode(this)) return;
            this.stackDataIO = true;
        },
        afterSave(this: iEditorNode, saveData: iNodeSaveData){
            saveData.d = this.inputs.get('list')!.type;
        },
        afterLoad(this: GenericNode, saveData: iNodeSaveData) {
            const type = saveData.d;
            const itemOut = this.outputs.get('item')!;
            
            this.inputs.get('list')!.type = type;
            itemOut.type = type;

            if (!isEngineNode(this)){
                (itemOut as iEditorNodeOutput).disabled = type == SOCKET_TYPE.ANY;
            }
        },
        onNewConnection(this: iEditorNode, connection: iNodeConnection){
            const iterationConnection = this.editorAPI.getInputConnection(this, 'iterations');
            const connectedToIteration = connection.endNode!.nodeId == this.nodeId && connection.endSocketId == 'iterations';

            this.method('editor_setSocketTypes');

            //break iterations connection
            if (iterationConnection && !connectedToIteration){
                this.editorAPI.deleteConnections([iterationConnection], true);
            }
        },
        onRemoveConnection(this: iEditorNode, connection: iNodeConnection){
            const disconnectedFromList = connection.disconnectedFrom == 'list' || connection.endSocketId == 'list';
            const disconnectedFromIterations = connection.disconnectedFrom == 'iterations' || connection.endSocketId == 'iterations';
            const isEndConnection = connection.endNode?.nodeId == this.nodeId;

            if (!isEndConnection && !(disconnectedFromList || disconnectedFromIterations)) return;

            if (disconnectedFromList){
                const itemConnection = this.editorAPI.getOutputConnections(this, 'item');
                const itemOutput = this.outputs.get('item')!;

                this.inputs.get('iterations')!.disabled = false;
                this.inputs.get('list')!.type = SOCKET_TYPE.ANY;

                if (itemConnection.length){
                    this.editorAPI.deleteConnections([...itemConnection], true);
                }

                itemOutput.type = SOCKET_TYPE.ANY;
                itemOutput.disabled = true;
            }
            else{
                this.inputs.get('list')!.disabled = false;
                this.outputs.get('item')!.disabled = false;
            }

            this.emit('force-socket-update', 'iterations');
            this.emit('force-socket-update', 'list');
            this.emit('force-socket-update', 'item');
        },
        methods: {
            runLoop(this: iEngineNode, eventContext: iEventContext){
                const iterations = this.getInput<number>('iterations', eventContext);
                const list = this.getInput<any[]>('list', eventContext);

                if (list && list.length){
                    for (let i = 0; i < list.length; i++){
                        this.dataCache.set(eventContext.eventKey, {index: i, length: list.length, item: list[i]});
                        this.triggerOutput('_o', eventContext);
                    }
                }
                else{
                    for (let i = 0; i < iterations; i++){
                        this.dataCache.set(eventContext.eventKey, {index: i, length: iterations, item: i});
                        this.triggerOutput('_o', eventContext);
                    }
                }

                this.dataCache.delete(eventContext.eventKey);
            },
            getIndex(this: iEngineNode, eventContext: iEventContext){
                const data = this.dataCache.get(eventContext.eventKey);
                return data?.index ?? 0;
            },
            getLength(this: iEngineNode, eventContext: iEventContext){
                const data = this.dataCache.get(eventContext.eventKey);
                return data?.length ?? 0;
            },
            getItem(this: iEngineNode, eventContext: iEventContext){
                const data = this.dataCache.get(eventContext.eventKey);
                return data?.item ?? null;
            },
            editor_setSocketTypes(this: iEditorNode, type?: SOCKET_TYPE){
                const listConnectedSocket = this.editorAPI.getConnectedInputSocket(this, 'list');
                const iterationsConnectedSocket = this.editorAPI.getConnectedInputSocket(this, 'iterations');
                const socketType = type ?? listConnectedSocket?.type ?? SOCKET_TYPE.ANY;
                const listInput = this.inputs.get('list')!;
                const itemOutput = this.outputs.get('item')!
                this.inputs.get('iterations')!.disabled = !!listConnectedSocket;
                listInput.type = socketType;
                listInput.disabled = !!iterationsConnectedSocket;
                itemOutput.type = socketType;
                itemOutput.disabled = !listConnectedSocket;
                this.emit('force-socket-update', 'iterations');
                this.emit('force-socket-update', 'list');
                this.emit('force-socket-update', 'item');
            }
        },
    },
    {// Add to List
        id: 'add_to_list',
        category: 'actual',
        inputs: [
            {id: 'list', type: SOCKET_TYPE.ANY, hideInput: true, isList: true, default: []},
            {id: 'item', type: SOCKET_TYPE.ANY, hideInput: true, disabled: true, default: null},
        ],
        outputs: [
            {id: '_o', type: SOCKET_TYPE.ANY, isList: true, disabled: true, execute: 'getList'},
        ],
        afterSave(this: iEditorNode, saveData: iNodeSaveData){
            saveData.d = this.inputs.get('list')!.type;
        },
        afterLoad(this: GenericNode, saveData: iNodeSaveData) {
            const type = saveData.d.type;
            const listInput = this.inputs.get('list')!;
            const output = this.outputs.get('_o')!;
            
            this.inputs.get('list')!.type = type;
            listInput.type = type;
            output.type = type;

            if (!isEngineNode(this)){
                const disable = type == SOCKET_TYPE.ANY;
                (listInput as iEditorNodeInput).disabled = disable;
                (output as iEditorNodeOutput).disabled = disable;
            }
        },
        onBeforeMount(this: iEditorNode){
            const listConnection = this.editorAPI.getInputConnection(this, 'list');
            this.method('editor_setType', [!!listConnection, false]);
        },
        onNewConnection(this: iEditorNode, connection: iNodeConnection){
            if (connection.endNode?.nodeId != this.nodeId || connection.endSocketId != 'list') return;
            this.method('editor_setType', [true, true]);
        },
        onRemoveConnection(this: iEditorNode, connection: iNodeConnection){
            const connectedToList = connection.disconnectedFrom == 'list' || connection.endSocketId == 'list';
            if (connection.endNode?.nodeId != this.nodeId || !connectedToList) return;
            this.method('editor_setType', [false, true]);
        },
        methods: {
            getList(this: iEngineNode, eventContext: iEventContext){
                const list = this.getInput<any[]>('list', eventContext);
                const item = this.getInput<any>('item', eventContext);
                const outputList = [...list];

                (item != null) && outputList.push(item);

                return outputList;
            },
            editor_setType(this: iEditorNode, [hasInput, isMounted] : [boolean, boolean]){
                const listInput = this.inputs.get('list')!;
                const itemInput = this.inputs.get('item')!;
                const listOutput = this.outputs.get('_o')!;
                const listConnectionType = hasInput ? this.editorAPI.getConnectedInputSocket(this, 'list')!.type : null;
                const itemInputConnection = this.editorAPI.getInputConnection(this, 'item');
                const listOutputConnections = this.editorAPI.getOutputConnections(this, '_o');
                const deleteConnections: iNodeConnection[] = [];
                const type = listConnectionType ?? SOCKET_TYPE.ANY;
                const disabled = !listConnectionType;

                listInput.type = type;
                itemInput.type = type;
                listOutput.type = type;
                itemInput.disabled = disabled;
                listOutput.disabled = disabled;

                if (!isMounted){
                    return;
                }

                if (itemInputConnection){
                    deleteConnections.push(itemInputConnection);
                }

                if (listOutputConnections.length){
                    deleteConnections.push(...listOutputConnections);
                }

                deleteConnections.length && this.editorAPI.deleteConnections(deleteConnections, true);

                this.emit('force-socket-update', 'list');
                this.emit('force-socket-update', 'item');
                this.emit('force-socket-update', '_o');
            },
        },
    },
    {// List Length
        id: 'list_length',
        category: 'actual',
        inputs: [
            {id: '_list', type: SOCKET_TYPE.ANY, hideInput: true, isList: true, default: null},
        ],
        outputs: [
            {id: 'length', type: SOCKET_TYPE.NUMBER, execute: 'getLength'},
        ],
        afterSave(this: iEditorNode, saveData: iNodeSaveData){
            saveData.d = this.inputs.get('_list')!.type;
        },
        afterLoad(this: iEditorNode, saveData: iNodeSaveData){
            this.inputs.get('_list')!.type = saveData.d;
        },
        onNewConnection(this: iEditorNode, connection: iNodeConnection){
            if (!(connection.endNode?.nodeId == this.nodeId && connection.endSocketId == '_list')) return;

            const getConnectedSocket = this.editorAPI.getConnectedInputSocket(this, '_list')!;

            this.inputs.get('_list')!.type = getConnectedSocket.type;
            this.emit('force-socket-update', '_list');
        },
        onRemoveConnection(this: iEditorNode, connection: iNodeConnection){
            if (!(connection.endNode?.nodeId == this.nodeId && connection.disconnectedFrom == '_list')) return;

            this.inputs.get('_list')!.type = SOCKET_TYPE.ANY;
            this.emit('force-socket-update', '_list');
        },
        methods: {
            getLength(this: iEngineNode, eventContext: iEventContext){
                const list = this.getInput<any[] | null>('_list', eventContext);

                return list?.length ?? 0;
            }
        }
    },
    {// Not
        id: 'not',
        category: 'actual',
        inputs: [
            {id: '_inp', type: SOCKET_TYPE.BOOL, default: false},
        ],
        outputs: [
            {id: '_out', type: SOCKET_TYPE.BOOL, execute: 'not'},
        ],
        methods: {
            not(this: iEngineNode, eventContext: iEventContext){
                return !this.getInput<boolean>('_inp', eventContext);
            },
        },
    },
    {// Debug Log
        id: 'debug_log',
        category: 'actual',
        inTriggers: [
            {id: '_i', execute: 'log'}
        ],
        outTriggers: ['_o'],
        inputs: [
            {id: 'label', type: SOCKET_TYPE.STRING, default: ''},
            {id: '_data', type: SOCKET_TYPE.ANY, default: null},
        ],
        methods: {
            log(this: iEngineNode, eventContext: iEventContext){
                const label = this.getInput<string>('label', eventContext);
                const data = this.getInput<any>('_data', eventContext, false);
                let output = '';

                if (label.length) output += label;

                if (Array.isArray(data)){
                    let arrayString = '';

                    if (data[0].name){
                        const arrayNames = data.map(o => `{ ${convertObjectToString(o)} }`);
                        arrayString = arrayNames.join(', ');
                    }
                    else{
                        data.join(', ');
                    }

                    output += `[${arrayString}]`;
                }
                else if (data?.name){
                    output += `{ ${convertObjectToString(data[0])} }`;
                }
                else if (data != null){
                    output += data;
                }

                this.engine.log(output);

                this.triggerOutput('_o', eventContext);
            },
        },
    },
    {// Key Input
        id: 'key_input',
        category: 'actual',
        widget: {
            id: 'key_selector',
            type: WIDGET.KEY,
        },
        outputs: [
            {id: 'key', type: SOCKET_TYPE.STRING, execute: 'getKey'},
            {id: 'is_down', type: SOCKET_TYPE.BOOL, execute: 'isDown'},
        ],
        methods: {
            getKey(this: iEngineNode){
                return this.getWidgetData().code ?? '';
            },
            isDown(this: iEngineNode){
                const keymap = this.engine.keyMap;
                const input = this.getWidgetData().code;
                const mapCheck = keymap.get(input);

                return mapCheck == 'down' || mapCheck == 'pressed';
            },
        },
    },
    {// Math
        id: 'math',
        category: 'actual',
        widget: {
            id: 'math_function',
            type: WIDGET.ENUM,
            options: {
                items: ['add_sym', 'subtract_sym', 'multiply_sym', 'divide_sym', 'power'],
            },
        },
        inputs: [
            {id: '_num1', type: SOCKET_TYPE.NUMBER, default: 0, required: true},
            {id: '_num2', type: SOCKET_TYPE.NUMBER, default: 0, required: true},
        ],
        outputs: [
            {id: '_out', type: SOCKET_TYPE.NUMBER, execute: 'compute'},
        ],
        methods: {
            compute(this: iEngineNode, eventContext: iEventContext){
                const mathFunc = this.getWidgetData();
                const num1= this.getInput<number>('_num1', eventContext);
                const num2= this.getInput<number>('_num2', eventContext);

                switch(mathFunc){
                    case 'add_sym': return num1 + num2;
                    case 'subtract_sym': return num1 - num2;
                    case 'multiply_sym': return num1 * num2;
                    case 'divide_sym':
                        if (num2 == 0){
                            this.engine.nodeException('Cannot divide by 0', null);
                            return;
                        }
                        return num1 / num2;
                    case 'power': return Math.pow(num1, num2);
                }
            },
        },
    },
    {// Remove Instance
        id: 'remove_instance',
        category: 'actual',
        inTriggers: [
            {id: '_i', execute: 'removeInstance'},
        ],
        outTriggers: ['_o'],
        inputs: [
            {id: 'instance', type: SOCKET_TYPE.INSTANCE, default: null, required: true},
        ],
        methods: {
            removeInstance(this: iEngineNode, eventContext: iEventContext){
                const instance = this.getInput<Instance_Base>('instance', eventContext) ?? eventContext.instance;
                this.engine.removeInstance(instance);
                this.triggerOutput('_o', eventContext);
            }
        },
    },
    {// Dialog Box
        id: 'dialog_box',
        category: 'actual',
        widget: {
            id: 'text',
            type: WIDGET.TEXT_AREA,
        },
        inTriggers: [
            {id: '_i', execute: 'startDialog'},
        ],
        outTriggers: ['immediate', 'dialog_closed'],
        inputs: [
            {id: 'text', type: SOCKET_TYPE.STRING, hideInput: true, default: ''},
            {id: 'interaction_key', type: SOCKET_TYPE.STRING, hideInput: true, default: null},
            {id: 'pause_game', type: SOCKET_TYPE.BOOL, default: false},
            {id: 'fullscreen', type: SOCKET_TYPE.BOOL, default: false},
        ],
        methods: {
            startDialog(this: iEngineNode, eventContext: iEventContext){
                const textArea = this.getWidgetData();
                const textBox = this.getInput<string>('text', eventContext);
                const interactKey = this.getInput<string>('interaction_key', eventContext) ?? 'Space';
                const shouldPause = this.getInput<boolean>('pause_game', eventContext);
                const isFullscreen = this.getInput<boolean>('fullscreen', eventContext);
                const text = textBox ? textBox : textArea;

                this.engine.openDialogBox(text, shouldPause, isFullscreen, ()=>{
                    this.triggerOutput('dialog_closed', eventContext)
                }, interactKey);
                this.triggerOutput('immediate', eventContext);
            },
        },
    },
    {// Object Input
        id:'object_input',
        category: 'actual',
        widget: {
            id: 'object',
            type: WIDGET.ENUM,
            options: {
                items: [],
                showSearch: true,
                showThumbnail: true,
            },
        },
        outputs: [
            { id: '_o', type: SOCKET_TYPE.ASSET, execute: 'getObject' },
        ],
        onBeforeMount(this: iEditorNode){
            const genericNoOption = {
                name: this.editorAPI.t('generic.no_option'),
                id: -1,
                value: null,
            };
            const objects = this.editorAPI.gameDataStore.getAllObjects.map((o: Game_Object) => ({
                name: o.name,
                id: o.id,
                value: o.id,
                thumbnail: (()=>{
                    const thumbFrame = o.sprite?.frames[o.startFrame];

                    if (!(thumbFrame && o.sprite)){
                        return Instance_Object.DEFAULT_INSTANCE_ICON[0];
                    }

                    return o.sprite.frameIsEmpty(o.startFrame) ? Instance_Object.DEFAULT_INSTANCE_ICON[0] : o.sprite?.frames[o.startFrame];
                })()
            }));

            this.widget.options.items = [genericNoOption, ...objects];
        },
        methods: {
            getObject(this: iEngineNode){
                const objects = this.engine.gameData.objects;
                const selectedObjectId = this.widgetData;

                return objects.find(o => o.id == selectedObjectId) ?? null;
            },
        }
    },
    {// Get Self
        id: 'get_self',
        category: 'actual',
        outputs: [
            {id: 'self', type: SOCKET_TYPE.INSTANCE, execute: 'getSelf'},
        ],
        methods: {
            getSelf(this: iEngineNode, eventContext: iEventContext){
                return eventContext.instance;
            },
        },
    },
    {// Instance Properties
        id: 'instance_properties',
        category: 'actual',
        inputs: [
            {id: 'instance', type: SOCKET_TYPE.INSTANCE, default: null, required: true},
        ],
        outputs: [
            {id: 'Type', type: SOCKET_TYPE.ASSET, execute: 'getAsset'},
            {id: 'name', type: SOCKET_TYPE.STRING, execute: 'getName'},
            {id: 'x', type: SOCKET_TYPE.NUMBER, execute: 'getX'},
            {id: 'y', type: SOCKET_TYPE.NUMBER, execute: 'getY'},
        ],
        init(this: GenericNode){
            if (!isEngineNode(this)){
                this.stackDataIO = true;
            }
        },
        methods: {
            getAsset(this: iEngineNode, eventContext: iEventContext){
                const instance = this.getInput<Instance_Base>('instance', eventContext) ?? eventContext.instance;
                return instanceToAsset(instance, this.engine.gameData);
            },
            getName(this: iEngineNode, eventContext: iEventContext){
                return (this.getInput<Instance_Base>('instance', eventContext) ?? eventContext.instance).name
            },
            getX(this: iEngineNode, eventContext: iEventContext){
                console.warn('instance_properties.getX is deprecated, please use "get_position", node instead');
                return (this.getInput<Instance_Base>('instance', eventContext) ?? eventContext.instance).pos.x
            },
            getY(this: iEngineNode, eventContext: iEventContext){
                console.warn('instance_properties.getY is deprecated, please use "get_position", node instead');
                return (this.getInput<Instance_Base>('instance', eventContext) ?? eventContext.instance).pos.y
            },
        },
    },
    {// Spawn Instance
        id: 'spawn_instance',
        category: 'actual',
        inTriggers: [
            {id: '_i', execute: 'spawnInstance'}
        ],
        outTriggers: ['_o'],
        inputs: [
            {id: 'type', type: SOCKET_TYPE.ASSET, default: null, required: false},
            {id: 'x', type: SOCKET_TYPE.NUMBER, default: 0, required: true},
            {id: 'y', type: SOCKET_TYPE.NUMBER, default: 0, required: true},
            {id: 'relative', type: SOCKET_TYPE.BOOL, default: false},
        ],
        outputs: [
            {id: 'instance', type: SOCKET_TYPE.INSTANCE, execute: 'getAsset'},
        ],
        methods: {
            spawnInstance(this: iEngineNode, eventContext: iEventContext){
                const baseAsset = this.getInput<Asset_Base>('type', eventContext);
                const x = this.getInput<number>('x', eventContext);
                const y = this.getInput<number>('y', eventContext);
                const relative = this.getInput<boolean>('relative', eventContext);
                const pos = relative ? new Vector(x, y).add(eventContext.instance.pos) : new Vector(x, y);
                const nextId = this.engine.room.curInstId;
                const newInstance = assetToInstance(baseAsset, nextId, pos);

                if (newInstance){
                    newInstance.setEngine(this.engine);
                    this.engine.addInstance(newInstance);
                    newInstance.onCreate();
                    this.dataCache.set('spawned_instance', newInstance);
                }
                else{
                    this.engine.warn('no_asset_specified');
                }

                this.triggerOutput('_o', eventContext);

                this.dataCache.delete('spawned_instance');
            },
            getAsset(this: iEngineNode){
                return this.dataCache.get('spawned_instance') ?? null;
            },
        }
    },
    {// Get Instances
        id: 'get_instances',
        category: 'actual',
        inputs: [
            {id: 'name', type: SOCKET_TYPE.STRING, default: ''},
            {id: 'group', type: SOCKET_TYPE.STRING, default: ''},
            {id: 'type', type: SOCKET_TYPE.ASSET, default: null},
        ],
        outputs: [
            {id: 'instances', type: SOCKET_TYPE.INSTANCE, isList: true, execute: 'getInstances'},
        ],
        init(this: GenericNode){
            if (isEngineNode(this)) return;

            this.stackDataIO = true;
        },
        methods: {
            getInstances(this: iEngineNode, eventContext: iEventContext){
                const name = this.getInput<string>('name', eventContext);
                const group = this.getInput<string>('group', eventContext);
                const type = this.getInput<Asset_Base>('type', eventContext);
                const instances: Instance_Base[] = [];
                const intersect = type && group;

                this.engine.room.instances.forEach(instance => {
                    if (instance.name == name){
                        instances.push(instance);
                        return;
                    }

                    if (intersect){
                        if (instance.sourceId == type.id && instance.isInGroup(group)){
                            instances.push(instance);
                        }
                    }
                    else{
                        if (instance.sourceId == type?.id || instance.isInGroup(group)){
                            instances.push(instance);
                        }
                    }
                });

                return instances;
            }
        },
    },
    {// Raycast
        id: 'raycast',
        category: 'actual',
        widget: {
            id: 'direction',
            type: WIDGET.DIRECTION,
            options: {
                startDir: [1, 0],
            },
        },
        inputs: [
            {id: 'start_x', type: SOCKET_TYPE.NUMBER, required: false, default: ''},
            {id: 'start_y', type: SOCKET_TYPE.NUMBER, required: false, default: ''},
            {id: 'distance', type: SOCKET_TYPE.NUMBER, required: true, default: 1},
            {id: 'only_solid', type: SOCKET_TYPE.BOOL, default: false},
        ],
        outputs: [
            {id: 'instances', type: SOCKET_TYPE.INSTANCE, isList: true, execute: 'raycast'},
        ],
        init(this: GenericNode){
            if (isEngineNode(this)) return;
            this.stackDataIO = true;
        },
        methods: {
            raycast(this: iEngineNode, eventContext: iEventContext){
                const widgetDir = this.widgetData;
                const startX = this.getInput<number>('start_x', eventContext);
                const startY = this.getInput<number>('start_y', eventContext);
                const distance = this.getInput<number>('distance', eventContext);
                const onlySolid = this.getInput<boolean>('only_solid', eventContext);
                const startPos = new Vector(
                    startX || eventContext.instance.pos.x,
                    startY || eventContext.instance.pos.y,
                );
                const ignoreSelf = (startX || true) || (startY || true);
                const rayVector = new Vector(widgetDir[0], widgetDir[1]).multiplyScalar(distance);
                const nearInstances = this.engine.room.getInstancesInRadius(startPos, distance)
                    .filter(i => {
                        const selfCheck = !ignoreSelf || i.id != eventContext.instance.id;
                        const solidCheck = !onlySolid || i.isSolid;
                        return selfCheck && solidCheck;
                    });
                const halfSpriteDim = Sprite.DIMENSIONS / 2;
                const spriteDim = new Vector(halfSpriteDim, halfSpriteDim);
                const collisions: Instance_Base[] = [];

                for (let i = 0; i < nearInstances.length; i++){
                    const curInstance = nearInstances[i];
                    const curInstancePos = curInstance.pos.clone()
                    const intersect = Util.projectSVF(startPos, rayVector, curInstancePos, spriteDim);

                    intersect && collisions.push(curInstance);
                }

                collisions.sort((a, b)=>{
                    const aDist = a.pos.distanceNoSqrt(startPos);
                    const bDist = b.pos.distanceNoSqrt(startPos);

                    return aDist - bDist;
                });

                return collisions;
            }
        },
    },
    {// Broadcast Message
        id: 'broadcast_message',
        category: 'actual',
        inTriggers: [
            {id: '_i', execute: 'broadcastMessage'},
        ],
        outTriggers: ['_o'],
        inputs: [
            {id: 'name', type: SOCKET_TYPE.STRING, default: ''},
            {id: 'global', type: SOCKET_TYPE.BOOL, default: false},
        ],
        init(this: GenericNode){
            if (!isEngineNode(this)){
                this.inputBoxWidth = 6;
            }
        },
        methods: {
            broadcastMessage(this: iEngineNode, eventContext: iEventContext){
                const name = this.getInput<string>('name', eventContext);
                const global = this.getInput<boolean>('global', eventContext);

                if (name.trim().length < 0) return;
                
                if (global){
                    this.engine.broadcastMessage(name);
                }
                else{
                    eventContext.instance.executeNodeEvent('e_message', {name});
                }

                this.triggerOutput('_o', eventContext);
            }
        },
    },
    {// Timer
        id: 'timer',
        category: 'actual',
        inputs: [
            {id: 'duration', type: SOCKET_TYPE.NUMBER, required: true, default: 0},
            {id: 'step', type: SOCKET_TYPE.NUMBER, required: true, default: 0},
        ],
        outputs: [
            {id: 'elapsed', type: SOCKET_TYPE.NUMBER, execute: 'getElapsed'},
            {id: 'remaining', type: SOCKET_TYPE.NUMBER, execute: 'getRemaining'},
            {id: 'percent', type: SOCKET_TYPE.NUMBER, execute: 'getPercent'},
        ],
        inTriggers: [
            {id: 'start', execute: 'start'},
            {id: 'pause', execute: 'pause'},
            {id: 'reset', execute: 'reset'},
        ],
        outTriggers: ['immediate', 'started', 'tick', 'complete'],
        init(this: GenericNode){
            if (!isEngineNode(this)){
                this.stackDataIO = true;
            }
        },
        methods: {
            start(this: iEngineNode, eventContext: iEventContext){
                const oldData = this.dataCache.get(eventContext.instance.id);

                if (oldData && !oldData.complete){
                    oldData.active = true;
                    this.triggerOutput('immediate', eventContext);
                    return;
                }

                const duration = this.getInput<number>('duration', eventContext) * 1000;
                const step = this.getInput<number>('step', eventContext) * 1000;
                const data = {
                    duration,
                    step,
                    progress: 0,
                    lastTickGap: 0,
                    active: true,
                    complete: false,
                };
                const tickLoop = ()=>{
                    const deltaTimeMS = this.engine.deltaTime * 1000;

                    if (!data) return;
                    
                    if (!this.engine.isRunning) return;

                    if (!data.active){
                        data.lastTickGap = data.step;
                        return;
                    }

                    data.progress = Math.min(data.progress + deltaTimeMS, data.duration);

                    if (data.progress >= data.duration){
                        data.complete = true;
                        this.triggerOutput('complete', eventContext);
                        this.triggerOutput('tick', eventContext);
                        this.dataCache.delete(eventContext.instance.id);
                        return;
                    }

                    if (deltaTimeMS > data.step || data.lastTickGap >= data.step){
                        this.triggerOutput('tick', eventContext);
                        data.lastTickGap = 0;
                    }
                    else{
                        data.lastTickGap += deltaTimeMS;
                    }

                    requestAnimationFrame(tickLoop);
                }

                this.dataCache.set(eventContext.instance.id, data);
                requestAnimationFrame(tickLoop);
                this.triggerOutput('started', eventContext);
                this.triggerOutput('immediate', eventContext);
            },
            pause(this: iEngineNode, eventContext: iEventContext){
                const data = this.dataCache.get(eventContext.instance.id);
                
                if (data){
                    data.active = false;
                }

                this.triggerOutput('immediate', eventContext);
            },
            reset(this: iEngineNode, eventContext: iEventContext){
                this.dataCache.delete(eventContext.instance.id);
                this.triggerOutput('immediate', eventContext);
            },
            getElapsed(this: iEngineNode, eventContext: iEventContext){
                const data = this.dataCache.get(eventContext.instance.id);
                return data ? Math.round(data.progress / 10) / 100 : 0;
            },
            getRemaining(this: iEngineNode, eventContext: iEventContext){
                const data = this.dataCache.get(eventContext.instance.id);
                return data ? Math.round((data.duration - data.progress) / 10) / 100 : 0;
            },
            getPercent(this: iEngineNode, eventContext: iEventContext){
                const data = this.dataCache.get(eventContext.instance.id);
                return data ? data.progress / data.duration : 0;
            },
        },
    },
    {// Random Number
        id: 'random_number',
        category: 'actual',
        inputs: [
            {id: 'lower', type: SOCKET_TYPE.NUMBER, required: true, default: 0},
            {id: 'upper', type: SOCKET_TYPE.NUMBER, required: true, default: 1},
            {id: 'round', type: SOCKET_TYPE.BOOL, default: false},
        ],
        outputs: [
            {id: 'number', type: SOCKET_TYPE.NUMBER, execute: 'getNum'},
        ],
        init(this: GenericNode){
            if (isEngineNode(this)) return;
            this.stackDataIO = true;
        },
        methods: {
            getNum(this: iEngineNode, eventContext: iEventContext){
                const lower = this.getInput<number>('lower', eventContext);
                const upper = this.getInput<number>('upper', eventContext);
                const round = this.getInput<boolean>('round', eventContext);
                const num = Math.random() * (upper - lower) + lower;

                return round ? Math.round(num) : num;
            }
        }
    },
    {// Restart
        id: 'restart_game',
        category: 'actual',
        inTriggers: [
            {id: '_i', execute: 'restartGame'},
        ],
        methods: {
            restartGame(this: iEngineNode){
                this.engine.restart();
            },
        },
    },
    {// Set Animation Playback
        id: 'set_animation_playback',
        category: 'drawing',
        inTriggers: [
            {id: '_i', execute: 'setSettings'},
        ],
        outTriggers: ['_o'],
        inputs: [
            {id: 'instance', type: SOCKET_TYPE.INSTANCE, default: null},
            {id: 'frame', type: SOCKET_TYPE.NUMBER, default: ''},
            {id: 'fps', type: SOCKET_TYPE.NUMBER, default: ''},
            {id: 'loop', type: SOCKET_TYPE.BOOL, default: null, triple: true},
            {id: 'playing', type: SOCKET_TYPE.BOOL, default: null, triple: true},
        ],
        methods: {
            setSettings(this: iEngineNode, eventContext: iEventContext){
                const instance = this.getInput<Instance_Base>('instance', eventContext) ?? eventContext.instance;
                const frame = parseInt(this.getInput<string>('frame', eventContext));
                const fps = parseInt(this.getInput<string>('fps', eventContext));
                const loop = this.getInput<boolean>('loop', eventContext);
                const playing = this.getInput<boolean>('playing', eventContext);

                instance.animFrame = isNaN(frame) ? instance.animFrame : frame;
                instance.fpsOverride = isNaN(fps) ? instance.fps : fps;
                instance.animLoopOverride = loop ?? instance.animLoop;
                instance.animPlaying = playing ?? instance.animPlaying;

                instance.needsRenderUpdate = true;

                this.triggerOutput('_o', eventContext);
            },
        },
    },
    {// Set Sprite
        id: 'set_sprite',
        category: 'drawing',
        widget: {
            id: 'sprite',
            type: WIDGET.ENUM,
            options: {
                items: [],
                showSearch: true,
                showThumbnail: true,
            },
        },
        inTriggers: [
            {id: '_i', execute: 'setSprite'},
        ],
        outTriggers: ['_o'],
        inputs: [
            {id: 'instance', type: SOCKET_TYPE.INSTANCE, default: null, required: true},
        ],
        onBeforeMount(this: iEditorNode){
            const sprites = this.editorAPI.gameDataStore.getAllSprites.map((s: Sprite)=>({
                name: s.name,
                id: s.id,
                value: s.id,
                thumbnail: (()=>{
                    if (s.frameIsEmpty(0)){
                        return Instance_Sprite.DEFAULT_SPRITE_ICON[0];
                    }

                    return s.frames[0];
                })(),
            }));

            this.widget.options.items = sprites;
        },
        methods: {
            setSprite(this: iEngineNode, eventContext: iEventContext){
                const instance = this.getInput<Instance_Base>('instance', eventContext) ?? eventContext.instance;
                const spriteId: number = this.widgetData;
                const sprite = this.engine.gameData.sprites.find(s => s.id == spriteId);

                instance.sprite = sprite ?? null;
                this.engine.refreshRenderedInstance(instance);

                this.triggerOutput('_o', eventContext);
            },
        },
    },
    {// Flip Sprite
        id: 'flip_sprite',
        category: 'drawing',
        inTriggers: [
            {id: '_i', execute: 'flipSprite'},
        ],
        outTriggers: ['_o'],
        inputs: [
            {id: 'instance', type: SOCKET_TYPE.INSTANCE, default: null, required: true},
            {id: 'hFlip', type: SOCKET_TYPE.BOOL, default: false},
            {id: 'vFlip', type: SOCKET_TYPE.BOOL, default: false},
        ],
        methods: {
            flipSprite(this: iEngineNode, eventContext: iEventContext){
                const instance = this.getInput<Instance_Base>('instance', eventContext) ?? eventContext.instance;
                const hFlip = this.getInput<boolean>('hFlip', eventContext);
                const vFlip = this.getInput<boolean>('vFlip', eventContext);

                instance.flipH = hFlip;
                instance.flipV = vFlip;
                instance.needsRenderUpdate = true;

                this.triggerOutput('_o', eventContext);
            },
        },
    },
    {// Set Position
        id: 'set_position',
        category: 'movement',
        inTriggers: [
            {id: '_i', execute: 'setPosition'},
        ],
        outTriggers: ['_o'],
        inputs: [
            {id: 'instance', type: SOCKET_TYPE.INSTANCE, default: null, required: true},
            {id: 'x', type: SOCKET_TYPE.NUMBER, default: '', required: false},
            {id: 'y', type: SOCKET_TYPE.NUMBER, default: '', required: false},
            {id: 'relative', type: SOCKET_TYPE.BOOL, default: false},
        ],
        methods: {
            setPosition(this: iEngineNode, eventContext: iEventContext){
                const instance = this.getInput<Instance_Base>('instance', eventContext) ?? eventContext.instance;
                const xInp = this.getInput<number & string>('x', eventContext);
                const yInp = this.getInput<number & string>('y', eventContext);
                const relative = this.getInput<boolean>('relative', eventContext);
                let newPos: Vector;

                if (relative){
                    const offset = new Vector(
                        xInp === '' ? 0 : xInp,
                        yInp === '' ? 0 : yInp
                    );
                    newPos = offset.add(instance.pos);
                }
                else{
                    newPos = new Vector(
                        xInp === '' ? instance.pos.x : xInp,
                        yInp === '' ? instance.pos.y : yInp
                    );
                }

                this.engine.setInstancePosition(eventContext.instance, newPos);
                
                this.triggerOutput('_o', eventContext);
            },
        },
    },
    {// Jump To
        id: 'jump_to',
        category: 'movement',
        inTriggers: [
            {id: '_i', execute: 'jumpTo'},
        ],
        outTriggers: ['_o'],
        inputs: [
            {id: 'instance', type: SOCKET_TYPE.INSTANCE, default: null, required: true},
            {id: 'x', type: SOCKET_TYPE.NUMBER, default: 0, required: true},
            {id: 'y', type: SOCKET_TYPE.NUMBER, default: 0, required: true},
            {id: 'relative', type: SOCKET_TYPE.BOOL, default: false},
        ],
        methods: {
            jumpTo(this: iEngineNode, eventContext: iEventContext){
                const halfDim = Sprite.DIMENSIONS / 2;
                const instance = this.getInput<Instance_Base>('instance', eventContext) ?? eventContext.instance;
                const x = Math.round(this.getInput<number>('x', eventContext));
                const y = Math.round(this.getInput<number>('y', eventContext));
                const relative = this.getInput<boolean>('relative', eventContext);
                const desiredDest = relative ? new Vector(x, y).add(instance.pos) : new Vector(x, y).subtractScalar(halfDim);

                //jump if no collision on instance
                if (!instance.isSolid){
                    this.engine.setInstancePosition(instance, desiredDest);
                    this.triggerOutput('_o', eventContext);
                    return;
                }

                //round starting position to nearest integer
                instance.pos.round();

                //setup raycast check
                const NORM_OFFSET = 0.0001;
                const instCenter = instance.pos.clone().addScalar(halfDim);
                const checkDim = new Vector(Sprite.DIMENSIONS, Sprite.DIMENSIONS).subtractScalar(NORM_OFFSET); //boxes are made slightly smaller to allow for 1 tile wide paths
                const velocity = desiredDest.clone().subtract(instance.pos);
                const nearBodies = this.engine.room.getInstancesInRadius(instance.pos, velocity.length())
                    .filter(i => {
                        const selfCheck = i.id != instance.id;
                        return selfCheck && i.isSolid;
                    });
                
                let nearestDist = instance.pos.distanceNoSqrt(desiredDest);
                let nearestDest = desiredDest.addScalar(halfDim);
                let nearestCastResult: ReturnType<typeof Util.projectSVF> | null = null;

                //raycast against all instances in vacinity using minkowski addition
                for (let i = 0; i < nearBodies.length; i++){
                    const curBody = nearBodies[i];
                    const curCenter = curBody.pos.clone().addScalar(halfDim);
                    const raycastResult = Util.projectSVF(instCenter, velocity, curCenter, checkDim);

                    if (!raycastResult) continue;

                    const checkDist = instCenter.distanceNoSqrt(raycastResult.point);

                    if (checkDist < nearestDist){
                        nearestDist = checkDist;
                        nearestDest = raycastResult.point;
                        nearestCastResult = raycastResult;
                    }
                }

                //jump if no ray collisions
                if (!nearestCastResult){
                    this.engine.setInstancePosition(instance, nearestDest.subtractScalar(halfDim));
                    this.triggerOutput('_o', eventContext);
                    return;
                }

                //final collision point is offset 
                const normalOffset = nearestCastResult.normal.clone().scale(NORM_OFFSET);
                const finalDest = nearestDest
                    .subtractScalar(halfDim)
                    .add(normalOffset);
                
                //round single axis based on direction of collision normal
                finalDest.x = nearestCastResult.normal.x ? Math.round(finalDest.x) : finalDest.x;
                finalDest.y = nearestCastResult.normal.y ? Math.round(finalDest.y) : finalDest.y;

                //set instance position and continue to next node
                this.engine.setInstancePosition(instance, finalDest);
                this.triggerOutput('_o', eventContext);
            },
            checkExitBacktrack(this: iEngineNode, eventContext: iEventContext, newPos: ConstVector): boolean {
                if (!(eventContext.instance.prevExit && eventContext.instance.prevExit?.exit.detectBacktracking)) return false;

                const direction = newPos.clone().subtract(eventContext.instance.pos).normalize();
                const dot = direction.dot(eventContext.instance.prevExit.direction.clone().multiplyScalar(-1));

                if (dot > 0.75) {
                    eventContext.instance.prevExit.exit.triggerExit(eventContext.instance, direction);
                    return true;
                }

                return false;
            },
        },
    },
    {// Set Velocity
        id: 'set_velocity',
        category: 'movement',
        widget: {
            id: 'direction',
            type: WIDGET.DIRECTION,
            options: {
                startDir: [1, 0],
            },
        },
        inTriggers: [
            {id: '_i', execute: 'setVelocity'}
        ],
        outTriggers: ['_o'],
        inputs: [
            {id: 'instance', type: SOCKET_TYPE.INSTANCE, default: null, required: true},
            {id: 'speed', type: SOCKET_TYPE.NUMBER, default: 10, required: true},
        ],
        methods: {
            setVelocity(this: iEngineNode, eventContext: iEventContext){
                const instance = this.getInput<Instance_Base>('instance', eventContext) ?? eventContext.instance;
                const speed = this.getInput<number>('speed', eventContext);
                const direction = Vector.fromArray(this.widgetData);
                instance.velocity.copy(direction.multiplyScalar(speed));

                this.triggerOutput('_o', eventContext);
            },
        },
    },
    {// Move Direction
        id: 'move_direction',
        category: 'movement',
        widget: {
            id: 'direction',
            type: WIDGET.DIRECTION,
            options: {
                startDir: [1, 0],
            },
        },
        inTriggers: [
            {id: '_i', execute: 'moveDirection'},
        ],
        outTriggers: ['_o'],
        inputs: [
            {id: 'instance', type: SOCKET_TYPE.INSTANCE, default: null, required: true},
            {id: 'speed', type: SOCKET_TYPE.NUMBER, default: 1, required: true},
        ],
        methods: {
            moveDirection(this: iEngineNode, eventContext: iEventContext){
                const instance = this.getInput<Instance_Base>('instance', eventContext) ?? eventContext.instance;
                const speed = this.getInput<number>('speed', eventContext);
                const direction = Vector.fromArray(this.widgetData);
                const velocity = direction.scale(speed);

                instance.moveVector.add(velocity);

                this.triggerOutput('_o', eventContext);
            },
        },
    },
    {// Push Direction
        id: 'push_direction',
        category: 'movement',
        widget: {
            id: 'direction',
            type: WIDGET.DIRECTION,
            options: {
                startDir: [1, 0],
            },
        },
        inTriggers: [
            {id: '_i', execute: 'push'},
        ],
        outTriggers: ['_o'],
        inputs: [
            {id: 'instance', type: SOCKET_TYPE.INSTANCE, default: null, required: true},
            {id: 'strength', type: SOCKET_TYPE.NUMBER, default: 1, required: true},
        ],
        methods: {
            push(this: iEngineNode, eventContext: iEventContext){
                const instance = this.getInput<Instance_Base>('instance', eventContext) ?? eventContext.instance;
                const strength = this.getInput<number>('strength', eventContext);
                const force = Vector.fromArray(this.widgetData).scale(strength);
                instance.applyForce(force);

                this.triggerOutput('_o', eventContext);
            },
        },
    },
    {// Is On Ground
        id: 'is_on_ground',
        category: 'movement',
        outputs: [
            {id: '_o', type: SOCKET_TYPE.BOOL, execute: 'onGround'},
        ],
        methods: {
            onGround(this: iEngineNode, eventContext: iEventContext){
                return eventContext.instance.onGround;
            },
        },
    },
    {// Get Position
        id: 'get_position',
        category: 'movement',
        onBeforeMount(this: iEditorNode){
            this.stackDataIO = true;
        },
        inputs: [
            {id: 'instance', type: SOCKET_TYPE.INSTANCE, default: null, required: true},
        ],
        outputs: [
            {id: 'X', type: SOCKET_TYPE.NUMBER, execute: 'getX'},
            {id: 'Y', type: SOCKET_TYPE.NUMBER, execute: 'getY'},
        ],
        methods: {
            getX(this: iEngineNode, eventContext: iEventContext){
                const instance = this.getInput<Instance_Base | undefined>('instance', eventContext) ?? eventContext.instance;
                return instance.pos.x;
            },
            getY(this: iEngineNode, eventContext: iEventContext){
                const instance = this.getInput<Instance_Base | undefined>('instance', eventContext) ?? eventContext.instance;
                return instance.pos.y;
            },
        },
    },
    {// Get Velocity
        id: 'get_velocity',
        category: 'movement',
        onBeforeMount(this: iEditorNode){
            this.stackDataIO = true;
        },
        inputs: [
            {id: 'instance', type: SOCKET_TYPE.INSTANCE, default: null, required: true},
        ],
        outputs: [
            {id: 'X', type: SOCKET_TYPE.NUMBER, execute: 'getX'},
            {id: 'Y', type: SOCKET_TYPE.NUMBER, execute: 'getY'},
        ],
        methods: {
            getX(this: iEngineNode, eventContext: iEventContext){
                const instance = this.getInput<Instance_Base | undefined>('instance', eventContext) ?? eventContext.instance;
                return instance.totalVelocity.x;
            },
            getY(this: iEngineNode, eventContext: iEventContext){
                const instance = this.getInput<Instance_Base | undefined>('instance', eventContext) ?? eventContext.instance;
                return instance.totalVelocity.y;
            },
        },
    },
    ...Cat_Variables,
];

export const NODE_MAP = new Map<string, iNodeTemplate>();

NODE_LIST.forEach(node => {
    NODE_MAP.set(node.id, node);
});

function convertObjectToString(obj: any): string {
    const output = [];

    if (obj.objRef){
        output.push(obj.objRef.name)
    }
    else if (obj.sprite){
        output.push(obj.sprite.name);
    }

    if (obj.name) output.push(obj.name);

    return output.join(' ');
}