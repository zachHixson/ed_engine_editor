import {
    iEngineInput,
    iEngineLogic,
    iEngineNode,
    iNodeTemplate,
    Instance_Object,
    convertSocketType,
    NODE_MAP,
    iNodeSaveData,
    iEngineNodeMethod,
} from "@engine/core/core";
import { iAnyObj } from "./core/interfaces";
import { listConvert } from "./core/nodes/Socket_Conversions";
import Engine from "./Engine";
import Logic from "./Logic";
import { SOCKET_TYPE } from "./core/nodes/Node_Enums";

export default class Node implements iEngineNode {
    private _dataCache: Map<string, any> = new Map();
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
    execute: ((instanceContext: Instance_Object, data: any)=>void) | null = null;
    methods: Map<string, iEngineNodeMethod> = new Map();

    constructor(nodeData: iNodeSaveData, logic: Logic, engine: Engine){
        const template = NODE_MAP.get(nodeData.templateId)!;

        this.engine = engine;

        template.beforeLoad?.call(this, nodeData);
        
        this.template = template;
        this.nodeId = nodeData.nodeId;
        this.parentScript = logic;
        this.isEvent = template.isEvent ?? false;
        this.widgetData = nodeData.widgetData ?? null;
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
            const {id, type, execute, isList, linkToType} = output;
            this.outputs.set(output.id, {
                id,
                connection: null,
                node: this,
                type,
                execute,
                isList,
                linkToType,
            });
        })

        nodeData.inputs.forEach(srcInput => {
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

    private _triggerInTrigger(executeName: string, instanceContext: Instance_Object): void {
        this.methods.get(executeName)?.call(this, instanceContext);
    }

    private _getOutputData(outputName: string, instanceContext: Instance_Object): any {
        const methodName = this.outputs.get(outputName)?.execute;
        return this.methods.get(methodName!)?.call(this, instanceContext);
    }

    executeEvent(data: any, instanceContext: Instance_Object): void {
        if (!this.isEvent) {
            console.error('Error: Cannot call \"executeEvent()\" from non-event node');
            return
        };

        //execute first node
        if (this.execute){
            this.execute.call(this, instanceContext, data);
        }
        else{
            const triggerId = data?.trigger ?? this.defaultTriggerId;
            this.triggerOutput(triggerId, instanceContext);
        }
    }

    method(methodName: string, data?: any): any {
        return this.methods.get(methodName)?.call(this, data);
    }

    getWidgetData(): any {
        return this.widgetData;
    }

    getInput(inputName: string, instanceContext: Instance_Object): iEngineInput {
        const input = this.inputs.get(inputName)!;

        if (input.connection){
            const node = input.connection.node as Node;
            const val = node._getOutputData(input.connection.id, instanceContext);
            const listResult = listConvert(!!input.connection.isList, !!input.isList, val);

            return convertSocketType(input.connection.type, input.type, listResult);
        }
        else{
            return input.value;
        }
    }

    triggerOutput(outputId: string, instanceContext: Instance_Object): void {
        const trigger = this.outTriggers.get(outputId);

        if (trigger?.connection){
            const node = trigger.connection.node as Node;
            node._triggerInTrigger(trigger.connection.execute, instanceContext);
        }
    }

    getOutputType(outputName: string): { type: SOCKET_TYPE, isList: boolean } {
        const output = this.outputs.get(outputName)!;

        if (output.type != SOCKET_TYPE.ANY || !output.linkToType){
            return { type: output.type, isList: !!output.isList };
        }

        const linkedInputResult = this.getInputType(output.linkToType);

        output.type = linkedInputResult.type;

        return linkedInputResult;
    }

    getInputType(inputName: string): { type: SOCKET_TYPE, isList: boolean } {
        const input = this.inputs.get(inputName)!;
        const inputConnection = input.connection;

        if (input.type != SOCKET_TYPE.ANY || !inputConnection){
            input.type = input.type;
            return { type: input.type, isList: !!input.isList };
        }

        const inheritedResult = inputConnection.node.getOutputType(inputConnection.id);

        input.type = inheritedResult.type;

        return inheritedResult;
    }
}