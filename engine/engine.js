const DEFAULT_CALLBACKS = {
    log: msg => console.log(msg),
    warning: warning => console.warn(warning),
    error: error => console.error(error),
};
Object.freeze(DEFAULT_CALLBACKS);

class Engine{
    constructor({canvas, gameData, callbacks = {}}){
        this._canvas = canvas;
        this._gameData = gameData;
        this._callbacks = Object.assign({}, Engine.DEFAULT_CALLBACKS);
        this._timeStart = Date.now();
        this._isRunning = false;

        //map callbacks to engine
        for (let callback in callbacks){
            this._callbacks[callback] = callbacks[callback];
        }
    }

    static get DEFAULT_CALLBACKS(){return DEFAULT_CALLBACKS}

    get time(){return Date.now() - this._timeStart}

    start = ()=> {
        this._isRunning = true;

        //load game data
        //load room
        //bind input and document events

        this._updateLoop();
    }

    stop = ()=> {
        this._isRunning = false;
        //unbind input and document events
    }

    _updateLoop = ()=> {
        const ctx = this._canvas.getContext('2d');

        ctx.fillStyle = "black";
        ctx.fillRect(0, 0, this._canvas.width, this._canvas.height);

        if (this._isRunning){
            requestAnimationFrame(this._updateLoop);
        }
    }
}

export default Engine;