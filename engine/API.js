const DEFAULT_ENV_CALLBACKS = {
    log: msg => console.log(msg),
    warning: warning => console.warn(warning),
    error: error => console.error(error),
    nodeException: (node, error) => console.error(error),
};
Object.freeze(DEFAULT_ENV_CALLBACKS);

export default class API {
    static get DEFAULT_ENV_CALLBACKS(){return DEFAULT_ENV_CALLBACKS}

    constructor({
        keymap,
        getLoadedRoom,
        envCallbacks
    }){
        this.keymap = keymap;
        this._getLoadedRoom = getLoadedRoom;

        //integrate callbacks
        Object.assign(this, DEFAULT_ENV_CALLBACKS);
        Object.assign(this, envCallbacks);
    }

    get room(){return this._getLoadedRoom()}
}