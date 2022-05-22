export default class Node{
    constructor(template, id, logicId, api){
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
        this._stackTrace = {logic: logicId, nodeId: id};

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

            if (node.isEvent){
                const inputId = input.connection.id;
                inputVal = node.data[inputId];
                
                if (!inputVal){
                    console.error('No event data found for \"' + inputId + '\" on node \"' + node.template.id + '\"');
                    return;
                }
            }
            else{
                const method = input.connection.execute;
                inputVal = node.method(method);
            }

            if (input.connection.type == Shared.SOCKET_TYPE.ANY){
                inputVal = this.castAnyToType(inputVal, input.type);
            }
        }
        else{
            inputVal = input.value;
        }
        
        return inputVal;
    }

    castAnyToType(data, toType){
        const {ANY, NUMBER, STRING, OBJECT, BOOL} = Shared.SOCKET_TYPE;

        switch(toType){
            case ANY:
                return data;
            case NUMBER:
                const float = parseFloat(data);

                if (float == NaN){
                    switch (typeof data){
                        case 'string':
                            this.api.nodeException('cannot_convert_string_to_num', this._stackTrace);
                            throw 'cannot convert string to number';
                        case 'object':
                            this.api.nodeException('cannot_convert_object_to_num', this._stackTrace);
                            throw 'cannot convert object to number';
                        case 'boolean':
                            return data + 0;
                    }
                }

                return float;
            case STRING:
                if (data.type){
                    return data.name;
                }

                return data.toString();
            case OBJECT:
                if (!data.TYPE){
                    this.api.nodeException('data_not_object', this._stackTrace);
                    throw 'incorrect data type';
                }

                return data;
            case BOOL:
                return !!data;
        }
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