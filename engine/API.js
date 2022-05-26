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
        getCollisionMap,
        envCallbacks
    }){
        this.keymap = keymap;
        this.globalVariables = globalVariables;
        this._getCurrentTime = getCurrentTime;
        this._getDeltaTime = getDeltaTime;
        this._getLoadedRoom = getLoadedRoom;
        this._getCollisionMap = getCollisionMap;
        this._nodeEventMap = {};

        //integrate callbacks
        Object.assign(this, DEFAULT_ENV_CALLBACKS);
        Object.assign(this, envCallbacks);
    }

    get room(){return this._getLoadedRoom()}
    get currentTime(){return this._getCurrentTime()}
    get deltaTime(){return this._getDeltaTime()}
    get collisionMap(){return this._getCollisionMap()}

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

    getInstancesOverlapping = ({id, pos})=>{
        const broadCheck = this.room.instances.getByRadius(pos, 32);
        return broadCheck.filter(checkInstance => (
            checkInstance.pos.x + 16 > pos.x &&
            checkInstance.pos.x < pos.x + 16 &&
            checkInstance.pos.y + 16 > pos.y &&
            checkInstance.pos.y < pos.y + 16 &&
            checkInstance.id != id
        ));
    }

    registerCollision = (sourceInstance, collisionInstance, force = false)=>{
        let sourceInstanceEntry;

        //create entry for source instance if it does not already exist
        if (!this.collisionMap[sourceInstance.id]){
            this.collisionMap[sourceInstance.id] = {
                sourceInstance,
                collisions: {}
            };
        }

        sourceInstanceEntry = this.collisionMap[sourceInstance.id];

        //Register collision to map
        if (sourceInstanceEntry.collisions[collisionInstance.id]){
            const ref = sourceInstanceEntry.collisions[collisionInstance.id];
            ref.startCollision = ref.active ? ref.startCollision : this.currentTime;
            ref.lastChecked = this.currentTime;
            ref.active = true;
            ref.force = force;
        }
        else{
            sourceInstanceEntry.collisions[collisionInstance.id] = {
                instance: collisionInstance,
                startCollision: this.currentTime,
                lastChecked: this.currentTime,
                active: true,
                force,
            }
        }
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