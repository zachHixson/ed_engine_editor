import {
    iEditorLogic,
    iEngineLogic,
    iEngineNode,
    iNodeTemplate,
    convertSocketType,
    NodeMap,
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
    private _nodeData: unknown = null as unknown;

    template: iNodeTemplate;
    nodeId: number;
    parentScript: iEngineLogic;
    graphId: number;
    engine: Engine;
    isEvent: boolean;
    widgetData: iAnyObj | null = null;
    defaultTriggerId: string | null = null;
    inTriggers: iEngineNode["inTriggers"] = new Map();
    outTriggers: iEngineNode["outTriggers"] = new Map();
    inputs: iEngineNode["inputs"] = new Map();
    outputs: iEngineNode["outputs"] = new Map();
    execute: ((eventContext: iEventContext, data: any)=>void) | null = null;

    constructor(nodeData: iNodeSaveData, logic: Logic, engine: Engine){
        const template = NodeMap.get(nodeData.tId)!;

        this.engine = engine;

        template.beforeLoad?.call(this, nodeData);
        
        this.template = template;
        this.nodeId = nodeData.nId;
        this.parentScript = logic;
        this.graphId = nodeData.gId;
        this.isEvent = template.isEvent ?? false;
        this.widgetData = nodeData.widg ?? null;

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

        this.template.afterLoad?.call(this, nodeData);
        this.template.init?.call(this);
    }

    private _getOutputData(outputName: string, eventContext: iEventContext): any {
        const outputMethod = this.outputs.get(outputName)?.execute;
        return outputMethod?.call(this, eventContext, null);
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
                trigger.connection.execute.call(node, eventContext, null);
            }
            catch(e){
                console.error(e);
                this.engine.stop();
                return;
            }
        }
    }

    throwOnNullInput<T>(inputName: string, eventContext: iEventContext, errorId: string, fatal: boolean = false, rejectNoConnection: boolean = false): T | typeof Node_Enums.THROWN | null {
        const value = this.getInput(inputName, eventContext);
        const hasVal = !(value == null && value == undefined);
        const returnNull = !(rejectNoConnection || this.inputs.get(inputName)?.connection);

        if (hasVal || returnNull) return value;

        this.engine.nodeException({
            errorId: Symbol(),
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

    setNodeData<T>(data: T): T {
        this._nodeData = data;
        return this._nodeData as T;
    }

    getNodeData<T>(): T {
        return this._nodeData as T;
    }
}