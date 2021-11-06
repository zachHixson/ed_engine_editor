import Victor from 'victor';

class Node{
    constructor(template, id, pos = new Victor()){
        this.templateId = template.id;
        this.nodeId = id;
        this.isEvent = false;
        this.inTriggers = new Map();
        this.outTriggers = new Map();
        this.inputs = new Map();
        this.outputs = new Map();
        this.methods = new Map();

        if (window.IS_EDITOR){
            this.domRef = null;
            this.pos = pos.clone();
        }

        template.inTriggers?.forEach(trigger => {
            this.inTriggers.set(trigger.id, trigger.execute);
        });

        template.outTriggers?.forEach(trigger => {
            this.outTriggers.set(trigger, {
                id: trigger,
                connection: null,
            });
        });

        template.inputs?.forEach(input => {
            this.inputs.set(input.id, {
                id: input.id,
                type: input.type,
                value: input.default ?? 0,
                connection: null,
            });
        });

        template.outputs?.forEach(output => {
            this.outputs.set(output.id, {
                id: output.id,
                type: output.type,
                get: output.get,
            });
        });

        for (let method in template.methods){
            this.methods.set(method, template.methods[method]);
        }
    }

    toSaveData(){
        let inputs = [];

        this.inputs.forEach(({id, value}) => inputs.push({id, value}));

        return {
            templateId: this.templateId,
            nodeId: this.nodeId,
            pos: this.pos.toObject(),
            inputs,
        }
    }

    fromSaveData(data){
        data.inputs.forEach(input => {
            this.inputs.get(input.id).value = input.value;
        });

        return this;
    }

    setDomRef(domRef){
        this.domRef = domRef;
        this.domRef.style.left = this.pos.x + 'px';
        this.domRef.style.top = this.pos.y + 'px';
    }

    setPos(newPos){
        this.pos.copy(newPos);
        this.domRef.style.left = this.pos.x + 'px';
        this.domRef.style.top = this.pos.y + 'px';
    }
}

export default Node;