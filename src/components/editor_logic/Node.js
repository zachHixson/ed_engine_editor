export default class Node{
    constructor(template, id, pos = new Victor(), graphId){
        this.templateId = template.id;
        this.nodeId = id;
        this.isEvent = template.isEvent;
        this.widget = template.widget;
        this.widgetData;
        this.inTriggers = new Map();
        this.outTriggers = new Map();
        this.inputs = new Map();
        this.outputs = new Map();
        this.graphId = graphId;
        this.domRef = null;
        this.pos = pos.clone();
        this.updateConnectionsCallback = null;

        template.inTriggers?.forEach(trigger => {
            this.inTriggers.set(trigger.id, {
                id: trigger.id,
            });
        });

        template.outTriggers?.forEach(trigger => {
            this.outTriggers.set(trigger, {
                id: trigger,
                connection: null,
            });
        });

        template.inputs?.forEach(input => {
            let value = input.default;

            if (value === undefined){
                switch(input.type){
                    case Shared.SOCKET_TYPE.NUMBER:
                        value = 0;
                        break;
                    case Shared.SOCKET_TYPE.STRING:
                        value = '';
                        break;
                    case Shared.SOCKET_TYPE.BOOL:
                        value = false;
                        break;
                }
            }

            this.inputs.set(input.id, {
                id: input.id,
                type: input.type,
                value,
                connection: null,
                required: input.required,
                triple: input.triple,
            });
        });

        template.outputs?.forEach(output => {
            this.outputs.set(output.id, {
                id: output.id,
                type: output.type,
            });
        });
    }

    toSaveData(){
        let inputs = [];
        let roundedPos = new Victor(
            Math.floor(this.pos.x * 100) / 100,
            Math.floor(this.pos.y * 100) / 100
        );
        let outObj;

        this.inputs.forEach(({id, value}) => inputs.push({id, value}));

        outObj = {
            templateId: this.templateId,
            nodeId: this.nodeId,
            graphId: this.graphId,
            pos: roundedPos.toObject(),
            inputs,
        }

        if (this.widget){
            outObj.widgetData = JSON.stringify(this.widgetData);
        }

        return outObj;
    }

    fromSaveData(data){
        if (data.widgetData){
            this.widgetData = JSON.parse(data.widgetData);
        }

        data.inputs.forEach(input => {
            const nodeInput = this.inputs.get(input.id);
            if (!nodeInput) return;
            nodeInput.value = input.value;
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
        this.updateConnectionsCallback();
    }
};