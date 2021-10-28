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
                id: null,
                connection: null,
            });
        });

        template.inputs?.forEach(input => {
            this.inputs.set(input.id, {
                type: input.type,
                value: input.default ?? 0,
                connection: null,
            });
        });

        template.outputs?.forEach(output => {
            this.outputs.set(output.id, {
                type: output.type,
                get: output.get,
            });
        });

        for (let method in template.methods){
            this.methods.set(method, template.methods[method]);
        }
    }

    triggerNode(triggerInId){
        let trigger = this.triggers.get(triggerInId).bind(this);
        trigger();
    }

    triggerNext(triggerOutId){
        //get next node and connected input
        //trigger that node's input
    }

    getOutput(outputId){
        let output = this.outputs.get(outputId);
        
        if (output.computed){
            let computed = output.computed.bind(this);
            return computed();
        }
        else if (output.cached){
            return output.cached;
        }
        else{
            console.error('Node template')
        }
    }

    method(methodName, argArray = []){
        let method = this.methods.get(methodName).bind(this);
        method(...argArray);
    }

    throwError(messageId){
        console.error(messageId);
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