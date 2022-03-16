import { testLib } from "./testLib";

const DEFAULT_CALLBACKS = {
    log: msg => console.log(msg),
    warning: warning => console.warn(warning),
    error: error => console.error(error),
};
Object.freeze(DEFAULT_CALLBACKS);

class Engine{
    constructor({canvas, gameData, callbacks = {}}){
        this.canvas = canvas;
        this.gameData = gameData;
        this.callbacks = {};

        //only pull in external callbacks that have been registered as default
        for (let callback in Engine.defaultCallbacks){
            this.callbacks[callback] = callbacks[callback] || Engine.defaultCallbacks[callback];
        }
    }

    static get DEFAULT_CALLBACKS(){return DEFAULT_CALLBACKS}

    start(){
        console.log('started');

        this._updateLoop();
    }

    _updateLoop(){
        const ctx = this.canvas.getContext('2d');

        ctx.fillStyle = "black";
        ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    }

    callTest(){
        testLib();
    }
}

export default Engine;