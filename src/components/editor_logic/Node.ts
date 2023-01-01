import Core from '@/core';
import type Logic from "./Logic";
import type Node_API from "./Node_API";

const { Vector } = Core;

export default class Node extends Core.EventListenerMixin(class {}) implements Core.iEditorNode {
    private _template: Core.iNodeTemplate;
    private _editorAPI: Node_API;

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
    dataCache: Map<string, any> = new Map();
    editorCanDelete: boolean = true;

    init: Core.iNodeLifecycleEvents['init'];
    onCreate: Core.iNodeLifecycleEvents['onCreate'];
    beforeSave: Core.iNodeLifecycleEvents['beforeSave'];
    afterSave: Core.iNodeLifecycleEvents['afterSave'];
    beforeLoad: Core.iNodeLifecycleEvents['beforeLoad'];
    afterLoad: Core.iNodeLifecycleEvents['afterLoad'];
    logicLoaded: Core.iNodeLifecycleEvents['logicLoaded'];
    afterGameDataLoaded: Core.iNodeLifecycleEvents['afterGameDataLoaded'];
    onScriptAdd: Core.iNodeLifecycleEvents['onScriptAdd'];
    onMount: Core.iNodeLifecycleEvents['onMount'];
    allNodesMounted: Core.iNodeLifecycleEvents['allNodesMounted'];
    onNewVariable: Core.iNodeLifecycleEvents['onNewVariable'];
    onInput: Core.iNodeLifecycleEvents['onInput'];
    onMove: Core.iNodeLifecycleEvents['onMove'];
    onNewConnection: Core.iNodeLifecycleEvents['onNewConnection'];
    onRemoveConnection: Core.iNodeLifecycleEvents['onRemoveConnection'];
    onValueChange: Core.iNodeLifecycleEvents['onValueChange'];
    onDeleteStopped: Core.iNodeLifecycleEvents['onDeleteStopped'];
    onBeforeDelete: Core.iNodeLifecycleEvents['onBeforeDelete'];

    reverseInputs?: boolean;
    reverseOutputs?: boolean;
    inputBoxWidth?: number;
    decoratorIcon?: string;
    decoratorText?: string;
    decoratorTextVars?: any;

    constructor(template: Core.iNodeTemplate, id: number, pos: Core.Vector, parentScript: Logic, graphId: number, editorAPI: Node_API){
        super();
        this._template = template;
        this.nodeId = id;
        this.isEvent = template.isEvent ?? false;
        this.widget = template.widget;
        this.parentScript = parentScript;
        this.graphId = graphId;
        this._editorAPI = editorAPI;
        this.pos = pos.clone();

        //bind lifecycle events
        this.init = template.init?.bind(this);
        this.onScriptAdd = template.onScriptAdd?.bind(this);
        this.onCreate = template.onCreate?.bind(this);
        this.beforeSave = template.beforeSave?.bind(this);
        this.afterSave = template.afterSave?.bind(this);
        this.beforeLoad = template.beforeLoad?.bind(this);
        this.afterLoad = template.afterLoad?.bind(this);
        this.logicLoaded = template.logicLoaded?.bind(this);
        this.afterGameDataLoaded = template.afterGameDataLoaded?.bind(this);
        this.onScriptAdd = template.onScriptAdd?.bind(this);
        this.onMount = template.onMount?.bind(this);
        this.allNodesMounted = template.allNodesMounted?.bind(this);
        this.onNewVariable = template.onNewVariable?.bind(this);
        this.onInput = template.onInput?.bind(this);
        this.onMove = template.onMove?.bind(this);
        this.onNewConnection = template.onNewConnection?.bind(this);
        this.onRemoveConnection = template.onRemoveConnection?.bind(this);
        this.onValueChange = template.onValueChange?.bind(this);
        this.onDeleteStopped = template.onDeleteStopped?.bind(this);
        this.onBeforeDelete = template.onBeforeDelete?.bind(this);

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

        //bind template events
        for (let prop in template){
            const value = template[prop];

            if (prop[0] == '$' && typeof value == 'function'){
                const eventName = prop.substring(1);
                this.addEventListener(eventName, value.bind(this));
            }
        }

        this.init && this.init();
    }

    get template(){return this._template}
    get templateId(){return this._template.id}
    get editorAPI(){return this._editorAPI}

    toSaveData(): Core.iAnyObj {
        this.beforeSave && this.beforeSave();

        const roundedPos = new Vector(
            Math.floor(this.pos.x * 100) / 100,
            Math.floor(this.pos.y * 100) / 100
        );
        const outObj: Core.iAnyObj = {
            templateId: this.templateId,
            nodeId: this.nodeId,
            graphId: this.graphId,
            pos: roundedPos.toObject(),
            inputs: [],
        };

        this.inputs.forEach(({id, value}) => outObj.inputs.push({id, value}));

        if (this.widget){
            outObj.widgetData = JSON.stringify(this.widgetData);
        }

        this.afterSave && this.afterSave(outObj);

        return outObj;
    }

    fromSaveData(data: Core.iAnyObj): Node {
        this.beforeLoad && this.beforeLoad(data);

        if (data.widgetData){
            this.widgetData = JSON.parse(data.widgetData);
        }

        data.inputs.forEach((input: Core.iAnyObj) => {
            const nodeInput = this.inputs.get(input.id);
            if (!nodeInput) return;
            nodeInput.value = input.value;
        });

        this.afterLoad && this.afterLoad();

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

    setPos(newPos: Core.Vector): void {
        this.pos.copy(newPos);
        this.domRef!.style.left = this.pos.x + 'px';
        this.domRef!.style.top = this.pos.y + 'px';
        this.emit('onMove', newPos);
    }

    method(methodName: string, data: any[] = []): any {
        const method = this.template.methods![methodName];

        if (!method){
            console.error(`Could not find method "${methodName}" in template ${this.templateId}`);
            return;
        }

        return method.call(this, ...data);
    }

    getInput(inputName: string ): Core.iEditorNodeInput | null {
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
};
