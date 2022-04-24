export default class Node{
    constructor(template, id, api){
        this.templateId = template.id;
        this.nodeId = id;
        this.api = api;
        this.isEvent = template.isEvent;
        this.widgetData;
        this.defaultTriggerId = null;
        this.inTriggers = {};
        this.outTriggers = {};
        this.inputs = {};
        this.outputs = {};
        this.methods = {};
        this._dataCache = null;
        this._getInstanceCallback;

        template.inTriggers?.forEach(trigger => {
            const {execute} = trigger;
            this.inTriggers[trigger.id] = {
                execute,
                node: this,
                connection: null,
            };
        });

        template.outTriggers?.forEach(trigger => {
            this.outTriggers[trigger] = {connection: null};
        });

        template.inputs?.forEach(input => {
            this.inputs[input.id] = {
                value: input.value,
                connection: null,
            };
        });

        template.outputs?.forEach(output => {
            const {execute} = output;
            this.outputs[output.id] = {
                connection: null,
                node: this,
                execute,
            };
        })

        if (template.outTriggers?.length > 0){
            this.defaultTriggerId = template.outTriggers[0];
        }

        for (let method in template.methods){
            this.methods[method] = template.methods[method];
        }
    }

    get instance(){return this._getInstanceCallback()}

    setInstanceCallback = (callback)=>{
        this._getInstanceCallback = callback;
    }

    executeEvent = (data)=>{
        if (!this.isEvent) {
            console.error('Error: Cannot call \"executeEvent()\" from non-event node');
            return
        };

        this._dataCache = data;

        //execute first node
        const triggerId = data?.trigger ?? this.defaultTriggerId;
        this.triggerOutput(triggerId);

        this._dataCache = null;
    }

    method = (methodName, data)=>{
        return this.methods[methodName].call(this, data);
    }

    getWidgetData = ()=>{
        return this.widgetData;
    }

    getInput = (inputName)=>{
        const input = this.inputs[inputName];

        if (input.connection){
            const node = input.connection.node;
            const method = input.connection.execute;
            return node.method(method);
        }
        
        return input.value;
    }

    triggerOutput = (outputId)=>{
        const trigger = this.outTriggers[outputId];

        if (trigger.connection){
            const node = trigger.connection.node;
            const method = trigger.connection.execute;
            node.method(method);
        }
    }
}