import { iNodeTemplate } from "./iNodeTemplate";
import { iEngineNode, iEditorNode, iNodeSaveData, iEventContext, iNodeConnection } from "../LogicInterfaces";
import { canConvertSocket } from './Socket_Conversions';
import { SOCKET_TYPE, WIDGET } from "./Node_Enums";
import { Asset_Base, GenericNode, isEngineNode } from "../core";

const catFlow: iNodeTemplate[] = [];
export default catFlow;

{// Branch
    function checkCondition(this: iEngineNode, eventContext: iEventContext): void {
        const conditionVal = this.getInput<boolean>('condition', eventContext);
        const out = conditionVal ? 'true' : 'false';
        this.triggerOutput(out, eventContext);
    }

    const branch = {
        id: 'branch',
        category: 'flow',
        inTriggers: [
            {id: '_i', execute: checkCondition},
        ],
        outTriggers: ['true', 'false'],
        inputs: [
            {id: 'condition', type: SOCKET_TYPE.BOOL, default: false},
        ],
    };
    catFlow.push(branch);
}

{// Sequence
    function startSequence(this: iEngineNode, eventContext: iEventContext): void {
        for (let i = 0; i < this.outTriggers.size; i++){
            const id = '#' + (i + 1);
            this.triggerOutput(id, eventContext);
        }
    }

    const sequence = {
        id: 'sequence',
        category: 'flow',
        inTriggers: [
            {id: '_i', execute: startSequence},
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
    };
    catFlow.push(sequence);
}

{// Compare
    function compare(this: iEngineNode, eventContext: iEventContext): boolean {
        const compareFunc = this.getWidgetData();
        const inp1 = this.getInput<number>('_inp1', eventContext);
        const inp2 = this.getInput<number>('_inp2', eventContext);

        switch(compareFunc){
            case 'equal_sym': return inp1 == inp2;
            case 'gt': return inp1 > inp2;
            case 'lt': return inp1 < inp2;
            case 'gte': return inp1 >= inp2;
            case 'lte': return inp1 <= inp2;
            default: return false;
        }
    }

    const compareNode = {
        id: 'compare_numbers',
        category: 'flow',
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
            {id: 'result', type: SOCKET_TYPE.BOOL, execute: compare},
        ],
    };
    catFlow.push(compareNode);
}

{// Compare Instances
    function getResult(this: iEngineNode, eventContext: iEventContext): boolean {
        const i1 = this.getInput<Asset_Base | null>('_i1', eventContext);
        const i2 = this.getInput<Asset_Base | null>('_i2', eventContext);

        if (i1 == null || i2 == null){
            this.engine.nodeException({
                errorId: Symbol(),
                msgId: 'null_asset',
                logicId: this.parentScript.id,
                nodeId: this.nodeId,
                fatal: false,
            });
            return false;
        }

        return i1.id == i2.id;
    }

    function editor_setSocketType(this: iEditorNode): void {
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

    const compareInstance = {
        id: 'compare_instances',
        category: 'flow',
        widget: {
            id: 'type',
            type: WIDGET.ENUM,
            options: {
                items: ['compare_instance', 'compare_type'],
            },
        },
        onBeforeMount(this: iEditorNode){
            editor_setSocketType.call(this);
        },
        onValueChange(this: iEditorNode){
            editor_setSocketType.call(this);
        },
        inputs: [
            {id: '_i1', type: SOCKET_TYPE.ASSET, default: null},
            {id: '_i2', type: SOCKET_TYPE.ASSET, default: null},
        ],
        outputs: [
            {id: 'result', type: SOCKET_TYPE.BOOL, execute: getResult},
        ],
    };
    catFlow.push(compareInstance);
}

{// Logic
    function result(this: iEngineNode, eventContext: iEventContext): boolean {
        const logicFunc = this.getWidgetData();
        const inp1 = this.getInput<boolean>('_inp1', eventContext);
        const inp2 = this.getInput<boolean>('_inp2', eventContext);

        switch(logicFunc){
            case 'and': return inp1 && inp2;
            case 'or': return inp1 || inp2;
            case 'xor': return !!(+inp1 ^ +inp2);
            default: return false;
        }
    };

    const logic = {
        id: 'logic',
        category: 'flow',
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
            {id: 'result', type: SOCKET_TYPE.BOOL, execute: result},
        ],
    };
    catFlow.push(logic);
}

{// count_loop
    type NodeData = Map<number, {index: number, length: number}>;

    function runLoop(this: iEngineNode, eventContext: iEventContext): void {
        const count = this.getInput<number>('count', eventContext);
        const nodeData = this.getNodeData<NodeData>();

        for (let i = 0; i < count; i++){
            nodeData.set(eventContext.eventKey, {index: i, length: count})
            this.triggerOutput('_o', eventContext);
        }

        nodeData.delete(eventContext.eventKey);
    }

    function getIndex(this: iEngineNode, eventContext: iEventContext): number {
        const data = this.getNodeData<NodeData>().get(eventContext.eventKey);
        return data?.index ?? 0;
    }

    const countLoop = {
        id: 'count_loop',
        category: 'flow',
        stackDataIO: true,
        inputs: [
            {id: 'count', type: SOCKET_TYPE.NUMBER, default: 1},
        ],
        outputs: [
            {id: 'index', type: SOCKET_TYPE.NUMBER, execute: getIndex},
        ],
        inTriggers: [
            {id: '_i', execute: runLoop},
        ],
        outTriggers: ['_o'],
        init(this: GenericNode){
            if (!isEngineNode(this)) return;

            this.setNodeData<NodeData>(new Map());
        },
    };
    catFlow.push(countLoop);
    
}

{// list_loop
    type NodeData = Map<number, {index: number, item: any}>;

    function runLoop(this: iEngineNode, eventContext: iEventContext): void {
        const list = this.getInput<any[]>('list', eventContext);
        const nodeData = this.getNodeData<NodeData>();

        if (list && list.length){
            for (let i = 0; i < list.length; i++){
                nodeData.set(eventContext.eventKey, {index: i, item: list[i]});
                this.triggerOutput('_o', eventContext);
            }
        }

        nodeData.delete(eventContext.eventKey);
    }

    function getIndex(this: iEngineNode, eventContext: iEventContext): number {
        const data = this.getNodeData<NodeData>().get(eventContext.eventKey);
        return data?.index ?? 0;
    }

    function getItem(this: iEngineNode, eventContext: iEventContext): number | null {
        const data = this.getNodeData<NodeData>().get(eventContext.eventKey);
        return data?.item ?? null;
    }

    const listLoop = {
        id: 'list_loop',
        category: 'flow',
        stackDataIO: true,
        inputs: [
            {id: 'list', type: SOCKET_TYPE.ANY, hideInput: true, isList: true, default: []},
        ],
        outputs: [
            {id: 'index', type: SOCKET_TYPE.NUMBER, execute: getIndex},
            {id: 'item', type: SOCKET_TYPE.ANY, execute: getItem},
        ],
        inTriggers: [
            {id: '_i', execute: runLoop},
        ],
        outTriggers: ['_o'],
        init(this: GenericNode){
            if (!isEngineNode(this)) return;
            this.setNodeData<NodeData>(new Map());
        },
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
    }
    catFlow.push(listLoop);
}

{// Add to List
    function getList(this: iEngineNode, eventContext: iEventContext): any[] {
        const list = this.getInput<any[]>('list', eventContext);
        const item = this.getInput<any>('item', eventContext);
        const outputList = [...list];

        (item != null) && outputList.push(item);

        return outputList;
    }

    function editor_validateConnection(this: iEditorNode, connection: iNodeConnection, forward: boolean): boolean {
        const thisType = this.inputs.get('list')!.type;
        const otherSocketId = forward ? connection.endSocketId! : connection.startSocketId!;
        const otherSocketList = forward ? connection.endNode!.inputs : connection.startNode!.outputs;
        const otherSocketType = otherSocketList.get(otherSocketId)!.type;

        return forward ? canConvertSocket(thisType, otherSocketType) : canConvertSocket(otherSocketType, thisType);
    }

    const addToList = {
        id: 'add_to_list',
        category: 'flow',
        inputs: [
            {id: 'list', type: SOCKET_TYPE.ANY, hideInput: true, isList: true, default: []},
            {id: 'item', type: SOCKET_TYPE.ANY, hideInput: true, default: null},
        ],
        outputs: [
            {id: '_o', type: SOCKET_TYPE.ANY, isList: true, execute: getList},
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

            if (itemInputConnection && !editor_validateConnection.call(this, itemInputConnection, false)){
                deleteConnections.push(itemInputConnection);
            }
            
            listOutputConnections.forEach(c => {
                c.endNode?.refresh();
                
                if (!editor_validateConnection.call(this, c, true)){
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
    };
    catFlow.push(addToList);
}

{// List Length
    function getLength(this: iEngineNode, eventContext: iEventContext): number {
        const list = this.getInput<any[] | null>('_list', eventContext);

        return list?.length ?? 0;
    }

    const listLength = {
        id: 'list_length',
        category: 'flow',
        inputs: [
            {id: '_list', type: SOCKET_TYPE.ANY, hideInput: true, isList: true, default: null},
        ],
        outputs: [
            {id: 'length', type: SOCKET_TYPE.NUMBER, execute: getLength},
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
    };
    catFlow.push(listLength);
}

{// Not
    function not(this: iEngineNode, eventContext: iEventContext): boolean {
        return !this.getInput<boolean>('_inp', eventContext);
    }

    const notNode = {
        id: 'not',
        category: 'flow',
        inputs: [
            {id: '_inp', type: SOCKET_TYPE.BOOL, default: false},
        ],
        outputs: [
            {id: '_out', type: SOCKET_TYPE.BOOL, execute: not},
        ],
    };
    catFlow.push(notNode);
}

{// Debug Log
    function log(this: iEngineNode, eventContext: iEventContext): void {
        const label = this.getInput<string>('label', eventContext);
        const data = this.getInput<any>('_data', eventContext, false);
        let src = [this.parentScript.name];
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

        // Only include graph ID if there is more than one graph
        if (this.parentScript.graphNames.size > 1){
            src.push(this.parentScript.graphNames.get(this.graphId) ?? '! No Graph ID !');
        }

        this.engine.log(src, output);

        this.triggerOutput('_o', eventContext);
    }

    const debugLog = {
        id: 'debug_log',
        category: 'flow',
        inTriggers: [
            {id: '_i', execute: log}
        ],
        outTriggers: ['_o'],
        inputs: [
            {id: 'label', type: SOCKET_TYPE.STRING, default: ''},
            {id: '_data', type: SOCKET_TYPE.ANY, default: null},
        ],
    };
    catFlow.push(debugLog);
}

{// Note
    const node = {
        id: 'note',
        category: 'flow',
        widget: {
            id: 'text',
            type: WIDGET.TEXT_AREA,
        },
        onMount(this: iEditorNode){
            const el = this.domRef!;
            el.style.background = '#0088ff10';
        },
    };
    catFlow.push(node);
}

{// Key Input
    function getKey(this: iEngineNode): string {
        return this.getWidgetData().code ?? '';
    }

    function isDown(this: iEngineNode): boolean {
        const keymap = this.engine.keyMap;
        const input = this.getWidgetData().code;
        const mapCheck = keymap.get(input);

        return mapCheck == 'down' || mapCheck == 'pressed';
    }

    const keyInput = {
        id: 'key_input',
        category: 'flow',
        widget: {
            id: 'key_selector',
            type: WIDGET.KEY,
        },
        outputs: [
            {id: 'key', type: SOCKET_TYPE.STRING, execute: getKey},
            {id: 'is_down', type: SOCKET_TYPE.BOOL, execute: isDown},
        ],
    };
    catFlow.push(keyInput);
}

{// Math
    function compute(this: iEngineNode, eventContext: iEventContext): number {
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
                        fatal: false,
                    });
                    return 0;
                }
                return num1 / num2;
            case 'power': return Math.pow(num1, num2);
        }

        return 0;
    }

    const math = {
        id: 'math',
        category: 'flow',
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
            {id: '_out', type: SOCKET_TYPE.NUMBER, execute: compute},
        ],
    };
    catFlow.push(math);
}

{// Dialog Box
    function startDialog(this: iEngineNode, eventContext: iEventContext): void {
        const textArea = this.getWidgetData();
        const textBox = this.getInput<string>('text', eventContext);
        const interactKey = this.getInput<string>('interaction_key', eventContext) ?? 'Space';
        const shouldPause = this.getInput<boolean>('pause_game', eventContext);
        const isFullscreen = this.getInput<boolean>('fullscreen', eventContext);
        const text = textBox ? textBox : textArea;
        const dialogBox = this.engine.openDialogBox(text, shouldPause, isFullscreen, interactKey);

        dialogBox.onClose.listen(userClosed => {
            if (!userClosed){
                this.engine.warn([this.parentScript.name, this.parentScript.graphNames.get(this.graphId) ?? ''], 'double_dialog');
                return;
            }

            this.triggerOutput('dialog_closed', eventContext);
        }, {once:true});

        this.triggerOutput('immediate', eventContext);
    }

    const dialogBox = {
        id: 'dialog_box',
        category: 'flow',
        widget: {
            id: 'text',
            type: WIDGET.TEXT_AREA,
        },
        inTriggers: [
            {id: '_i', execute: startDialog},
        ],
        outTriggers: ['immediate', 'dialog_closed'],
        inputs: [
            {id: 'text', type: SOCKET_TYPE.STRING, hideInput: true, default: ''},
            {id: 'interaction_key', type: SOCKET_TYPE.STRING, hideInput: true, default: null},
            {id: 'pause_game', type: SOCKET_TYPE.BOOL, default: false},
            {id: 'fullscreen', type: SOCKET_TYPE.BOOL, default: false},
        ],
    };
    catFlow.push(dialogBox);
}

{// Broadcast Message
    function broadcastMessage(this: iEngineNode, eventContext: iEventContext): void {
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

    const broadCastMessageNode = {
        id: 'broadcast_message',
        category: 'flow',
        inputBoxWidth: 6,
        inTriggers: [
            {id: '_i', execute: broadcastMessage},
        ],
        outTriggers: ['_o'],
        inputs: [
            {id: 'name', type: SOCKET_TYPE.STRING, default: ''},
            {id: 'global', type: SOCKET_TYPE.BOOL, default: false},
        ],
    };
    catFlow.push(broadCastMessageNode);
}

{// Timer
    type NodeData = Map<number, {
        duration: number,
        step: number,
        progress: number,
        lastTickGap: number,
        active: boolean,
        complete: boolean,
    }>;

    function start(this: iEngineNode, eventContext: iEventContext): void {
        const nodeData = this.getNodeData<NodeData>();
        const oldData = nodeData.get(eventContext.instance.id);

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
                nodeData.delete(eventContext.instance.id);
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

        nodeData.set(eventContext.instance.id, data);
        requestAnimationFrame(tickLoop);
        this.triggerOutput('started', eventContext);
        this.triggerOutput('immediate', eventContext);
    }

    function pause(this: iEngineNode, eventContext: iEventContext): void {
        const data = this.getNodeData<NodeData>().get(eventContext.instance.id);
        
        if (data){
            data.active = false;
        }

        this.triggerOutput('immediate', eventContext);
    }

    function reset(this: iEngineNode, eventContext: iEventContext): void {
        this.getNodeData<NodeData>().delete(eventContext.instance.id);
        this.triggerOutput('immediate', eventContext);
    }

    function getElapsed(this: iEngineNode, eventContext: iEventContext): number {
        const data = this.getNodeData<NodeData>().get(eventContext.instance.id);
        return data ? Math.round(data.progress / 10) / 100 : 0;
    }

    function getRemaining(this: iEngineNode, eventContext: iEventContext): number {
        const data = this.getNodeData<NodeData>().get(eventContext.instance.id);
        return data ? Math.round((data.duration - data.progress) / 10) / 100 : 0;
    }

    function getPercent(this: iEngineNode, eventContext: iEventContext): number {
        const data = this.getNodeData<NodeData>().get(eventContext.instance.id);
        return data ? data.progress / data.duration : 0;
    }

    const timer = {
        id: 'timer',
        category: 'flow',
        stackDataIO: true,
        inputs: [
            {id: 'duration', type: SOCKET_TYPE.NUMBER, required: true, default: 0},
            {id: 'step', type: SOCKET_TYPE.NUMBER, required: true, default: 0},
        ],
        outputs: [
            {id: 'elapsed', type: SOCKET_TYPE.NUMBER, execute: getElapsed},
            {id: 'remaining', type: SOCKET_TYPE.NUMBER, execute: getRemaining},
            {id: 'percent', type: SOCKET_TYPE.NUMBER, execute: getPercent},
        ],
        inTriggers: [
            {id: 'start', execute: start},
            {id: 'pause', execute: pause},
            {id: 'reset', execute: reset},
        ],
        outTriggers: ['immediate', 'started', 'tick', 'complete'],
        init(this: GenericNode){
            if (!isEngineNode(this)) return;
            this.setNodeData<NodeData>(new Map());
        },
    };
    catFlow.push(timer);
}

{// Random Number
    function getNum(this: iEngineNode, eventContext: iEventContext): number {
        const lower = this.getInput<number>('lower', eventContext);
        const upper = this.getInput<number>('upper', eventContext);
        const round = this.getInput<boolean>('round', eventContext);
        const num = Math.random() * (upper - lower) + lower;

        return round ? Math.round(num) : num;
    }

    const randomNumber = {
        id: 'random_number',
        category: 'flow',
        stackDataIO: true,
        inputs: [
            {id: 'lower', type: SOCKET_TYPE.NUMBER, required: true, default: 0},
            {id: 'upper', type: SOCKET_TYPE.NUMBER, required: true, default: 1},
            {id: 'round', type: SOCKET_TYPE.BOOL, default: false},
        ],
        outputs: [
            {id: 'number', type: SOCKET_TYPE.NUMBER, execute: getNum},
        ],
    };
    catFlow.push(randomNumber);
}

{// Restart
    function restartGame(this: iEngineNode): void {
        this.engine.restart();
    }

    const restartGameNode = {
        id: 'restart_game',
        category: 'flow',
        inTriggers: [
            {id: '_i', execute: restartGame},
        ],
    };
    catFlow.push(restartGameNode);
}

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