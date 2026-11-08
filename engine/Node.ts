import {
    iEditorLogic,
    iEngineLogic,
    iEngineNode,
    iNodeTemplate,
    convertSocketType,
    NodeMap,
    iEventContext,
    Node_Enums,
    NodeSave,
    iInput,
    parseSavedInputValue,
} from "@engine/core/core";
import { listConvert } from "./core/nodes/Socket_Conversions";
import Engine from "./Engine";
import Logic from "./Logic";
import { SOCKET_TYPE, type SocketTypeLookup } from "./core/nodes/Node_Enums";

export interface iEventData {
    trigger?: string;
}

export default class Node implements iEngineNode {
    private _nodeData: unknown = null as unknown;

    template: iNodeTemplate;
    nodeId: number;
    parentScript: iEngineLogic;
    graphId: number;
    engine: Engine;
    isEvent: boolean;
    widgetData: unknown;
    defaultTriggerId: string | null = null;
    inTriggers: iEngineNode["inTriggers"] = new Map();
    outTriggers: iEngineNode["outTriggers"] = new Map();
    inputs: iEngineNode["inputs"] = new Map();
    outputs: iEngineNode["outputs"] = new Map();
    execute: ((eventContext: iEventContext, data: iEventData)=>void) | null = null;

    constructor(nodeSaveData: NodeSave, logic: Logic, engine: Engine){
        const template = NodeMap.get(nodeSaveData[0])!;

        this.engine = engine;

        template.beforeLoad?.call(this, nodeSaveData);

        this.template = template;
        this.nodeId = nodeSaveData[1];
        this.parentScript = logic;
        this.graphId = nodeSaveData[2];
        this.isEvent = template.isEvent ?? false;
        this.widgetData = nodeSaveData[5] ?? null;

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
            const defVal = input.default;

            this.inputs.set(id, {
                value: defVal,
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

        nodeSaveData[4].forEach(srcInput => {
            const inpId = srcInput[0];
            const rawInpData = srcInput[1];
            const inp = this.inputs.get(inpId);

            if (!inp) {
                throw new Error(`Could not find input ${inpId} on node ${this.template.id}`);
            }

            inp.value = parseSavedInputValue(inp.type, rawInpData);
        });

        if (template.outTriggers && template.outTriggers.length > 0){
            this.defaultTriggerId = template.outTriggers[0];
        }

        if (this.isEvent && template.execute){
            this.execute = template.execute;
        }

        this.template.afterLoad?.call(this, nodeSaveData);
        this.template.init?.call(this);
    }

    private _getOutputData(outputName: string, eventContext: iEventContext): unknown {
        const outputMethod = this.outputs.get(outputName)?.execute;
        return outputMethod?.call(this, eventContext, null);
    }

    private _getInput(socketTemplate: iInput, eventContext: iEventContext, convertList: boolean = true): unknown {
        const inputName = socketTemplate.id;
        const input = this.inputs.get(inputName);

        if (!input) {
            throw new Error(`Unable to find input ${JSON.stringify(socketTemplate)} in node "${this.template.id}"`);
        }

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

    logicLoaded(logic: iEditorLogic | iEngineLogic): void {
        this.template.logicLoaded?.call(this, logic);
    }

    afterGameDataLoaded(): void {
        this.template.afterGameDataLoaded?.call(this);
    }

    onCreate(context: iEventContext): void {
        (this.template.onCreate as (this: iEngineNode, ctx: iEventContext)=>void)?.call(this, context);
    }

    executeEvent(data: iEventData, eventContext: iEventContext): void {
        if (!this.isEvent) {
            console.error('Error: Cannot call \"executeEvent()\" from non-event node');
            return
        };

        //execute first node
        if (this.execute){
            this.execute.call(this, eventContext, data);
            return;
        }

        const triggerId = data?.trigger ?? this.defaultTriggerId;

        if (!triggerId) {
            console.error("Cannot trigger node output without defined triggerId");
            return;
        }

        this.triggerOutput(triggerId, eventContext);
    }

    getWidgetData(): unknown {
        return this.widgetData;
    }

    getInput<T extends iInput>(socketTemplate: T & {isList?: never} & {optional?: never}, eventContext: iEventContext, convertList?: true): SocketTypeLookup[T['type']];
    getInput<T extends iInput>(socketTemplate: T & {isList: true} & {optional?: never}, eventContext: iEventContext): Array<SocketTypeLookup[T['type']]>;
    getInput<T extends iInput>(socketTemplate: T & {isList: true}, eventContext: iEventContext, convertList?: boolean): SocketTypeLookup[T['type']] | Array<SocketTypeLookup[T['type']]> {
        return this._getInput(socketTemplate, eventContext, convertList) as SocketTypeLookup[T['type']];
    }

    getOptionalInput<T extends iInput>(socketTemplate: T & {optional: true}, eventContext: iEventContext): SocketTypeLookup[T['type']] | null {
        const inp = this._getInput(socketTemplate, eventContext);
        return inp as SocketTypeLookup[T['type']] | null;
    }

    triggerOutput(outputId: string, eventContext: iEventContext): void {
        const trigger = this.outTriggers.get(outputId);

        if (trigger?.connection){
            try{
                const node = trigger.connection.node as iEngineNode;
                trigger.connection.execute.call(node, eventContext, null);
            }
            catch(e){
                console.error(e);
                this.engine.stop();
                return;
            }
        }
    }

    throwOnNullInput<T extends iInput>(socketTemplate: T & {isList?: never}, eventContext: iEventContext, errorId: string, fatal?: false | never): SocketTypeLookup[T['type']] | typeof Node_Enums.THROWN | null;
    throwOnNullInput<T extends iInput>(socketTemplate: T & {isList: true}, eventContext: iEventContext, errorId: string, fatal?: false | never): Array<SocketTypeLookup[T['type']]> | typeof Node_Enums.THROWN | null;
    throwOnNullInput<T extends iInput>(socketTemplate: T & {isList?: never}, eventContext: iEventContext, errorId: string, fatal: true): SocketTypeLookup[T['type']] | null;
    throwOnNullInput<T extends iInput>(socketTemplate: T & {isList: true}, eventContext: iEventContext, errorId: string, fatal: true): Array<SocketTypeLookup[T['type']]> | null;
    throwOnNullInput<T extends iInput>(socketTemplate: T & {isList: true}, eventContext: iEventContext, errorId: string, fatal?: boolean): SocketTypeLookup[T['type']] | Array<SocketTypeLookup[T['type']]> | typeof Node_Enums.THROWN | null {
        const inputName = socketTemplate.id;
        const input = this.inputs.get(inputName);

        if (!input) {
            throw new Error(`Unable to find input ${JSON.stringify(socketTemplate)} in node "${this.template.id}"`);
        }

        const value = this._getInput(socketTemplate, eventContext) as SocketTypeLookup[T['type']];
        const hasVal = !(value == null && value == undefined);
        const returnNull = !(input?.connection);

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

    setNodeData<T>(data: T): void {
        this._nodeData = data;
    }

    getNodeData<T>(): T {
        return this._nodeData as T;
    }
}
