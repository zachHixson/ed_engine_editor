export default class Node{
    constructor(template, id, logic, engine){
        this.template = template;
        this.nodeId = id;
        this.logic = logic;
        this.engine = engine;
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
        this._stackTrace = {logic: logic.id, nodeId: id};

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
            const {id, value, type} = input;
            this.inputs[id] = {
                value,
                type,
                connection: null,
            };
        });

        template.outputs?.forEach(output => {
            const {id, type, execute} = output;
            this.outputs[output.id] = {
                id,
                connection: null,
                node: this,
                type,
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

    setInstanceCallback(callback){
        this._getInstanceCallback = callback;
    }

    executeEvent(data){
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

    method(methodName, data){
        return this.methods[methodName].call(this, data);
    }

    getWidgetData(){
        return this.widgetData;
    }

    getInput(inputName){
        const input = this.inputs[inputName];
        let inputVal;

        if (input.connection){
            const node = input.connection.node;
            const method = input.connection.execute;
            const val = node.method(method)

            inputVal = Shared.convertSocketType(input.connection.type, input.type, val);
        }
        else{
            inputVal = input.value;
        }
        
        return inputVal;
    }

    triggerOutput(outputId){
        const trigger = this.outTriggers[outputId];

        if (trigger.connection){
            const node = trigger.connection.node;
            const method = trigger.connection.execute;
            node.method(method);
        }
    }
}