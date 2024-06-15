import {SOCKET_TYPE, WIDGET} from './Node_Enums';
import { iNodeTemplate } from './iNodeTemplate';
import Cat_Events from './Cat_Events';
import Cat_Variables from './Cat_Variables';
import { ConstVector, Vector } from '../Vector';
import { iEditorNode, iEngineNode, iNodeConnection, iNodeSaveData, iEventContext } from '../LogicInterfaces';
import { Asset_Base, Game_Object, Instance_Base, Instance_Object, Instance_Sprite, Sprite, Util, Node_Enums } from '../core';
import { canConvertSocket, assetToInstance, instanceToAsset } from './Socket_Conversions';

type SortableAsset = {sortOrder: number};

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
                    this.onForceUpdate.emit();

                    setTimeout(()=>{
                        this.onUpdateConnections.emit();
                    });
                }
            };

            addBtn.onclick = ()=>{
                const nextOutputName = '#' + (this.outTriggers.size + 1);
                this.outTriggers.set(nextOutputName, {
                    id: nextOutputName,
                    node: this,
                });
                this.onForceUpdate.emit();
                setTimeout(()=>{
                    this.onUpdateConnections.emit();
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

                return i1?.id == i2?.id;
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
                    typeChanged && this.onForceSocketUpdate.emit(input.id);

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
    {// count_loop
        id: 'count_loop',
        category: 'actual',
        stackDataIO: true,
        inputs: [
            {id: 'count', type: SOCKET_TYPE.NUMBER, default: 1},
        ],
        outputs: [
            {id: 'index', type: SOCKET_TYPE.NUMBER, execute: 'getIndex'},
        ],
        inTriggers: [
            {id: '_i', execute: 'runLoop'},
        ],
        outTriggers: ['_o'],
        methods: {
            runLoop(this: iEngineNode, eventContext: iEventContext){
                const count = this.getInput<number>('count', eventContext);

                for (let i = 0; i < count; i++){
                    this.dataCache.set(eventContext.eventKey, {index: i, length: count});
                    this.triggerOutput('_o', eventContext);
                }

                this.dataCache.delete(eventContext.eventKey);
            },
            getIndex(this: iEngineNode, eventContext: iEventContext){
                const data = this.dataCache.get(eventContext.eventKey);
                return data?.index ?? 0;
            },
        },
    },
    {// list_loop
        id: 'list_loop',
        category: 'actual',
        stackDataIO: true,
        inputs: [
            {id: 'list', type: SOCKET_TYPE.ANY, hideInput: true, isList: true, default: []},
        ],
        outputs: [
            {id: 'index', type: SOCKET_TYPE.NUMBER, execute: 'getIndex'},
            {id: 'item', type: SOCKET_TYPE.ANY, execute: 'getItem'},
        ],
        inTriggers: [
            {id: '_i', execute: 'runLoop'},
        ],
        outTriggers: ['_o'],
        onNewConnection(this: iEditorNode){
            setTimeout(()=>this.refresh());
        },
        onRemoveConnection(this: iEditorNode){
            setTimeout(()=>this.refresh());
        },
        refresh(this: iEditorNode){
            const listInput = this.inputs.get('list')!;
            const itemOutput = this.outputs.get('item')!;
            const listConnectedSocket = this.editorAPI.getConnectedInputSocket(this, 'list');
            const socketType = listConnectedSocket?.type ?? SOCKET_TYPE.ANY;
            const downStream = this.editorAPI.getOutputConnections(this, 'item');

            listInput.type = socketType;
            itemOutput.type = socketType;
            downStream.forEach(connection => {
                const endNode = connection.endNode!;
                const connectedSocket = endNode.inputs.get(connection.endSocketId!);

                endNode.refresh();

                if (!connectedSocket) return;

                if (!canConvertSocket(socketType, connectedSocket.type)){
                    if (!this.editorAPI.undoStore.isRecording) return;
                    this.editorAPI.deleteConnections([connection], true);
                    connection.onForceUpdate.emit();
                }
            });
            this.editorAPI.nextTick(()=>{
                this.onForceSocketUpdate.emit('list');
                this.onForceSocketUpdate.emit('item');
            });
        },
        methods: {
            runLoop(this: iEngineNode, eventContext: iEventContext){
                const list = this.getInput<any[]>('list', eventContext);

                if (list && list.length){
                    for (let i = 0; i < list.length; i++){
                        this.dataCache.set(eventContext.eventKey, {index: i, item: list[i]});
                        this.triggerOutput('_o', eventContext);
                    }
                }

                this.dataCache.delete(eventContext.eventKey);
            },
            getIndex(this: iEngineNode, eventContext: iEventContext){
                const data = this.dataCache.get(eventContext.eventKey);
                return data?.index ?? 0;
            },
            getItem(this: iEngineNode, eventContext: iEventContext){
                const data = this.dataCache.get(eventContext.eventKey);
                return data?.item ?? null;
            },
        },
    },
    {// Add to List
        id: 'add_to_list',
        category: 'actual',
        inputs: [
            {id: 'list', type: SOCKET_TYPE.ANY, hideInput: true, isList: true, default: []},
            {id: 'item', type: SOCKET_TYPE.ANY, hideInput: true, default: null},
        ],
        outputs: [
            {id: '_o', type: SOCKET_TYPE.ANY, isList: true, execute: 'getList'},
        ],
        onMount(this: iEditorNode){
            this.refresh();
        },
        onNewConnection(this: iEditorNode){
            setTimeout(()=>this.refresh());
        },
        onRemoveConnection(this: iEditorNode){
            setTimeout(()=>this.refresh());
        },
        refresh(this: iEditorNode){
            const hasList = !!this.editorAPI.getInputConnection(this, 'list');
            const listInput = this.inputs.get('list')!;
            const itemInput = this.inputs.get('item')!;
            const listOutput = this.outputs.get('_o')!;
            const listConnectionType = hasList ? this.editorAPI.getConnectedInputSocket(this, 'list')!.type : null;
            const itemInputConnection = this.editorAPI.getInputConnection(this, 'item');
            const listOutputConnections = this.editorAPI.getOutputConnections(this, '_o');
            const deleteConnections: iNodeConnection[] = [];
            const type = listConnectionType ?? SOCKET_TYPE.ANY;

            listInput.type = type;
            itemInput.type = type;
            listOutput.type = type;

            if (itemInputConnection && !this.method('editor_validateConnection', [itemInputConnection, false])){
                deleteConnections.push(itemInputConnection);
            }
            
            listOutputConnections.forEach(c => {
                c.endNode?.refresh();
                
                if (!this.method('editor_validateConnection', [c, true])){
                    deleteConnections.push(c);
                }
            });

            if (deleteConnections.length > 0){
                if (!this.editorAPI.undoStore.isRecording) return;
                this.editorAPI.deleteConnections(deleteConnections, true);
                deleteConnections[0].onForceUpdate.emit();
            }

            this.editorAPI.nextTick(()=>{
                this.onForceSocketUpdate.emit('list');
                this.onForceSocketUpdate.emit('item');
                this.onForceSocketUpdate.emit('_o');
            });
        },
        methods: {
            getList(this: iEngineNode, eventContext: iEventContext){
                const list = this.getInput<any[]>('list', eventContext);
                const item = this.getInput<any>('item', eventContext);
                const outputList = [...list];

                (item != null) && outputList.push(item);

                return outputList;
            },
            editor_validateConnection(this: iEditorNode, [connection, forward] : [iNodeConnection, boolean]): boolean {
                const thisType = this.inputs.get('list')!.type;
                const otherSocketId = forward ? connection.endSocketId! : connection.startSocketId!;
                const otherSocketList = forward ? connection.endNode!.inputs : connection.startNode!.outputs;
                const otherSocketType = otherSocketList.get(otherSocketId)!.type;

                return forward ? canConvertSocket(thisType, otherSocketType) : canConvertSocket(otherSocketType, thisType);
            }
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
        onBeforeMount(this: iEditorNode){
            this.refresh();
        },
        onNewConnection(this: iEditorNode, connection: iNodeConnection){
            setTimeout(()=>this.refresh());
        },
        onRemoveConnection(this: iEditorNode, connection: iNodeConnection){
            setTimeout(()=>this.refresh());
        },
        refresh(this: iEditorNode){
            const srcConnection = this.editorAPI.getInputConnection(this, '_list');
            const getConnectedSocket = srcConnection ? this.editorAPI.getConnectedInputSocket(this, '_list', srcConnection) : undefined;
            const inputSocket = this.inputs.get('_list')!;
            const srcType = getConnectedSocket?.type ?? SOCKET_TYPE.ANY;

            inputSocket.type = srcType;

            if (srcConnection && !canConvertSocket(srcType, inputSocket.type)){
                const isRecording = this.editorAPI.undoStore.isRecording;
                this.editorAPI.deleteConnections([srcConnection], isRecording);
            }

            this.onForceSocketUpdate.emit('_list');
        },
        methods: {
            getLength(this: iEngineNode, eventContext: iEventContext){
                const list = this.getInput<any[] | null>('_list', eventContext);

                return list?.length ?? 0;
            },
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
                            this.engine.nodeException({
                                errorId: Symbol(),
                                msgId: 'div_zero',
                                logicId: this.parentScript.id,
                                nodeId: this.nodeId,
                                fatal: true,
                            });
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
                const instance = this.throwOnNullInput<Instance_Base | null>('instance', eventContext, 'null_instance', false) ?? eventContext.instance;

                if (instance != Node_Enums.THROWN){
                    const removeInst = instance ?? eventContext.instance;
                    this.engine.removeInstance(removeInst);
                }

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
                sortOrder: o.sortOrder,
                thumbnail: (()=>{
                    const thumbFrame = o.sprite?.frames[o.startFrame];

                    if (!(thumbFrame && o.sprite)){
                        return Instance_Object.DEFAULT_INSTANCE_ICON[0];
                    }

                    return o.sprite.frameIsEmpty(o.startFrame) ? Instance_Object.DEFAULT_INSTANCE_ICON[0] : o.sprite?.frames[o.startFrame];
                })()
            })).sort((a: SortableAsset, b: SortableAsset)=>a.sortOrder - b.sortOrder);

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
        stackDataIO: true,
        inputs: [
            {id: 'instance', type: SOCKET_TYPE.INSTANCE, default: null, required: true},
        ],
        outputs: [
            {id: 'Type', type: SOCKET_TYPE.ASSET, execute: 'getAsset'},
            {id: 'name', type: SOCKET_TYPE.STRING, execute: 'getName'},
        ],
        methods: {
            getAsset(this: iEngineNode, eventContext: iEventContext){
                const instance = this.throwOnNullInput<Instance_Base | null>('instance', eventContext, 'null_instance', true) ?? eventContext.instance;
                return instanceToAsset(instance, this.engine.gameData);
            },
            getName(this: iEngineNode, eventContext: iEventContext){
                const instance = this.throwOnNullInput<Instance_Base | null>('instance', eventContext, 'null_instance', false) ?? eventContext.instance;

                if (instance == Node_Enums.THROWN){
                    return '####';
                }

                return instance.name
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
            {id: 'type', type: SOCKET_TYPE.ASSET, default: null, required: true},
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

                if (!baseAsset){
                    this.engine.nodeException({
                        errorId: Symbol(),
                        msgId: 'null_asset',
                        logicId: this.parentScript.id,
                        nodeId: this.nodeId,
                        fatal: true,
                    });
                    throw new Error('Asset type undefined');
                }

                const x = this.getInput<number>('x', eventContext);
                const y = this.getInput<number>('y', eventContext);
                const relative = this.getInput<boolean>('relative', eventContext);
                const pos = relative ? new Vector(x, y).add(eventContext.instance.pos) : new Vector(x, y);
                const nextId = this.engine.room.curInstId;
                const newInstance = assetToInstance(baseAsset, nextId, pos);
                let instanceMap = this.dataCache.get('instanceMap');

                //create instanceMap
                if (!instanceMap){
                    instanceMap = new WeakMap();
                    this.dataCache.set('instanceMap', instanceMap);
                }

                if (newInstance){
                    newInstance.setEngine(this.engine);
                    this.engine.addInstance(newInstance);
                    newInstance.onCreate();
                    instanceMap.set(eventContext, newInstance);
                }
                else{
                    this.engine.warn('error_creating_asset');
                }

                this.triggerOutput('_o', eventContext);
            },
            getAsset(this: iEngineNode, eventContext: iEventContext){
                const instanceMap = this.dataCache.get('instanceMap');
                return instanceMap.get(eventContext) ?? null;
            },
        }
    },
    {// Get Instances
        id: 'get_instances',
        category: 'actual',
        stackDataIO: true,
        inputs: [
            {id: 'name', type: SOCKET_TYPE.STRING, default: ''},
            {id: 'group', type: SOCKET_TYPE.STRING, default: ''},
            {id: 'type', type: SOCKET_TYPE.ASSET, default: null},
        ],
        outputs: [
            {id: 'instances', type: SOCKET_TYPE.INSTANCE, isList: true, execute: 'getInstances'},
        ],
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
    {// Is In Group
        id: 'is_in_group',
        category: 'actual',
        inputs: [
            {id: 'group', type: SOCKET_TYPE.STRING, default: ''},
            {id: 'instance', type: SOCKET_TYPE.INSTANCE, required: true, default: null}
        ],
        outputs: [
            {id: '_o', type: SOCKET_TYPE.BOOL, execute: 'isInGroup'},
        ],
        methods: {
            isInGroup(this: iEngineNode, eventContext: iEventContext){
                const group = this.getInput<string>('group', eventContext);
                const instance = this.throwOnNullInput<Instance_Base | null>('instance', eventContext, 'null_instance', false) ?? eventContext.instance;

                if (instance == Node_Enums.THROWN){
                    return false;
                }

                return !!instance.groups.find(i => i == group);
            }
        }
    },
    {// Raycast
        id: 'raycast',
        category: 'actual',
        stackDataIO: true,
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
        inputBoxWidth: 6,
        inTriggers: [
            {id: '_i', execute: 'broadcastMessage'},
        ],
        outTriggers: ['_o'],
        inputs: [
            {id: 'name', type: SOCKET_TYPE.STRING, default: ''},
            {id: 'global', type: SOCKET_TYPE.BOOL, default: false},
        ],
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
        stackDataIO: true,
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
        stackDataIO: true,
        inputs: [
            {id: 'lower', type: SOCKET_TYPE.NUMBER, required: true, default: 0},
            {id: 'upper', type: SOCKET_TYPE.NUMBER, required: true, default: 1},
            {id: 'round', type: SOCKET_TYPE.BOOL, default: false},
        ],
        outputs: [
            {id: 'number', type: SOCKET_TYPE.NUMBER, execute: 'getNum'},
        ],
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
            {id: 'instance', type: SOCKET_TYPE.INSTANCE, required: true, default: null},
            {id: 'frame', type: SOCKET_TYPE.NUMBER, default: ''},
            {id: 'fps', type: SOCKET_TYPE.NUMBER, default: ''},
            {id: 'loop', type: SOCKET_TYPE.BOOL, default: null, triple: true},
            {id: 'playing', type: SOCKET_TYPE.BOOL, default: null, triple: true},
        ],
        methods: {
            setSettings(this: iEngineNode, eventContext: iEventContext){
                const instance = this.throwOnNullInput<Instance_Base | null>('instance', eventContext, 'null_instance', false) ?? eventContext.instance;
                const frame = parseInt(this.getInput<string>('frame', eventContext));
                const fps = parseInt(this.getInput<string>('fps', eventContext));
                const loop = this.getInput<boolean | null>('loop', eventContext);
                const playing = this.getInput<boolean | null>('playing', eventContext);

                if (!instance || instance == Node_Enums.THROWN){
                    this.triggerOutput('_o', eventContext);
                    return;
                }

                if (!isNaN(frame)){
                    instance.animFrame = frame;
                }
                
                if (!isNaN(fps)){
                    instance.fpsOverride = fps;
                }
                
                if (loop != null){
                    instance.animLoopOverride = loop;
                }
                
                if (playing != null){
                    instance.animPlaying = playing;
                }

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
            const genericNoOption = {
                name: this.editorAPI.t('generic.no_option'),
                id: -1,
                value: null,
            };
            const sprites = this.editorAPI.gameDataStore.getAllSprites.map((s: Sprite)=>({
                name: s.name,
                id: s.id,
                value: s.id,
                sortOrder: s.sortOrder,
                thumbnail: (()=>{
                    if (s.frameIsEmpty(0)){
                        return Instance_Sprite.DEFAULT_SPRITE_ICON[0];
                    }

                    return s.frames[0];
                })(),
            })).sort((a: SortableAsset, b: SortableAsset)=>a.sortOrder - b.sortOrder);

            this.widget.options.items = [genericNoOption, ...sprites];
        },
        methods: {
            setSprite(this: iEngineNode, eventContext: iEventContext){
                const instance = this.throwOnNullInput<Instance_Base | null>('instance', eventContext, 'null_instance', false) ?? eventContext.instance;
                const spriteId: number = this.widgetData;
                const sprite = this.engine.gameData.sprites.find(s => s.id == spriteId);

                if (instance != Node_Enums.THROWN){
                    instance.sprite = sprite ?? null;
                    this.engine.refreshRenderedInstance(instance);
                }

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
                const instance = this.throwOnNullInput<Instance_Base | null>('instance', eventContext, 'null_instance', false) ?? eventContext.instance;
                const hFlip = this.getInput<boolean>('hFlip', eventContext);
                const vFlip = this.getInput<boolean>('vFlip', eventContext);

                if (instance != Node_Enums.THROWN){
                    instance.flipH = hFlip;
                    instance.flipV = vFlip;
                    instance.needsRenderUpdate = true;
                }

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
                const instance = this.throwOnNullInput<Instance_Base | null>('instance', eventContext, 'null_instance', false) ?? eventContext.instance;
                const xInp = this.getInput<number & string>('x', eventContext);
                const yInp = this.getInput<number & string>('y', eventContext);
                const relative = this.getInput<boolean>('relative', eventContext);
                let newPos: Vector;

                if (instance == Node_Enums.THROWN){
                    this.triggerOutput('_o', eventContext);
                    return;
                }

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
                const instance = this.throwOnNullInput<Instance_Base | null>('instance', eventContext, 'null_instance', false) ?? eventContext.instance;
                const x = Math.round(this.getInput<number>('x', eventContext));
                const y = Math.round(this.getInput<number>('y', eventContext));
                const relative = this.getInput<boolean>('relative', eventContext);

                if (instance == Node_Enums.THROWN){
                    this.triggerOutput('_o', eventContext);
                    return;
                }

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
                const instance = this.throwOnNullInput<Instance_Base | null>('instance', eventContext, 'null_instance', false) ?? eventContext.instance;
                const speed = this.getInput<number>('speed', eventContext);
                const direction = Vector.fromArray(this.widgetData);

                if (instance != Node_Enums.THROWN){
                    instance.velocity.copy(direction.multiplyScalar(speed));
                }

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
                const instance = this.throwOnNullInput<Instance_Base | null>('instance', eventContext, 'null_instance', false) ?? eventContext.instance;
                const speed = this.getInput<number>('speed', eventContext);
                const direction = Vector.fromArray(this.widgetData);
                const velocity = direction.scale(speed);

                if (instance != Node_Enums.THROWN){
                    instance.moveVector.add(velocity);
                }

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
                const instance = this.throwOnNullInput<Instance_Base | null>('instance', eventContext, 'null_instance', false) ?? eventContext.instance;
                const strength = this.getInput<number>('strength', eventContext);
                const force = Vector.fromArray(this.widgetData).scale(strength);

                if (instance != Node_Enums.THROWN){
                    instance.applyForce(force);
                }

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
                const instance = this.throwOnNullInput<Instance_Base | null>('instance', eventContext, 'null_instance', true) ?? eventContext.instance;
                return instance.pos.x;
            },
            getY(this: iEngineNode, eventContext: iEventContext){
                const instance = this.throwOnNullInput<Instance_Base | null>('instance', eventContext, 'null_instance', true) ?? eventContext.instance;
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
                const instance = this.throwOnNullInput<Instance_Base | null>('instance', eventContext, 'null_instance', true) ?? eventContext.instance;
                return instance.totalVelocity.x;
            },
            getY(this: iEngineNode, eventContext: iEventContext){
                const instance = this.throwOnNullInput<Instance_Base | null>('instance', eventContext, 'null_instance', true) ?? eventContext.instance;
                return instance.totalVelocity.y;
            },
        },
    },
    {
        id: 'get_distance',
        category: 'movement',
        inputs: [
            {id: 'x1', type: SOCKET_TYPE.NUMBER, default: 0},
            {id: 'y1', type: SOCKET_TYPE.NUMBER, default: 0},
            {id: 'x2', type: SOCKET_TYPE.NUMBER, default: 0},
            {id: 'y2', type: SOCKET_TYPE.NUMBER, default: 0},
        ],
        outputs: [
            {id: 'distance', type: SOCKET_TYPE.NUMBER, execute: 'getDistance'},
        ],
        methods: {
            getDistance(this: iEngineNode, eventContext: iEventContext){
                const x1 = this.getInput<number>('x1', eventContext);
                const y1 = this.getInput<number>('y1', eventContext);
                const x2 = this.getInput<number>('x2', eventContext);
                const y2 = this.getInput<number>('y2', eventContext);
                const dx = x1 - x2;
                const dy = y1 - y2;

                return Math.sqrt(dx * dx + dy * dy);
            },
        },
    },
    {// Set Physics
        id: 'set_physics',
        category: 'movement',
        inTriggers: [
            {id: '_i', execute: 'setPhysics'},
        ],
        outTriggers: ['_o'],
        inputs: [
            {id: 'instance', type: SOCKET_TYPE.INSTANCE, default: null, required: true},
            {id: 'solid', type: SOCKET_TYPE.BOOL, triple: true, default: null},
            {id: 'gravity', type: SOCKET_TYPE.BOOL, triple: true, default: null},
        ],
        methods: {
            setPhysics(this: iEngineNode, eventContext: iEventContext){
                const instance = this.throwOnNullInput<Instance_Base | null>('instance', eventContext, 'null_instance', false) ?? (eventContext.instance as Instance_Base);
                const solid = this.getInput<boolean | null>('solid', eventContext);
                const gravity = this.getInput<boolean | null>('gravity', eventContext);

                if (instance == Node_Enums.THROWN){
                    this.triggerOutput('_o', eventContext);
                    return;
                }

                if (solid != null){
                    instance.isSolid = solid;
                }

                if (gravity != null){
                    instance.applyGravity = gravity;
                }

                this.triggerOutput('_o', eventContext);
            }
        }
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