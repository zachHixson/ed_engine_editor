import Core from '@/core';
import type Logic from "./Logic";
import type Node_API from "../Node_API";

const { Vector } = Core;

export default class Node {
    private _template: Core.iNodeTemplate;
    private _editorAPI: Node_API;
    private _dataCache: Map<number | string, any> = new Map();

    nodeId: number;
    isEvent: boolean;
    widget?: Core.iAnyObj;
    widgetData?: any;
    inTriggers: Core.iEditorNode['inTriggers'] = new Map();
    outTriggers: Core.iEditorNode['outTriggers'] = new Map();
    inputs: Core.iEditorNode['inputs'] = new Map();
    outputs: Core.iEditorNode['outputs'] = new Map();
    parentScript: Logic;
    graphId: number;
    domRef: HTMLDivElement | null = null;
    pos: Core.Vector;
    editorCanDelete: boolean = true;
    showEditButton: boolean = false;

    reverseInputs?: boolean;
    reverseOutputs?: boolean;
    stackDataIO?: boolean;
    inputBoxWidth?: number;
    decoratorIcon?: string;
    decoratorText?: string;
    decoratorTextVars?: any;
    doNotCopy?: boolean = false;

    onEditorMove = new Core.Event_Emitter<(newPos: Core.Vector)=>void>(this);
    onForceUpdate = new Core.Event_Emitter<()=>void>(this);
    onForceSocketUpdate = new Core.Event_Emitter<(socketName?: string)=>void>(this);
    onUpdateConnections = new Core.Event_Emitter<()=>void>(this);
    onRecalcWidth = new Core.Event_Emitter<()=>void>(this);

    constructor(templateId: string, id: number, pos: Core.ConstVector, parentScript: Logic, graphId: number, editorAPI: Node_API){
        const template = Core.NODE_MAP.get(templateId)!;
        
        this._template = template;
        this.nodeId = id;
        this.isEvent = template.isEvent ?? false;
        this.widget = template.widget;
        this.parentScript = parentScript;
        this.graphId = graphId;
        this._editorAPI = editorAPI;
        this.pos = pos.clone();

        //Load template props
        this.reverseInputs =  this.template.reverseInputs;
        this.reverseOutputs =  this.template.reverseOutputs;
        this.stackDataIO =  this.template.stackDataIO;
        this.inputBoxWidth =  this.template.inputBoxWidth;
        this.decoratorIcon =  this.template.decoratorIcon;
        this.decoratorText =  this.template.decoratorText;
        this.decoratorTextVars =  this.template.decoratorTextVars;
        this.editorCanDelete = this.template.editorCanDelete ?? this.editorCanDelete;
        this.showEditButton = this.template.showEditButton ?? this.showEditButton;
        this.doNotCopy = this.template.doNotCopy ?? this.doNotCopy;

        //map template to node
        template.inTriggers?.forEach(trigger => {
            this.inTriggers.set(trigger.id, {
                id: trigger.id,
                node: this,
                execute: trigger.execute,
            });
        });

        template.outTriggers?.forEach(trigger => {
            this.outTriggers.set(trigger, {
                id: trigger,
                node: this,
            });
        });

        template.inputs?.forEach(input => {
            let value = input.default;

            if (value === undefined){
                value = Core.Node_Enums.SOCKET_DEFAULT.get(input.type);
            }

            this.inputs.set(input.id, Object.assign({
                value,
                node: this,
            }, input));
        });

        template.outputs?.forEach(output => {
            this.outputs.set(output.id, Object.assign({node: this}, output));
        });

        this.init();
    }

    get template(){return this._template}
    get templateId(){return this._template.id}
    get editorAPI(){return this._editorAPI}
    get dataCache(){return this._dataCache}

    init(): void {
        this.template.init?.call(this);
    }

    onCreate(): void {
        (this.template.onCreate as ()=>void)?.call(this);
    }

    beforeSave(): void {
        this.template.beforeSave?.call(this);
    }

    afterSave(saveData: Core.iNodeSaveData): void {
        this.template.afterSave?.call(this, saveData);
    }

    beforeLoad(saveData: Core.iNodeSaveData): void {
        this.template.beforeLoad?.call(this, saveData);
    }

    afterLoad(saveData: Core.iNodeSaveData): void {
        this.template.afterLoad?.call(this, saveData);
    }

    logicLoaded(logic: Core.iEditorLogic | Core.iEngineLogic): void {
        this.template.logicLoaded?.call(this, logic);
    }

    afterGameDataLoaded(): void {
        this.template.afterGameDataLoaded?.call(this);
    }

    onBeforeMount(): void {
        this.template.onBeforeMount?.call(this);
    }

    onMount(): void {
        this.template.onMount?.call(this);
    }

    onNewVariable(): void {
        this.template.onNewVariable?.call(this);
    }

    onEdit(): void {
        this.template.onEdit?.call(this);
    }

    onInput(event: InputEvent): void {
        this.template.onInput?.call(this, event);
    }

    onMove(): void {
        this.template.onMove?.call(this);
    }

    onNewConnection(connection: Core.iNodeConnection, isUndo?: boolean): void {
        this.template.onNewConnection?.call(this, connection, isUndo);
    }

    onRemoveConnection(connection: Core.iNodeConnection, isUndo?: boolean): void {
        this.template.onRemoveConnection?.call(this, connection, isUndo);
    }

    onValueChange(value: any): void {
        this.template.onValueChange?.call(this, value);
    }

    onDeleteStopped(protectedNodes: Core.iEditorNode[]): void {
        this.template.onDeleteStopped?.call(this, protectedNodes);
    }

    onBeforeDelete(): void {
        this.template.onBeforeDelete?.call(this);
    }

    onBeforeUnmount(): void {
        this.template.onBeforeUnmount?.call(this);
    }

    toSaveData(): Core.iNodeSaveData {
        this.beforeSave();

        const outObj: Core.iNodeSaveData = {
            tId: this.templateId,
            nId: this.nodeId,
            gId: this.graphId,
            pos: this.pos.clone().multiplyScalar(100).divideScalar(100).floor(),
            inp: [],
            widg: {},
        };

        this.inputs.forEach(({id, value}) => outObj.inp.push({id, value}));

        if (this.widget){
            outObj.widg = JSON.parse(JSON.stringify(this.widgetData));
        }

        this.afterSave(outObj);

        return outObj;
    }

    static fromSaveData(data: Core.iNodeSaveData, parentScript: Logic, nodeAPI: Node_API): Node {
        const node = new Node(data.tId, data.nId, Vector.fromObject(data.pos), parentScript, data.gId, nodeAPI);
        return node._loadSaveData(data);
    }

    private _loadSaveData(data: Core.iNodeSaveData): Node {
        this.beforeLoad(data);

        if (data.widg){
            this.widgetData = data.widg;
        }

        data.inp.forEach(input => {
            const nodeInput = this.inputs.get(input.id);
            if (!nodeInput) return;
            nodeInput.value = input.value;
        });

        this.afterLoad(data);

        return this;
    }

    setEditorAPI(context: Node_API): void {
        this._editorAPI = context;
    }

    setDomRef(domRef: HTMLDivElement): void {
        this.domRef = domRef;
        this.domRef.style.left = this.pos.x + 'px';
        this.domRef.style.top = this.pos.y + 'px';
    }

    setPos(newPos: Core.ConstVector): void {
        this.pos.copy(newPos);
        this.domRef!.style.left = this.pos.x + 'px';
        this.domRef!.style.top = this.pos.y + 'px';
        this.onEditorMove.emit(newPos.clone());
    }

    method(methodName: string, data: any): any {
        const method = this.template.methods![methodName] as Core.iEditorNodeMethod;

        if (!method){
            console.error(`Could not find method "${methodName}" in template ${this.templateId}`);
            return;
        }

        return method.call(this, data);
    }

    getInput(inputName: string): any {
        const input = this.inputs.get(inputName);

        if (!input){
            console.error(`ERROR: No input "${inputName}" found on node "${this.templateId}"`);
            return null;
        }

        if (!input.hideSocket){
            console.warn(`Warning: Attempting to get input value for input with visible socket "${inputName}". Connections are not traced in editor, returning static input value.`);
        }

        return input.value;
    }

    refresh(): void {
        this.template.refresh && this.template.refresh.call(this);
    }
};
