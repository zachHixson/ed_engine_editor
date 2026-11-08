import Core from '@/core';
import type Logic from "./Logic";

const { Vec2 } = Core;
type Vec2 = Core.Vec2;

export default class Node implements Core.iEditorNode {
    private _template: Core.iNodeTemplate;
    private _editorAPI: Core.iEditorAPI;
    private _nodeData: unknown = null as unknown;

    nodeId: number;
    isEvent: boolean;
    widget?: Core.iNodeTemplate['widget'];
    widgetData?: unknown;
    inTriggers: Core.iEditorNode['inTriggers'] = new Map();
    outTriggers: Core.iEditorNode['outTriggers'] = new Map();
    inputs: Core.iEditorNode['inputs'] = new Map();
    outputs: Core.iEditorNode['outputs'] = new Map();
    parentScript: Core.iEditorLogic;
    graphId: number;
    domRef: HTMLDivElement | null = null;
    pos: Vec2;
    editorCanDelete: boolean = true;
    showEditButton: boolean = false;

    reverseInputs?: boolean;
    reverseOutputs?: boolean;
    stackDataIO?: boolean;
    inputBoxWidth?: number;
    doNotCopy?: boolean = false;

    onEditorMove = new Core.Event_Emitter<(newPos: Vec2)=>void>(this);
    onForceUpdate = new Core.Event_Emitter<()=>void>(this);
    onForceSocketUpdate = new Core.Event_Emitter<(socketName?: string)=>void>(this);
    onUpdateConnections = new Core.Event_Emitter<()=>void>(this);
    onRecalcWidth = new Core.Event_Emitter<()=>void>(this);

    constructor(templateId: string, id: number, pos: Readonly<Vec2>, parentScript: Logic, graphId: number, editorAPI: Core.iEditorAPI){
        const template = Core.NodeMap.get(templateId)!;

        this._template = template;
        this.nodeId = id;
        this.isEvent = template.isEvent ?? false;
        this.widget = template.widget ? JSON.parse(JSON.stringify(template.widget)) : undefined;
        this.parentScript = parentScript;
        this.graphId = graphId;
        this._editorAPI = editorAPI;
        this.pos = pos.clone();

        //Load template props
        this.reverseInputs =  this.template.reverseInputs;
        this.reverseOutputs =  this.template.reverseOutputs;
        this.stackDataIO =  this.template.stackDataIO;
        this.inputBoxWidth =  this.template.inputBoxWidth;
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

            if (value instanceof Array) {
                value = null;
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

    init(): void {
        this.template.init?.call(this);
    }

    onCreate(): void {
        (this.template.onCreate as ()=>void)?.call(this);
    }

    beforeSave(): void {
        this.template.beforeSave?.call(this);
    }

    afterSave(saveData: Core.NodeSave): void {
        this.template.afterSave?.call(this, saveData);
    }

    beforeLoad(saveData: Core.NodeSave): void {
        this.template.beforeLoad?.call(this, saveData);
    }

    afterLoad(saveData: Core.NodeSave): void {
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

    onInput(event: Core.iNodeInputEvent): void {
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

    onValueChange(value: unknown): void {
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
        this.domRef = null;
    }

    toSaveData(): Core.NodeSave {
        this.beforeSave();

        const widgetData = this.widget ? JSON.parse(JSON.stringify(this.widgetData ?? {})) : {}
        const outObj: Core.NodeSave = [
            this.templateId,
            this.nodeId,
            this.graphId,
            this.pos.clone().multiplyScalar(100).divideScalar(100).floor().toArray(),
            [],
            widgetData,
            {},
        ];

        this.inputs.forEach(({ id, type, value }) => {
            const outValue = Core.serializeInputValue(type, value);

            if (outValue == null) {
                return;
            }

            outObj[4].push([id, outValue]);
        });

        this.afterSave(outObj);

        return outObj;
    }

    static fromSaveData(data: Core.NodeSave, parentScript: Logic, nodeAPI: Core.iEditorAPI): Node {
        const node = new Node(
            data[0],
            data[1],
            Vec2.fromArray(data[3]),
            parentScript,
            data[2],
            nodeAPI
        );
        return node._loadSaveData(data);
    }

    private _loadSaveData(data: Core.NodeSave): Node {
        this.beforeLoad(data);

        const widgetData = data[5];

        if (widgetData){
            this.widgetData = widgetData;
        }

        data[4].forEach(input => {
            const nodeInput = this.inputs.get(input[0]);
            if (!nodeInput) return;
            nodeInput.value = Core.parseSavedInputValue(nodeInput.type, input[1]);
        });

        this.afterLoad(data);

        return this;
    }

    setEditorAPI(context: Core.iEditorAPI): void {
        this._editorAPI = context;
    }

    setDomRef(domRef: HTMLDivElement): void {
        this.domRef = domRef;
        this.domRef.style.left = this.pos.x + 'px';
        this.domRef.style.top = this.pos.y + 'px';
    }

    setPos(newPos: Readonly<Vec2>): void {
        this.pos.copy(newPos);
        this.domRef!.style.left = this.pos.x + 'px';
        this.domRef!.style.top = this.pos.y + 'px';
        this.onEditorMove.emit(newPos.clone());
    }

    getInput(inputName: string): number | string | boolean | null {
        const input = this.inputs.get(inputName);

        if (!input){
            throw new Error(`ERROR: No input "${inputName}" found on node "${this.templateId}"`);
        }

        if (!input.hideSocket){
            console.warn(`Warning: Attempting to get input value for input with visible socket "${inputName}". Connections are not traced in editor, returning static input value.`);
        }

        return input.value;
    }

    refresh(): void {
        this.template.refresh && this.template.refresh.call(this);
    }

    setNodeData<T>(data: T): T {
        this._nodeData = data;
        return this._nodeData as T;
    }

    getNodeData<T>(): T {
        return this._nodeData as T;
    }
};
