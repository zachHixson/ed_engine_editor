import Renderer from './Renderer.js';
import Logic from './Logic';
import API from './API';

class Engine{
    static get VERSION(){return '0.1.0'}
    static get DEFAULT_ENV_CALLBACKS(){return API.DEFAULT_ENV_CALLBACKS}

    constructor({canvas, gameData, callbacks}){
        this._canvas = canvas;
        this._gameData = this._parseGameData(gameData);
        this._timeStart = null;
        this._lastLoopTimestamp = null;
        this._isRunning = false;
        this._loadedRoom = null;
        this._renderer = new Renderer(this._canvas);
        this._keymap = {};
        this._api = new API({
            keymap: this._keymap,
            getLoadedRoom: ()=>this._loadedRoom,
            envCallbacks: callbacks,
        });
    }

    get time(){return Date.now() - this._timeStart}

    start = ()=>{
        this._isRunning = true;
        this._timeStart = Date.now();
        this._lastLoopTimestamp = this.time;

        this._bindInputEvents();

        //load first room
        if (this._gameData.rooms.length <= 0){
            this._api.error('No rooms found in game data');
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

        controlVelocity.y = (!!this._keymap['i'] * speed) - (!!this._keymap['k'] * speed);
        controlVelocity.x = (!!this._keymap['j'] * speed) - (!!this._keymap['l'] * speed);
        zoom = (!!this._keymap['o'] * zoomSpeed) - (!!this._keymap['u'] * zoomSpeed);

        camera.velocity.copy(controlVelocity);
        camera.size += zoom;
    }

    _parseGameData = (gameData)=>{
        if (typeof gameData == 'object'){
            const newLogic = Object.assign({}, gameData);
            newLogic.logic = newLogic.logic.map(l => l.toSaveData());
            newLogic.logic = newLogic.logic.map(l => new Logic(l));
            return newLogic;
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
        loadedData.logic = parsedJson.logic.map(l => new Logic(l, this._api));

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