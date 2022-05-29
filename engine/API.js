const DEFAULT_ENV_CALLBACKS = {
    log: function(){console.log(...arguments)},
    warning: function(){console.warn(...arguments)},
    error: function(){console.error(...arguments)},
    nodeException: function(error, treeData){console.error(error)},
};
Object.freeze(DEFAULT_ENV_CALLBACKS);

export default class API {
    static get DEFAULT_ENV_CALLBACKS(){return DEFAULT_ENV_CALLBACKS}

    constructor({
        keymap,
        globalVariables,
        getCurrentTime,
        getDeltaTime,
        getLoadedRoom,
        envCallbacks,
        registerCollision
    }){
        this.keymap = keymap;
        this.globalVariables = globalVariables;
        this._getCurrentTime = getCurrentTime;
        this._getDeltaTime = getDeltaTime;
        this._getLoadedRoom = getLoadedRoom;
        this._nodeEventMap = {};

        this.registerCollision = registerCollision;

        //integrate callbacks
        Object.assign(this, DEFAULT_ENV_CALLBACKS);
        Object.assign(this, envCallbacks);
    }

    get room(){return this._getLoadedRoom()}
    get currentTime(){return this._getCurrentTime()}
    get deltaTime(){return this._getDeltaTime()}

    clearNodeEvents = ()=>{
        this._nodeEventMap = {};
    }

    registerNodeEvent = (eventName, instance)=>{
        if (!this._nodeEventMap[eventName]){
            this._nodeEventMap[eventName] = {};
        }

        this._nodeEventMap[eventName][instance.id] = instance;
    }

    dispatchNodeEvent = (eventName, data)=>{
        const nodeEvent = this._nodeEventMap[eventName];

        if (!nodeEvent) return;

        for (const instance in nodeEvent){
            nodeEvent[instance].executeNodeEvent(eventName, data);
        }
    }

    getInstancesAtPosition = (pos)=>{
        const broadCheck = this.room.instances.getByRadius(pos, 32);
        return broadCheck.filter(instance => 
            Shared.isInBounds(
                pos.x,
                pos.y,
                instance.pos.x,
                instance.pos.y,
                instance.pos.x + 15,
                instance.pos.y + 15
            )
        );
    }

    getInstancesOverlapping = (instance)=>{
        return this._filterOverlapping(this.room.instances, instance);
    }

    getExitsOverlapping = (instance)=>{
        return this._filterOverlapping(this.room.exits, instance);
    }

    _filterOverlapping = (entityList, {id, pos, TYPE})=>{
        const broadCheck = entityList.getByRadius(pos, 32);
        return broadCheck.filter(checkEntity => (
                checkEntity.pos.x + 16 > pos.x &&
                checkEntity.pos.x < pos.x + 16 &&
                checkEntity.pos.y + 16 > pos.y &&
                checkEntity.pos.y < pos.y + 16 &&
                (checkEntity.id != id || checkEntity.TYPE != TYPE)
        ));
    }

    setInstancePosition = (instance, pos)=>{
        this.room.instances.setPositionByRef(instance, pos);
    }

    removeInstance = (instance)=>{
        this.room.removeInstance(instance.id, instance.pos);
    }

    setGlobalVariable = (name, data)=>{
        this.globalVariables[name] = data;
    }

    getGlobalVariable = (name)=>{
        return this.globalVariables[name];
    }
}