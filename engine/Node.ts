import {
    iEngineInput,
    iEngineLogic,
    iEngineNode,
    iNodeTemplate,
    Object_Instance,
    convertSocketType,
    NODE_MAP,
    iNodeSaveData
} from "@engine/core/core";
import { iAnyObj } from "./core/interfaces";
import Engine from "./Engine";
import Logic from "./Logic";

export default class Node implements iEngineNode {
    private _getInstanceCallback: (()=>Object_Instance) | null = null;
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
    execute: ((...args: any)=>void) | null = null;
    methods: Map<string, (...args: any)=>any> = new Map();

    constructor(nodeData: iNodeSaveData, logic: Logic, engine: Engine){
        const template = NODE_MAP.get(nodeData.templateId)!;

        template.beforeLoad?.call(this, nodeData);
        
        this.template = template;
        this.nodeId = nodeData.nodeId;
        this.parentScript = logic;
        this.engine = engine;
        this.isEvent = template.isEvent ?? false;
        this.widgetData = nodeData.widgetData ? JSON.parse(nodeData.widgetData) : null;
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
            const {id, type} = input;
            const def = input.default ?? 0;

            this.inputs.set(id, {
                value: def,
                type,
                connection: null,
            });
        });

        template.outputs?.forEach(output => {
            const {id, type, execute} = output;
            this.outputs.set(output.id, {
                id,
                connection: null,
                node: this,
                type,
                execute,
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
            this.methods.set(method, template.methods[method]);
        }

        this.template.afterLoad?.call(this);
        this.template.init?.call(this);
    }

    get instance(){return this._getInstanceCallback!()}
    get data(){return this._dataCache ?? {}};

    setInstanceCallback(callback: ()=>Object_Instance): void {
        this._getInstanceCallback = callback;
    }

    executeEvent(data: any): void {
        if (!this.isEvent) {
            console.error('Error: Cannot call \"executeEvent()\" from non-event node');
            return
        };

        //execute first node
        if (this.execute){
            this.execute.call(this, data);
        }
        else{
            const triggerId = data?.trigger ?? this.defaultTriggerId;
            this.triggerOutput(triggerId);
        }
    }

    method(methodName: string, data?: any): any {
        return this.methods.get(methodName)?.call(this, data);
    }

    getWidgetData(): any {
        return this.widgetData;
    }

    getInput(inputName: string): iEngineInput {
        const input = this.inputs.get(inputName)!;
        let inputVal;

        if (input.connection){
            const node = input.connection.node;
            const method = input.connection.execute;
            const val = node.method(method);

            inputVal = convertSocketType(input.connection.type, input.type, val);
        }
        else{
            inputVal = input.value;
        }
        
        return inputVal;
    }

    triggerOutput(outputId: string){
        const trigger = this.outTriggers.get(outputId);

        if (trigger?.connection){
            const node = trigger.connection.node;
            const method = trigger.connection.execute;
            node.method(method);
        }
    }
}