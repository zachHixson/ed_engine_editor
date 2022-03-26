import Renderer from './Renderer.js';

const DEFAULT_CALLBACKS = {
    log: msg => console.log(msg),
    warning: warning => console.warn(warning),
    error: error => console.error(error),
};
Object.freeze(DEFAULT_CALLBACKS);

class Engine{
    static get VERSION(){return '0.1.0'}
    static get DEFAULT_CALLBACKS(){return DEFAULT_CALLBACKS}

    constructor({canvas, gameData, callbacks = {}}){
        this._canvas = canvas;
        this._gameData = this._parseGameData(gameData);
        this._callbacks = Object.assign({}, Engine.DEFAULT_CALLBACKS);
        this._timeStart = null;
        this._lastLoopTimestamp = null;
        this._isRunning = false;
        this._loadedRoom = null;
        this._renderer = new Renderer(this._canvas);
        this._keymap = {};

        //map callbacks to engine
        for (let callback in callbacks){
            this._callbacks[callback] = callbacks[callback];
        }
    }

    get time(){return Date.now() - this._timeStart}

    start = ()=>{
        this._isRunning = true;
        this._timeStart = Date.now();
        this._lastLoopTimestamp = this.time;

        this._bindInputEvents();

        //load first room
        if (this._gameData.rooms.length <= 0){
            this._callbacks.error('No rooms found in game data');
            return;
        }
        else{
            const startRoomId = this._gameData.startRoom ?? this._gameData.rooms[0].id;
            this.loadRoom(startRoomId);
        }

        this._updateLoop();
    }

    stop = ()=>{
        this._isRunning = false;
        this._unbindInputEvents();
    }

    loadRoom = (roomId)=>{
        const room = this._gameData.rooms.find(r => r.id == roomId);
        this._loadedRoom = room.persist ? room : room.clone();
        this._renderer.setRoom(this._loadedRoom);
    }

    _updateLoop = ()=>{
        const ctx = this._canvas.getContext('2d');
        const deltaTime = this.time - this._lastLoopTimestamp;

        this._loadedRoom.camera.update(deltaTime);
        this._processDebugNav();
        this._renderer.render();

        if (this._isRunning){
            this._lastLoopTimestamp = this.time;
            requestAnimationFrame(this._updateLoop);
        }
    }

    _processDebugNav = ()=>{
        const camera = this._loadedRoom.camera;
        const controlVelocity = new Victor(0, 0);
        const speed = 2 * camera.size;
        const zoomSpeed = 0.1;
        let zoom = 0;

        if (this._keymap['i']){
            controlVelocity.y += speed;
        }

        if (this._keymap['k']){
            controlVelocity.y -= speed;
        }

        if (this._keymap['j']){
            controlVelocity.x += speed;
        }

        if (this._keymap['l']){
            controlVelocity.x -= speed;
        }

        if (this._keymap['o']){
            zoom += zoomSpeed;
        }

        if (this._keymap['u']){
            zoom -= zoomSpeed;
        }

        camera.velocity.copy(controlVelocity);
        camera.size += zoom;
    }

    _parseGameData = (gameData)=>{
        if (typeof gameData == 'object'){
            return gameData;
        }

        let parsedJson;
        let loadedData = {};

        try {
            parsedJson = JSON.parse(gameData);
        }
        catch (e) {
            console.error("ERROR: Engine could not parse provided JSON", e);
            return;
        }

        loadedData.startRoom = parsedJson.startRoom;
        loadedData.sprites = parsedJson.sprites.map(s => new Shared.Sprite().fromSaveData(s));
        loadedData.objects = parsedJson.objects.map(o => new Shared.Game_Object().fromSaveData(o, loadedData.sprites));
        loadedData.rooms = parsedJson.rooms.map(r => new Shared.Room().fromSaveData(r, loadedData.objects));
        loadedData.logic = parsedJson.logic.map(l => new Shared.Logic().fromSaveData(l));

        return loadedData;
    }

    _bindInputEvents = ()=>{
        document.addEventListener("keydown", this._keyDown);
        document.addEventListener("keyup", this._keyUp);
    }

    _keyDown = (e)=>{
        this._keymap[e.key.toLowerCase()] = true;
    }

    _keyUp = (e)=>{
        this._keymap[e.key.toLowerCase()] = false;
    }

    _unbindInputEvents = ()=>{
        document.removeEventListener("keydown", this._keyDown);
        document.removeEventListener("keyup", this._keyUp);
    }
}

export default Engine;