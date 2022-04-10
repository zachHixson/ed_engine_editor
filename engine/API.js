const DEFAULT_ENV_CALLBACKS = {
    log: function(){console.log(...arguments)},
    warning: function(){console.warn(warning)},
    error: function(){console.error(error)},
    nodeException: function(){console.error(error)},
};
Object.freeze(DEFAULT_ENV_CALLBACKS);

export default class API {
    static get DEFAULT_ENV_CALLBACKS(){return DEFAULT_ENV_CALLBACKS}

    constructor({
        keymap,
        getDeltaTime,
        getLoadedRoom,
        envCallbacks
    }){
        this.keymap = keymap;
        this._getDeltaTime = getDeltaTime;
        this._getLoadedRoom = getLoadedRoom;
        this._nodeEventMap = {};

        //integrate callbacks
        Object.assign(this, DEFAULT_ENV_CALLBACKS);
        Object.assign(this, envCallbacks);
    }

    get room(){return this._getLoadedRoom()}
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
}