import Renderer from './Renderer.js';
import Logic from './Logic';
import API from './API';

class Engine{
    static get VERSION(){return '0.1.0'}
    static get DEFAULT_ENV_CALLBACKS(){return API.DEFAULT_ENV_CALLBACKS}

    constructor({canvas, gameData, callbacks}){
        this._canvas = canvas;
        this._timeStart = null;
        this._curTime = null;
        this._deltaTime = null;
        this._lastLoopTimestamp = null;
        this._isRunning = false;
        this._loadedRoom = null;
        this._renderer = new Renderer(this._canvas);
        this._nextAnimationFrame = null;
        this._keymap = {};
        this._collisionMap = {};
        this._globalVariables = {};
        this._api = new API({
            keymap: this._keymap,
            globalVariables: this._globalVariables,
            getCurrentTime: ()=>this._curTime,
            getDeltaTime: ()=>this._deltaTime,
            getLoadedRoom: ()=>this._loadedRoom,
            getCollisionMap: ()=>this._collisionMap,
            envCallbacks: callbacks,
        });
        this._gameData = this._parseGameData(gameData);

        this._linkLogic();
    }

    get api(){return this._api};

    start = ()=>{
        this._isRunning = true;
        this._timeStart = performance.now();
        this._curTime = this._timeStart;
        this._lastLoopTimestamp = this._timeStart;

        this._bindInputEvents();

        //load first room
        if (this._gameData.rooms.length <= 0){
            this.api.error('No rooms found in game data');
            this.stop();
            return;
        }
        else{
            const startRoomId = this._gameData.startRoom ?? this._gameData.rooms[0].id;

            try{
                this.loadRoom(startRoomId);
            }
            catch (e){
                console.error(e);
                this.stop();
                return;
            }
        }

        requestAnimationFrame(this._updateLoop);
    }

    stop = ()=>{
        cancelAnimationFrame(this._nextAnimationFrame);
        this._unbindInputEvents();
    }

    loadRoom = (roomId)=>{
        const room = this._gameData.rooms.find(r => r.id == roomId);
        this.api.dispatchNodeEvent('e_before_destroy');
        this._loadedRoom = room.persist ? room : room.clone();
        this._renderer.setRoom(this._loadedRoom);
        this.api.clearNodeEvents();

        //register instance node events
        this._loadedRoom.instances.list.forEach(instance => {
            const logicEvents = instance.logic?.events;

            for (const event in logicEvents){
                this.api.registerNodeEvent(event, instance);
            }
        });

        this.api.dispatchNodeEvent('e_create');
    }

    _updateLoop = (time)=>{
        this._curTime = time;
        this._deltaTime = (time - this._lastLoopTimestamp) / 1000;

        try{
            this._loadedRoom.camera.update(this._deltaTime);
            this._processDebugNav();
            this._processCollisions();
        }
        catch(e){
            console.error(e);
            this.stop();
            return;
        }

        this._renderer.render();

        this._lastLoopTimestamp = time;
        this._nextAnimationFrame = requestAnimationFrame(this._updateLoop);
    }

    _processDebugNav = ()=>{
        const camera = this._loadedRoom.camera;
        const controlVelocity = new Victor(0, 0);
        const speed = 2 * camera.size;
        const zoomSpeed = 0.1;
        let zoom = 0;

        controlVelocity.y = (!!this._keymap['KeyI'] * speed) - (!!this._keymap['KeyK'] * speed);
        controlVelocity.x = (!!this._keymap['KeyJ'] * speed) - (!!this._keymap['KeyL'] * speed);
        zoom = (!!this._keymap['KeyO'] * zoomSpeed) - (!!this._keymap['KeyU'] * zoomSpeed);

        camera.velocity.copy(controlVelocity);
        camera.size += zoom;
    }

    _processCollisions = ()=>{
        this._mapInstanceOverlaps();
        this._dispatchCollisionEvents();
    }

    _mapInstanceOverlaps = ()=>{
        this._loadedRoom.instances.list.forEach(instance => {
            let overlappingInstances;

            if (!instance.hasCollisionEvent){
                return;
            }

            overlappingInstances = this.api.getInstancesOverlapping(instance);

            if (overlappingInstances.length <= 0){
                return;
            }

            //iterate over overlapped instances and make collision entries
            for (let i = 0; i < overlappingInstances.length; i++){
                const collisionInstance = overlappingInstances[i];
                this.api.registerCollision(instance, collisionInstance);
            }
        });
    }

    _dispatchCollisionEvents = ()=>{
        for (const instanceKey in this._collisionMap){
            const instanceEntry = this._collisionMap[instanceKey];
            const sourceInstance = instanceEntry.sourceInstance;

            for (const collisionKey in instanceEntry.collisions){
                const collision = instanceEntry.collisions[collisionKey];

                if (collision.active){
                    let eventType;

                    if (collision.startCollision == this._curTime || collision.force){
                        eventType = Shared.COLLISION_EVENT.START;
                    }
                    else if (collision.lastChecked != this._curTime){
                        eventType = Shared.COLLISION_EVENT.STOP;
                        collision.active = false;
                    }
                    else{
                        eventType = Shared.COLLISION_EVENT.REPEAT;
                    }

                    collision.force = false;

                    sourceInstance.logic.executeEvent('e_collision', sourceInstance, {
                        type: eventType
                    });
                }
            }
        }
    }

    _parseGameData = (gameData)=>{
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

    _linkLogic = ()=>{
        const objects = this._gameData.objects;
        const logicScripts = this._gameData.logic;

        for (let i = 0; i < objects.length; i++){
            const curObj = objects[i];
            curObj.logicScript = logicScripts.find(l => l.id == curObj.logicScript);
        }
    }

    _bindInputEvents = ()=>{
        document.addEventListener("keydown", this._keyDown);
        document.addEventListener("keyup", this._keyUp);
    }

    _keyDown = (e)=>{
        if (!this._keymap[e.code]){
            this._keymap[e.code] = true;
            this.api.dispatchNodeEvent('e_keyboard', {
                which_key: e.key.toUpperCase(),
                code: e.code,
                type: 'down',
            });
        }
    }

    _keyUp = (e)=>{
        this._keymap[e.code] = false;
        this.api.dispatchNodeEvent('e_keyboard', {
            which_key: e.key.toUpperCase(),
            code: e.code,
            type: 'up',
        });
    }

    _unbindInputEvents = ()=>{
        document.removeEventListener("keydown", this._keyDown);
        document.removeEventListener("keyup", this._keyUp);
    }
}

export default Engine;