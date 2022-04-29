export default class Node{
    constructor(template, id, api){
        this.template = template;
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
            const {id, execute} = output;
            this.outputs[output.id] = {
                id,
                connection: null,
                node: this,
                execute,
            };
        })

        if (template.outTriggers?.length > 0){
            this.defaultTriggerId = template.outTriggers[0];
        }

        if (this.isEvent && template.execute){
            this.execute = template.execute;
        }

        for (let method in template.methods){
            this.methods[method] = template.methods[method];
        }
    }

    get instance(){return this._getInstanceCallback()}
    get data(){return this._dataCache};

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
        if (this.execute){
            this.execute.call(this);
        }
        else{
            const triggerId = data?.trigger ?? this.defaultTriggerId;
            this.triggerOutput(triggerId);
        }

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

            if (node.isEvent){
                const inputId = input.connection.id;
                return node.data[inputId] ??
                    console.error('No event data found for \"' +inputId + '\" on node \"' + node.template.id + '\"');
            }
            else{
                const method = input.connection.execute;
                return node.method(method);
            }
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