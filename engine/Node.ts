import {
    iEditorLogic,
    iEngineLogic,
    iEngineNode,
    iNodeTemplate,
    convertSocketType,
    NODE_MAP,
    iNodeSaveData,
    iEngineNodeMethod,
    iEventContext,
    Node_Enums,
} from "@engine/core/core";
import { iAnyObj } from "./core/interfaces";
import { listConvert } from "./core/nodes/Socket_Conversions";
import Engine from "./Engine";
import Logic from "./Logic";

export default class Node implements iEngineNode {
    private _dataCache: Map<number | string, any> = new Map();
    private _stackTrace: {parentScriptId: number, nodeId: number};

    template: iNodeTemplate;
    nodeId: number;
    parentScript: iEngineLogic;
    engine: Engine;
    isEvent: boolean;
    widgetData: iAnyObj | null = null;
    defaultTriggerId: string | null = null;
    inTriggers: iEngineNode["inTriggers"] = new Map();
    outTriggers: iEngineNode["outTriggers"] = new Map();
    inputs: iEngineNode["inputs"] = new Map();
    outputs: iEngineNode["outputs"] = new Map();
    execute: ((eventContext: iEventContext, data: any)=>void) | null = null;
    methods: Map<string, iEngineNodeMethod> = new Map();

    constructor(nodeData: iNodeSaveData, logic: Logic, engine: Engine){
        const template = NODE_MAP.get(nodeData.tId)!;

        this.engine = engine;

        template.beforeLoad?.call(this, nodeData);
        
        this.template = template;
        this.nodeId = nodeData.nId;
        this.parentScript = logic;
        this.isEvent = template.isEvent ?? false;
        this.widgetData = nodeData.widg ?? null;
        this._stackTrace = {parentScriptId: this.parentScript.id, nodeId: this.nodeId};

        template.inTriggers?.forEach(trigger => {
            const {execute} = trigger;
            this.inTriggers.set(trigger.id, {
                execute,
                node: this,
                connection: null,
            });
        });

        template.outTriggers?.forEach(trigger => {
            this.outTriggers.set(trigger, {connection: null});
        });

        template.inputs?.forEach(input => {
            const {id, type, isList} = input;
            const def = input.default ?? 0;

            this.inputs.set(id, {
                value: def,
                type,
                connection: null,
                isList,
            });
        });

        template.outputs?.forEach(output => {
            const {id, type, execute, isList} = output;
            this.outputs.set(output.id, {
                id,
                connection: null,
                node: this,
                type,
                execute,
                isList,
            });
        })

        nodeData.inp.forEach(srcInput => {
            this.inputs.get(srcInput.id)!.value = srcInput.value;
        });

        if (template.outTriggers && template.outTriggers.length > 0){
            this.defaultTriggerId = template.outTriggers[0];
        }

        if (this.isEvent && template.execute){
            this.execute = template.execute;
        }

        for (let method in template.methods){
            this.methods.set(method, template.methods[method] as iEngineNodeMethod);
        }

        this.template.afterLoad?.call(this, nodeData);
        this.template.init?.call(this);
    }

    get dataCache(){return this._dataCache ?? {}};

    private _triggerInTrigger(executeName: string, eventContext: iEventContext): void {
        this.methods.get(executeName)?.call(this, eventContext);
    }

    private _getOutputData(outputName: string, eventContext: iEventContext): any {
        const methodName = this.outputs.get(outputName)?.execute;
        return this.methods.get(methodName!)?.call(this, eventContext);
    }

    logicLoaded(logic: iEditorLogic | iEngineLogic): void {
        this.template.logicLoaded?.call(this, logic);
    }

    afterGameDataLoaded(): void {
        this.template.afterGameDataLoaded?.call(this);
    }

    onCreate(context: iEventContext): void {
        (this.template.onCreate as (this: iEngineNode, ctx: iEventContext)=>void)?.call(this, context);
    }

    executeEvent(data: any, eventContext: iEventContext): void {
        if (!this.isEvent) {
            console.error('Error: Cannot call \"executeEvent()\" from non-event node');
            return
        };

        //execute first node
        if (this.execute){
            this.execute.call(this, eventContext, data);
        }
        else{
            const triggerId = data?.trigger ?? this.defaultTriggerId;
            this.triggerOutput(triggerId, eventContext);
        }
    }

    method(methodName: string, data?: any): any {
        return this.methods.get(methodName)?.call(this, data);
    }

    getWidgetData(): any {
        return this.widgetData;
    }

    getInput(inputName: string, eventContext: iEventContext, convertList: boolean = true): any {
        const input = this.inputs.get(inputName)!;

        if (input.connection){
            const node = input.connection.node as Node;
            const val = node._getOutputData(input.connection.id, eventContext);
            const listResult = convertList ? listConvert(Array.isArray(val), !!input.isList, val) : val;

            return convertSocketType(input.connection.type, input.type, listResult);
        }
        else{
            return input.value;
        }
    }

    triggerOutput(outputId: string, eventContext: iEventContext): void {
        const trigger = this.outTriggers.get(outputId);

        if (trigger?.connection){
            try{
                const node = trigger.connection.node as Node;
                node._triggerInTrigger(trigger.connection.execute, eventContext);
            }
            catch(e){
                console.error(e);
                this.engine.stop();
                return;
            }
        }
    }

    throwOnNullInput<T>(inputName: string, eventContext: iEventContext, errorId: string, fatal: boolean = false): T | typeof Node_Enums.THROWN | null {
        const value = this.getInput(inputName, eventContext);

        if (!(value == null && value == undefined) && !this.inputs.get(inputName)?.connection) return value;

        this.engine.nodeException({
            msgId: errorId,
            logicId: this.parentScript.id,
            nodeId: this.nodeId,
            fatal,
        });

        if (fatal){
            throw new Error(errorId);
        }

        return Node_Enums.THROWN;
    }
}