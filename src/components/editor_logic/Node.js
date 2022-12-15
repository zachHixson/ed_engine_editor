import { EventListenerMixin } from "../common/Event_Listener";

export default class Node extends EventListenerMixin() {
    constructor(template, id, pos = new Victor(), graphId, editorAPI){
        super(...arguments);
        this._template = template;
        this.nodeId = id;
        this.isEvent = template.isEvent;
        this.widget = template.widget;
        this.widgetData;
        this.inTriggers = new Map();
        this.outTriggers = new Map();
        this.inputs = new Map();
        this.outputs = new Map();
        this.graphId = graphId;
        this._editorAPI = editorAPI;
        this.domRef = null;
        this.pos = pos.clone();
        this.dataCache = new Map();

        //map template to node
        let inputAnys = 0;

        template.inTriggers?.forEach(trigger => {
            this.inTriggers.set(trigger.id, {
                id: trigger.id,
                node: this,
            });
        });

        template.outTriggers?.forEach(trigger => {
            this.outTriggers.set(trigger, {
                id: trigger,
                node: this,
            });
        });

        template.inputs?.forEach(input => {
            let value = input.default;

            if (value === undefined){
                value = Shared.SOCKET_DEFAULT.get(input.type);
            }

            inputAnys += input.type == Shared.SOCKET_TYPE.ANY;

            this.inputs.set(input.id, Object.assign({
                value,
                node: this,
            }, input));
        });

        template.outputs?.forEach(output => {
            this.outputs.set(output.id, Object.assign({node: this}, output));
        });

        //bind template events
        for (let prop in template){
            const value = template[prop];

            if (prop[0] == '$' && typeof value == 'function'){
                const eventName = prop.substring(1);
                this.addEventListener(eventName, value.bind(this));
            }
        }

        //error out if there are too many any sockets
        if (inputAnys > 1){
            console.error(`Error in node template '${this.templateId}'. Nodes can currently only have 1 'ANY' input socket at a time.`);
        }

        this.dispatchEvent(new CustomEvent("init"));
    }

    get template(){return this._template}
    get templateId(){return this._template.id}
    get editorAPI(){return this._editorAPI}

    toSaveData(){
        this.dispatchEvent(new CustomEvent("beforeSave"));

        const roundedPos = new Victor(
            Math.floor(this.pos.x * 100) / 100,
            Math.floor(this.pos.y * 100) / 100
        );
        const outObj = {
            templateId: this.templateId,
            nodeId: this.nodeId,
            graphId: this.graphId,
            pos: roundedPos.toObject(),
            inputs: [],
        };

        this.inputs.forEach(({id, value}) => outObj.inputs.push({id, value}));

        if (this.widget){
            outObj.widgetData = JSON.stringify(this.widgetData);
        }

        this.dispatchEvent(new CustomEvent("afterSave", {detail: outObj}));

        return outObj;
    }

    fromSaveData(data){
        this.dispatchEvent(new CustomEvent("beforeLoad", {detail: data}));

        if (data.widgetData){
            this.widgetData = JSON.parse(data.widgetData);
        }

        data.inputs.forEach(input => {
            const nodeInput = this.inputs.get(input.id);
            if (!nodeInput) return;
            nodeInput.value = input.value;
        });

        this.dispatchEvent(new CustomEvent("afterLoad"));

        return this;
    }

    setEditorAPI(context){
        this.editorAPI = context;
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
        this.dispatchEvent(new CustomEvent("onMove", {detail: newPos}));
    }

    method(methodName, data = []){
        const method = this.template.methods[methodName];

        if (!method){
            console.error(`Could not find method "${methodName}" in template ${this.templateId}`);
            return;
        }

        return method.call(this, ...data);
    }

    getInput(inputName){
        const input = this.inputs.get(inputName);

        if (!input){
            console.error(`ERROR: No input "${inputName}" found on node "${this.templateId}"`);
            return null;
        }

        if (!input.hideSocket){
            console.warn(`Warning: Attempting to get input value for input with visible socket "${inputName}". Connections are not traced in editor, returning static input value.`);
        }

        return input.value;
    }
};