export default class Node{
    constructor(template, id, pos = new Victor(), graphId){
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
        this.editorAPI = null;
        this.domRef = null;
        this._anyType = null;
        this.pos = pos.clone();
        this.updateConnectionsCallback = null;

        //editor events
        this.onEditorSave = template.editor_onSave;
        this.onEditorLoad = template.editor_onLoad;
        this.onEditorLoadFinished = template.editor_onLoadFinished;
        this.onEditorCreate = template.editor_onCreate;
        this.onEditorVisible = template.editor_onVisible;
        this.onEditorConnection = template.editor_onConnection;
        this.onEditorDisconnect = template.editor_onDisconnect;
        this.onEditorValueChange = template.editor_onValueChange;
        this.onEditorBeforeDelete = template.editor_onBeforeDelete;
        this.onEditorSetAnyType = template.editor_onSetAnyType;

        //map template to node
        let inputAnys = 0;

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
                value = Shared.SOCKET_DEFAULT.get(input.type);
            }

            inputAnys += input.type == Shared.SOCKET_TYPE.ANY;

            this.inputs.set(input.id, Object.assign({
                value,
            }, input));
        });

        template.outputs?.forEach(output => {
            this.outputs.set(output.id, output);
        });

        //error out if there are too many any sockets
        if (inputAnys > 1){
            console.error(`Error in node template '${this.templateId}'. Nodes can currently only have 1 'ANY' input socket at a time.`);
        }
    }

    get template(){return this._template}
    get templateId(){return this._template.id}
    get anyType(){return this._anyType}

    set anyType(value){
        if (value == this._anyType){
            return;
        }
        
        this._anyType = value;
        this.onEditorSetAnyType && this.onEditorSetAnyType.call(this, this.anyType);
    }

    toSaveData(){
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

        this.onEditorSave && this.onEditorSave.call(this, outObj);

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

        this.onEditorLoad && this.onEditorLoad.call(this, data);

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
        this.updateConnectionsCallback();
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

    onCreate(){
        this.onEditorCreate && this.onEditorCreate.call(this);
    }

    onLoadFinished(){
        this.onEditorLoadFinished && this.onEditorLoadFinished.call(this);
    }

    onVisible(){
        this.onEditorVisible && this.onEditorVisible.call(this);
    }

    onNewConnection(connection){
        this.onEditorConnection && this.onEditorConnection.call(this, connection);
    }

    onRemoveConnection(connection){
        this.onEditorDisconnect && this.onEditorDisconnect.call(this, connection);
    }

    onValueChange(socketName, oldVal, newVal){
        this.onEditorValueChange && this.onEditorValueChange(socketName, oldVal, newVal);
    }

    onBeforeDelete(){
        this.onEditorBeforeDelete && this.onEditorBeforeDelete();
    }
};