import { iInput, iNodeTemplate } from "./iNodeTemplate";
import { iEngineNode, iEditorNode, iEventContext, iNodeConnection, NodeSave } from "../LogicInterfaces";
import { canConvertSocket } from './Socket_Conversions';
import { SOCKET_TYPE } from "./Node_Enums";
import { GenericNode, Instance_Base, Instance_Object, Instance_Sprite, isEngineNode } from "../core";
import { WIDGET_TYPE, type WidgetKey, type WidgetTextArea } from "@engine/core/nodes/Widget";

const catFlow: iNodeTemplate[] = [];
const category = 'flow';

export default catFlow;

{// Branch
    const enum OT {
        TRUE = 'true',
        FALSE = 'false',
    };
    const inp = {id: 'condition', type: SOCKET_TYPE.BOOL, default: false} as const satisfies iInput;

    function checkCondition(this: iEngineNode, eventContext: iEventContext): void {
        const conditionVal = this.getInput(inp, eventContext);
        const out = conditionVal ? OT.TRUE : OT.FALSE;
        this.triggerOutput(out, eventContext);
    }

    const branch = {
        id: 'branch',
        category,
        inTriggers: [
            {id: '_i', execute: checkCondition},
        ],
        outTriggers: [OT.TRUE, OT.FALSE],
        inputs: [
            inp,
        ],
    } as const satisfies iNodeTemplate;
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
        category,
        inTriggers: [
            {id: '_i', execute: startSequence},
        ],
        outTriggers: ['#1', '#2'],
        afterSave(this: iEditorNode, saveData: NodeSave){
            saveData[6] = this.outTriggers.size;
        },
        afterLoad(this: iEditorNode, saveData: NodeSave){
            const outputNumber = saveData[6] as number;
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
    const enum OT {
        EQ = 'equal_sym',
        GT = 'gt',
        LT = 'lt',
        GTE = 'gte',
        LTE = 'lte',
    };

    const inp1 = {id: '_inp1', type: SOCKET_TYPE.NUMBER, default: 0} as const satisfies iInput;
    const inp2 = {id: '_inp2', type: SOCKET_TYPE.NUMBER, default: 0} as const satisfies iInput;

    function compare(this: iEngineNode, eventContext: iEventContext): boolean {
        const compareFunc = this.getWidgetData();
        const inp1Val = this.getInput(inp1, eventContext);
        const inp2Val = this.getInput(inp2, eventContext);

        switch(compareFunc){
            case OT.EQ: return inp1Val == inp2Val;
            case OT.GT: return inp1Val > inp2Val;
            case OT.LT: return inp1Val < inp2Val;
            case OT.GTE: return inp1Val >= inp2Val;
            case OT.LTE: return inp1Val <= inp2Val;
            default: return false;
        }
    }

    const compareNode = {
        id: 'compare_numbers',
        category,
        inputs: [
            inp1,
            inp2,
        ],
        widget: {
            type: WIDGET_TYPE.ENUM,
            options: {
                stringItems: [OT.EQ, OT.GT, OT.LT, OT.GTE, OT.LTE],
            },
        },
        outputs: [
            {id: 'result', type: SOCKET_TYPE.BOOL, execute: compare},
        ],
    } as const satisfies iNodeTemplate;
    catFlow.push(compareNode);
}

{// Compare Instances
    const inp1 = {id: '_i1', type: SOCKET_TYPE.ASSET, default: null} as const satisfies iInput;
    const inp2 = {id: '_i2', type: SOCKET_TYPE.ASSET, default: null} as const satisfies iInput;

    function getResult(this: iEngineNode, eventContext: iEventContext): boolean {
        const i1 = this.getInput(inp1, eventContext);
        const i2 = this.getInput(inp2, eventContext);

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
        category,
        widget: {
            type: WIDGET_TYPE.ENUM,
            options: {
                stringItems: ['compare_instance', 'compare_type'],
            },
        },
        onBeforeMount(this: iEditorNode){
            editor_setSocketType.call(this);
        },
        onValueChange(this: iEditorNode){
            editor_setSocketType.call(this);
        },
        inputs: [
            inp1,
            inp2,
        ],
        outputs: [
            {id: 'result', type: SOCKET_TYPE.BOOL, execute: getResult},
        ],
    } as const satisfies iNodeTemplate;
    catFlow.push(compareInstance);
}

{// Logic
    const inp1 = {id: '_inp1', type: SOCKET_TYPE.BOOL, default: false} as const satisfies iInput;
    const inp2 = {id: '_inp2', type: SOCKET_TYPE.BOOL, default: false} as const satisfies iInput;

    function result(this: iEngineNode, eventContext: iEventContext): boolean {
        const logicFunc = this.getWidgetData();
        const i1 = this.getInput(inp1, eventContext);
        const i2 = this.getInput(inp2, eventContext);

        switch(logicFunc){
            case 'and': return i1 && i2;
            case 'or': return i1 || i2;
            case 'xor': return !!(+i1 ^ +i2);
            default: return false;
        }
    };

    const logic = {
        id: 'logic',
        category,
        widget: {
            type: WIDGET_TYPE.ENUM,
            options: {
                stringItems: ['and', 'or', 'xor']
            },
        },
        inputs: [
            inp1,
            inp2,
        ],
        outputs: [
            {id: 'result', type: SOCKET_TYPE.BOOL, execute: result},
        ],
    } as const satisfies iNodeTemplate;
    catFlow.push(logic);
}

{// count_loop
    type NodeData = Map<number, {index: number, length: number}>;
    const inp = {id: 'count', type: SOCKET_TYPE.NUMBER, default: 1} as const satisfies iInput;

    function runLoop(this: iEngineNode, eventContext: iEventContext): void {
        const count = this.getInput(inp, eventContext);
        const nodeData = this.getNodeData<NodeData>();

        for (let i = 0; i < count; i++){
            nodeData.set(eventContext.eventKey, {index: i, length: count})
            this.triggerOutput('_o', eventContext);
        }

        nodeData.delete(eventContext.eventKey);
    }

    function getIndex(this: iEngineNode, eventContext: iEventContext): number {
        const data = this.getNodeData<NodeData>();
        const value = data.get(eventContext.eventKey);
        return value?.index ?? 0;
    }

    const countLoop = {
        id: 'count_loop',
        category,
        stackDataIO: true,
        inputs: [
            inp,
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
    } as const satisfies iNodeTemplate;
    catFlow.push(countLoop);
}

{// list_loop
    type NodeData = Map<number, {index: number, item: unknown}>;
    const listInp = {id: 'list', type: SOCKET_TYPE.ANY, hideInput: true, isList: true, default: null} as const satisfies iInput;

    function runLoop(this: iEngineNode, eventContext: iEventContext): void {
        const list = this.getInput(listInp, eventContext);
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

    function getItem(this: iEngineNode, eventContext: iEventContext): unknown | null {
        const data = this.getNodeData<NodeData>().get(eventContext.eventKey);
        return data?.item ?? null;
    }

    const listLoop = {
        id: 'list_loop',
        category,
        stackDataIO: true,
        inputs: [
            listInp,
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
    const listInp = {id: 'list', type: SOCKET_TYPE.ANY, hideInput: true, isList: true, default: []} as const satisfies iInput;
    const itemInp = {id: 'item', type: SOCKET_TYPE.ANY, hideInput: true, default: null} as const satisfies iInput;

    function getList(this: iEngineNode, eventContext: iEventContext): unknown[] {
        const list = this.getInput(listInp, eventContext);
        const item = this.getInput(itemInp, eventContext);
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
        category,
        inputs: [
            listInp,
            itemInp,
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
    } as const satisfies iNodeTemplate;
    catFlow.push(addToList);
}

{// List Length
    const inp = {id: '_list', type: SOCKET_TYPE.ANY, hideInput: true, isList: true, default: null} as const satisfies iInput;

    function getLength(this: iEngineNode, eventContext: iEventContext): number {
        const list = this.getInput(inp, eventContext);
        return list?.length ?? 0;
    }

    const listLength = {
        id: 'list_length',
        category,
        inputs: [
            inp,
        ],
        outputs: [
            {id: 'length', type: SOCKET_TYPE.NUMBER, execute: getLength},
        ],
        onBeforeMount(this: iEditorNode){
            this.refresh();
        },
        onNewConnection(this: iEditorNode){
            setTimeout(()=>this.refresh());
        },
        onRemoveConnection(this: iEditorNode){
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
    } as const satisfies iNodeTemplate;
    catFlow.push(listLength);
}

{// Not
    const inp = {id: '_inp', type: SOCKET_TYPE.BOOL, default: false} as const satisfies iInput;

    function not(this: iEngineNode, eventContext: iEventContext): boolean {
        return !this.getInput(inp, eventContext) as boolean;
    }

    const notNode = {
        id: 'not',
        category,
        inputs: [
            inp,
        ],
        outputs: [
            {id: '_out', type: SOCKET_TYPE.BOOL, execute: not},
        ],
    };
    catFlow.push(notNode);
}

{// Debug Log
    const labelInp = {id: 'label', type: SOCKET_TYPE.STRING, default: ''} as const satisfies iInput;
    const dataInp = {id: '_data', type: SOCKET_TYPE.ANY, default: null} as const satisfies iInput;

    function isInstanceBaseArray(array: unknown[]): array is Instance_Base[] {
        return array[0] instanceof Instance_Base;
    }

    function isInstanceBaseSingular(data: unknown): data is Instance_Base[] {
        return data instanceof Instance_Base;
    }

    function log(this: iEngineNode, eventContext: iEventContext): void {
        const label = this.getInput(labelInp, eventContext);
        const data = this.getInput(dataInp, eventContext);
        let src = [this.parentScript.name];
        let output = '';

        if (label.length) output += label;

        if (Array.isArray(data)){
            const array: unknown[] = data;
            let joinArray: unknown[] = array;

            if (isInstanceBaseArray(array)){
                joinArray = array.map(o => `{ ${convertObjectToString(o)} }`);
            }

            output += `[${joinArray.join(', ')}]`;
        }
        else if (isInstanceBaseSingular(data)){
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
        category,
        inTriggers: [
            {id: '_i', execute: log}
        ],
        outTriggers: ['_o'],
        inputs: [
            labelInp,
            dataInp,
        ],
    } as const satisfies iNodeTemplate;
    catFlow.push(debugLog);
}

{// Note
    const node = {
        id: 'note',
        category,
        widget: {
            type: WIDGET_TYPE.TEXT_AREA,
        },
        onMount(this: iEditorNode){
            const el = this.domRef!;
            el.style.background = '#0088ff10';
        },
    } as const satisfies iNodeTemplate;
    catFlow.push(node);
}

{// Key Input
    function getKey(this: iEngineNode): string {
        const data = this.getWidgetData() as WidgetKey['widget']['data'];
        return data.code ?? '';
    }

    function isDown(this: iEngineNode): boolean {
        const keymap = this.engine.keyMap;
        const data = this.getWidgetData() as WidgetKey['widget']['data'];
        const input = data.code;

        if (!input) {
            console.error('No key code in widget data');
            return false;
        }

        const mapCheck = keymap.get(input);

        return mapCheck == 'down' || mapCheck == 'pressed';
    }

    const keyInput = {
        id: 'key_input',
        category,
        widget: {
            type: WIDGET_TYPE.KEY,
        },
        outputs: [
            {id: 'key', type: SOCKET_TYPE.STRING, execute: getKey},
            {id: 'is_down', type: SOCKET_TYPE.BOOL, execute: isDown},
        ],
    } as const satisfies iNodeTemplate;
    catFlow.push(keyInput);
}

{// Math
    const enum OP {
        ADD_SYM = 'add_sym',
        SUB_SYM = 'subtract_sym',
        MUL_SYM = 'multiply_sym',
        DIV_SYM = 'divide_sym',
        POW_SYM = 'power',
    };

    const inp1 = {id: '_num1', type: SOCKET_TYPE.NUMBER, default: 0} as const satisfies iInput;
    const inp2 = {id: '_num2', type: SOCKET_TYPE.NUMBER, default: 0} as const satisfies iInput;

    function compute(this: iEngineNode, eventContext: iEventContext): number {
        const mathFunc = this.getWidgetData();
        const num1= this.getInput(inp1, eventContext);
        const num2= this.getInput(inp2, eventContext);

        switch(mathFunc){
            case OP.ADD_SYM: return num1 + num2;
            case OP.SUB_SYM: return num1 - num2;
            case OP.MUL_SYM: return num1 * num2;
            case OP.DIV_SYM:
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
            case OP.POW_SYM: return Math.pow(num1, num2);
        }

        return 0;
    }

    const math = {
        id: 'math',
        category,
        widget: {
            type: WIDGET_TYPE.ENUM,
            options: {
                stringItems: [OP.ADD_SYM, OP.SUB_SYM, OP.MUL_SYM, OP.DIV_SYM, OP.POW_SYM],
            },
        },
        inputs: [
            inp1,
            inp2,
        ],
        outputs: [
            {id: '_out', type: SOCKET_TYPE.NUMBER, execute: compute},
        ],
    } as const satisfies iNodeTemplate;
    catFlow.push(math);
}

{// Dialog Box
    const enum OT {
        IMMEDIATE = 'immediate',
        DIALOG_CLOSED = 'dialog_closed',
    };

    const textInp = {id: 'text', type: SOCKET_TYPE.STRING, hideInput: true, default: ''} as const satisfies iInput;
    const intrInp = {id: 'interaction_key', type: SOCKET_TYPE.STRING, hideInput: true, optional: true, default: null} as const satisfies iInput;
    const pauseInp = {id: 'pause_game', type: SOCKET_TYPE.BOOL, default: false} as const satisfies iInput;
    const fullscreenInp = {id: 'fullscreen', type: SOCKET_TYPE.BOOL, default: false} as const satisfies iInput;

    function startDialog(this: iEngineNode, eventContext: iEventContext): void {
        const widgetData = this.getWidgetData() as WidgetTextArea['widget']['data'];
        const textArea = Object.keys(widgetData).length > 0 ? widgetData : "";
        const textBox = this.getInput(textInp, eventContext);
        const interactKey = this.getOptionalInput(intrInp, eventContext) ?? 'Space';
        const shouldPause = this.getInput(pauseInp, eventContext);
        const isFullscreen = this.getInput(fullscreenInp, eventContext);
        const text = textBox ? textBox : textArea;
        const dialogBox = this.engine.openDialogBox(text, shouldPause, isFullscreen, interactKey);

        dialogBox.onClose.listen(userClosed => {
            if (!userClosed){
                this.engine.warn([this.parentScript.name, this.parentScript.graphNames.get(this.graphId) ?? ''], 'double_dialog');
                return;
            }

            this.triggerOutput(OT.DIALOG_CLOSED, eventContext);
        }, {once:true});

        this.triggerOutput(OT.IMMEDIATE, eventContext);
    }

    const dialogBox = {
        id: 'dialog_box',
        category,
        widget: {
            type: WIDGET_TYPE.TEXT_AREA,
        },
        inTriggers: [
            {id: '_i', execute: startDialog},
        ],
        outTriggers: [OT.IMMEDIATE, OT.DIALOG_CLOSED],
        inputs: [
            textInp,
            intrInp,
            pauseInp,
            fullscreenInp,
        ],
    } as const satisfies iNodeTemplate;
    catFlow.push(dialogBox);
}

{// Broadcast Message
    const nameInp = {id: 'name', type: SOCKET_TYPE.STRING, default: ''} as const satisfies iInput;
    const globalInp = {id: 'global', type: SOCKET_TYPE.BOOL, default: false} as const satisfies iInput;

    function broadcastMessage(this: iEngineNode, eventContext: iEventContext): void {
        const name = this.getInput(nameInp, eventContext);
        const global = this.getInput(globalInp, eventContext);

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
        category,
        inputBoxWidth: 6,
        inTriggers: [
            {id: '_i', execute: broadcastMessage},
        ],
        outTriggers: ['_o'],
        inputs: [
            nameInp,
            globalInp,
        ],
    } as const satisfies iNodeTemplate;
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

    const enum OT {
        IMMEDIATE = 'immediate',
        STARTED = 'started',
        TICK = 'tick',
        COMPLETE = 'complete',
    };

    const durInp = {id: 'duration', type: SOCKET_TYPE.NUMBER, default: 0} as const satisfies iInput;
    const stepInp = {id: 'step', type: SOCKET_TYPE.NUMBER, default: 0} as const satisfies iInput;

    function start(this: iEngineNode, eventContext: iEventContext): void {
        const nodeData = this.getNodeData<NodeData>();
        const oldData = nodeData.get(eventContext.instance.id);

        if (oldData && !oldData.complete){
            oldData.active = true;
            this.triggerOutput(OT.IMMEDIATE, eventContext);
            return;
        }

        const duration = this.getInput(durInp, eventContext) * 1000;
        const step = this.getInput(stepInp, eventContext) * 1000;
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
                this.triggerOutput(OT.COMPLETE, eventContext);
                this.triggerOutput(OT.TICK, eventContext);
                nodeData.delete(eventContext.instance.id);
                return;
            }

            if (deltaTimeMS > data.step || data.lastTickGap >= data.step){
                this.triggerOutput(OT.TICK, eventContext);
                data.lastTickGap = 0;
            }
            else{
                data.lastTickGap += deltaTimeMS;
            }

            requestAnimationFrame(tickLoop);
        }

        nodeData.set(eventContext.instance.id, data);
        requestAnimationFrame(tickLoop);
        this.triggerOutput(OT.STARTED, eventContext);
        this.triggerOutput(OT.IMMEDIATE, eventContext);
    }

    function pause(this: iEngineNode, eventContext: iEventContext): void {
        const data = this.getNodeData<NodeData>().get(eventContext.instance.id);

        if (data){
            data.active = false;
        }

        this.triggerOutput(OT.IMMEDIATE, eventContext);
    }

    function reset(this: iEngineNode, eventContext: iEventContext): void {
        this.getNodeData<NodeData>().delete(eventContext.instance.id);
        this.triggerOutput(OT.IMMEDIATE, eventContext);
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
        category,
        stackDataIO: true,
        inputs: [
            durInp,
            stepInp,
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
        outTriggers: [OT.IMMEDIATE, OT.STARTED, OT.TICK, OT.COMPLETE],
        init(this: GenericNode){
            if (!isEngineNode(this)) return;
            this.setNodeData<NodeData>(new Map());
        },
    } as const satisfies iNodeTemplate;
    catFlow.push(timer);
}

{// Random Number
    const lowerInp = {id: 'lower', type: SOCKET_TYPE.NUMBER, default: 0} as const satisfies iInput;
    const upperInp = {id: 'upper', type: SOCKET_TYPE.NUMBER, default: 1} as const satisfies iInput;
    const roundInp = {id: 'round', type: SOCKET_TYPE.BOOL, default: false} as const satisfies iInput;

    function getNum(this: iEngineNode, eventContext: iEventContext): number {
        const lower = this.getInput(lowerInp, eventContext);
        const upper = this.getInput(upperInp, eventContext);
        const round = this.getInput(roundInp, eventContext);
        const num = Math.random() * (upper - lower) + lower;

        return round ? Math.round(num) : num;
    }

    const randomNumber = {
        id: 'random_number',
        category,
        stackDataIO: true,
        inputs: [
            lowerInp,
            upperInp,
            roundInp,
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
        category,
        inTriggers: [
            {id: '_i', execute: restartGame},
        ],
    };
    catFlow.push(restartGameNode);
}

type PossibleObjectTypes =
    Instance_Object |
    Instance_Sprite |
    Instance_Base;

function convertObjectToString(obj: PossibleObjectTypes): string {
    const output = [];

    if (obj instanceof Instance_Object){
        output.push(obj.objRef.name)
    }
    else if (obj.sprite){
        output.push(obj.sprite.name);
    }

    if (obj.name) output.push(obj.name);

    return output.join(' ');
}
