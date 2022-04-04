export default class Node{
    constructor(template, id, pos = new Victor()){
        this.templateId = template.id;
        this.nodeId = id;
        this.isEvent = false;
        this.widget = template.widget;
        this.widgetData;
        this.inTriggers = new Map();
        this.outTriggers = new Map();
        this.inputs = new Map();
        this.outputs = new Map();
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
        this.updateConnectionsCallback();
    }
};