export default class Node{
    constructor(template, id, api){
        this.templateId = template.id;
        this.nodeId = id;
        this.api = api;
        this.inTriggers = {};
        this.outTriggers = {};
        this.inputs = {};
        this.outputs = {};
        this.methods = {};

        template.inTriggers?.forEach(trigger => {
            const {execute} = trigger;
            this.inTriggers[trigger.id] = {
                execute,
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
            this.outputs[output.id] = {connection: null};
        })

        for (let method in template.methods){
            this.methods[method] = template.methods[method].bind(this);
        }
    }
}