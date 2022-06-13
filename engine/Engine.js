import Renderer from './Renderer.js';
import Logic from './Logic';
import API from './API';
import Font_Renderer from './Font_Renderer.js';
import Dialog_Box from './Dialog_Box.js';

class Engine{
    static get VERSION(){return '0.1.0'}
    static get DEFAULT_ENV_CALLBACKS(){return API.DEFAULT_ENV_CALLBACKS}
    static get ACTION_KEY(){return 'Space'}

    constructor({canvas, gameData, callbacks}){
        this._canvas = canvas;
        this._timeStart = null;
        this._curTime = null;
        this._deltaTime = null;
        this._lastLoopTimestamp = null;
        this._isRunning = false;
        this._loadedRoom = null;
        this._renderer = new Renderer(this._canvas);
        this._dialogBox = new Dialog_Box(this._canvas);
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
            registerCollision: this._registerCollision
        });
        this._gameData = this._parseGameData(gameData);

        ///////////////
        // debug code
        this._dialogBox.text = 'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum';

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
            this._processDebugNav();
            this._processCollisions();
            this._updateCamera();
        }
        catch(e){
            console.error(e);
            this.stop();
            return;
        }

        this._renderer.render();
        this._dialogBox.render(this._deltaTime);

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

    _updateCamera(){
        const camera = this._loadedRoom.camera;
        const {MOVE_TYPES, SCROLL_DIRS, FOLLOW_TYPES} = Shared.Camera;

        camera.pos.add(camera.velocity.clone().multiplyScalar(this._deltaTime));

        switch(camera.moveType){
            case MOVE_TYPES.LOCKED:
                camera.velocity.x = 0;
                camera.velocity.y = 0;
                break;

            case MOVE_TYPES.FOLLOW:
                const target = this._loadedRoom.instances.list.find(
                    camera.followObjId,
                    instance => instance.id
                );
                const targetPos = target.pos.clone().addScalar(8);

                switch(camera.followType){
                    case FOLLOW_TYPES.SMOOTH:
                        camera.pos.copy(targetPos);
                        break;
                    case FOLLOW_TYPES.TILED:
                        const width = 240 * camera.size;
                        
                        if (!camera.tiledOrigin){
                            camera.tiledOrigin = camera.pos.clone();
                        }

                        camera.pos.x = Math.floor((targetPos.x - camera.tiledOrigin.x + (width / 2)) / width) * width;
                        camera.pos.y = Math.floor((targetPos.y - camera.tiledOrigin.y + (width / 2)) / width) * width;
                        camera.pos.x += camera.tiledOrigin.x;
                        camera.pos.y += camera.tiledOrigin.y;
                }

                break;
            
            case MOVE_TYPES.SCROLL:
                const speed = camera.scrollSpeed * this._deltaTime;

                switch(camera.scrollDir){
                    case SCROLL_DIRS.UP:
                        camera.pos.y -= speed;
                        break;
                    case SCROLL_DIRS.DOWN:
                        camera.pos.y += speed;
                        break;
                    case SCROLL_DIRS.RIGHT:
                        camera.pos.x += speed;
                        break;
                    case SCROLL_DIRS.LEFT:
                        camera.pos.x -= speed;
                        break;
                }
        }
    }

    _processCollisions = ()=>{
        this._mapInstanceOverlaps();
        this._dispatchCollisionEvents();
    }

    _mapInstanceOverlaps = ()=>{
        let overlappedExit;

        this._loadedRoom.instances.list.forEach(instance => {
            const overlappingInstances = instance.hasCollisionEvent ? this.api.getInstancesOverlapping(instance) : [];
            const overlappingExits = instance.triggerExits ? this.api.getExitsOverlapping(instance) : [];

            //iterate over overlapped instances and make collision entries
            for (let i = 0; i < overlappingInstances.length; i++){
                const collisionInstance = overlappingInstances[i];
                this._registerCollision(instance, collisionInstance);
            }

            //pick first exit that was overlapped
            if (overlappingExits.length > 0 && !overlappedExit){
                overlappedExit = overlappingExits[0];
            }
        });

        if (overlappedExit){
            if (overlappedExit.isEnding){
                this._triggerEnding(overlappedExit.endingDialog);
            }
            else{
                this._triggerExit(overlappedExit);
            }
        }
    }

    _registerCollision = (sourceInstance, collisionInstance, force = false)=>{
        let sourceInstanceEntry;

        //create entry for source instance if it does not already exist
        if (!this._collisionMap[sourceInstance.id]){
            this._collisionMap[sourceInstance.id] = {
                sourceInstance,
                collisions: {}
            };
        }

        sourceInstanceEntry = this._collisionMap[sourceInstance.id];

        //Register collision to map
        if (sourceInstanceEntry.collisions[collisionInstance.id]){
            const ref = sourceInstanceEntry.collisions[collisionInstance.id];
            ref.startCollision = ref.active ? ref.startCollision : this._curTime;
            ref.lastChecked = this._curTime;
            ref.active = true;
            ref.force = force;
        }
        else{
            sourceInstanceEntry.collisions[collisionInstance.id] = {
                instance: collisionInstance,
                startCollision: this._curTime,
                lastChecked: this._curTime,
                active: true,
                force,
            }
        }
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

    _triggerEnding(endingText){
        console.log(endingText);
    }

    _triggerExit(exit){
        console.log(exit.name);
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
        if (!this._keymap[e.code] && !this._dialogBox.active){
            this._keymap[e.code] = true;
            this.api.dispatchNodeEvent('e_keyboard', {
                which_key: e.key.toUpperCase(),
                code: e.code,
                type: 'down',
            });
        }
        else if (e.code == Engine.ACTION_KEY){
            this._dialogBox.nextPage();
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