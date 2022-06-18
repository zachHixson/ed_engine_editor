import Renderer from './Renderer.js';
import Logic from './Logic';
import Dialog_Box from './Dialog_Box.js';
import Dialog_Fullscreen from './Dialog_Fullscreen.js';

const DEFAULT_ENV_CALLBACKS = {
    log: function(){console.log(...arguments)},
    warn: function(){console.warn(...arguments)},
    error: function(){console.error(...arguments)},
    nodeException: function(error, treeData){console.error(error)},
    restart: function(){location.reload()}
};
Object.freeze(DEFAULT_ENV_CALLBACKS);

class Engine{
    static get VERSION(){return '0.1.0'}
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
        this._dialogFullscreen = new Dialog_Fullscreen(this._canvas);
        this._nextAnimationFrame = null;
        this._keymap = {};
        this._nodeEventMap = {};
        this._nodeAsyncEventMap = {};
        this._nodeEventCache = {};
        this._collisionMap = {};
        this._globalVariables = {};
        this._errorLogs = {};
        this._gameData = this._parseGameData(gameData);
        this._previousTransition = {exit: null, instance: null};

        //integrate callbacks
        Object.assign(this, DEFAULT_ENV_CALLBACKS);
        Object.assign(this, callbacks);

        this._linkLogic();
        this._dialogBox.onCloseCallback = this._onDialogBoxClose;
        this._dialogFullscreen.onCloseCallback = this._onFullScreenClose;
    }

    get room(){return this._loadedRoom}
    get currentTime(){return this._curTime}
    get deltaTime(){return this._deltaTime}

    _loadRoom = (roomId)=>{
        const room = this._gameData.rooms.find(r => r.id == roomId);
        this._dispatchNodeEvent('e_before_destroy');
        this._loadedRoom = room.persist ? room : room.clone();
        this._renderer.setRoom(this._loadedRoom);
        this._clearNodeEvents();

        //setup instances
        this._loadedRoom.instances.list.forEach(instance => {
            this._registerInstanceEvents(instance);
        });

        this._dispatchNodeEvent('e_create');
    }

    _updateLoop = (time)=>{
        this._curTime = time;
        this._deltaTime = Math.max((time - this._lastLoopTimestamp) / 1000, 0);

        this._update();

        this._lastLoopTimestamp = time;
        this._nextAnimationFrame = requestAnimationFrame(this._updateLoop);
    }

    _update = ()=>{
        try{
            this._processDebugNav();
            this._processCollisions();
            this._updateCamera();
        }
        catch(e){
            this.error(e);
            this.stop();
            return;
        }

        this._renderer.render(this.deltaTime);
        this._dialogBox.render(this.deltaTime);
        this._dialogFullscreen.render(this.deltaTime);
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
                    instance => instance.id == camera.followObjId
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
        const prevExit = this._previousTransition.exit;
        const prevInst = this._previousTransition.instance;
        let overlappedExit;
        let triggeredInstance;
        let doubleTriggerExit;

        this._loadedRoom.instances.list.forEach(instance => {
            const overlappingInstances = instance.hasCollisionEvent ? this.getInstancesOverlapping(instance) : [];
            const overlappingExits = instance.triggerExits ? this.getExitsOverlapping(instance) : [];

            //iterate over overlapped instances and make collision entries
            for (let i = 0; i < overlappingInstances.length; i++){
                const collisionInstance = overlappingInstances[i];
                this.registerCollision(instance, collisionInstance);
            }

            //pick first exit that was overlapped
            if (overlappingExits.length > 0 && !overlappedExit){
                overlappedExit = overlappingExits[0];
                triggeredInstance = instance;
            }
        });

        doubleTriggerExit = prevExit == overlappedExit && prevInst == triggeredInstance;

        if (overlappedExit){
            if (!doubleTriggerExit){
                if (overlappedExit.isEnding){
                    this._triggerEnding(overlappedExit.endingDialog);
                }
                else{
                    this._triggerExit(overlappedExit, triggeredInstance);
                }
            }
        }
        else{
            this._previousTransition.exit = null;
            this._previousTransition.instance = null;
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
                        type: eventType,
                        instance: sourceInstance
                    });
                }
            }
        }
    }

    _triggerEnding(endingText){
        if (!this._dialogFullscreen.active){
            this._dialogFullscreen.open(endingText);
        }
    }

    _triggerExit(exit, instance){
        if (exit.destinationRoom != null){
            const {
                TO_DESTINATION,
                THROUGH_DESTINATION,
                KEEP_POSIION,
                TRANSITION_ONLY,
            } = Shared.Game_Object.EXIT_TYPES;
            const exitBehavior = instance.objRef.exitBehavior;

            this._loadRoom(exit.destinationRoom);

            if (exit.destinationExit != null){
                const destExit = this.room.exits.list.find(e => e.id == exit.destinationExit);

                switch(exitBehavior){
                    case TO_DESTINATION:
                        instance.pos.copy(destExit.pos);
                        this.room.addInstance(instance);
                        break;
                    case THROUGH_DESTINATION:
                        const velocity = instance.pos.clone().subtract(instance.lastPos);
                        const destPos = destExit.pos.clone();
                        const normDir = velocity.clone();
                        normDir.x = (Math.abs(normDir.x) > 0) * Math.sign(normDir.x) * 16;
                        normDir.y = (Math.abs(normDir.y) > 0) * Math.sign(normDir.y) * 16;
                        destPos.add(normDir);
                        instance.pos.copy(destPos);
                        this.room.addInstance(instance);
                        break
                    case KEEP_POSIION:
                        this.room.addInstance(instance);
                        break;
                    case TRANSITION_ONLY:
                        break;
                }

                this._previousTransition.exit = destExit;
                this._previousTransition.instance = instance;
            }
            else{
                switch(exitBehavior){
                    case TO_DESTINATION:
                    case THROUGH_DESTINATION:
                    case KEEP_POSIION:
                        this.room.addInstance(instance);
                        break;
                    case TRANSITION_ONLY:
                        break;
                }
            }

            if (exitBehavior != TRANSITION_ONLY){
                this._registerInstanceEvents(instance);
                instance.id = this.room.curInstId;
            }
        }
        else{
            if (!this._errorLogs['exit_' + exit.id]){
                this.warn('no_destination_specified');
                this._errorLogs['exit_' + exit.id] = true;
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
        loadedData.logic = parsedJson.logic.map(l => new Logic(l, this));

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
        if (!this._keymap[e.code] && !this._dialogBox.active && !this._dialogFullscreen.active){
            this._keymap[e.code] = true;
            this._dispatchNodeEvent('e_keyboard', {
                which_key: e.key.toUpperCase(),
                code: e.code,
                type: 'down',
            });
        }
        else if (e.code == Engine.ACTION_KEY){
            this._dialogBox.nextPage();
            this._dialogFullscreen.nextPage();
        }
    }

    _keyUp = (e)=>{
        this._keymap[e.code] = false;
        this._dispatchNodeEvent('e_keyboard', {
            which_key: e.key.toUpperCase(),
            code: e.code,
            type: 'up',
        });
    }

    _unbindInputEvents = ()=>{
        document.removeEventListener("keydown", this._keyDown);
        document.removeEventListener("keyup", this._keyUp);
    }

    _registerInstanceEvents = (instance)=>{
        const logicEvents = instance.logic?.events;

        for (const event in logicEvents){
            this._registerNodeEvent(event, instance);
        }

        instance.initAnimProps();
    }

    _registerNodeEvent = (eventName, instance)=>{
        if (!this._nodeEventMap[eventName]){
            this._nodeEventMap[eventName] = {};
        }

        this._nodeEventMap[eventName][instance.id] = instance;
    }

    _registerAsyncNodeEvent = (node, methodName)=>{
        const tag = this._newAsyncTag();
        this._nodeAsyncEventMap[tag] = {
            instance: node.instance,
            node,
            methodName
        };

        return tag;
    }

    _dispatchNodeEvent = (eventName, data)=>{
        const nodeEvent = this._nodeEventMap[eventName];

        if (!nodeEvent) return;

        for (const instance in nodeEvent){
            nodeEvent[instance].executeNodeEvent(eventName, data);
        }
    }

    _dispatchAsyncNodeEvent = (tag, clearEvent = false)=>{
        const {instance, node, methodName} = this._nodeAsyncEventMap[tag];
        node.logic.executeAsyncNodeMethod(instance, node, methodName);

        if (clearEvent){
            this._nodeAsyncEventMap[tag] = null;
        }
    }

    _clearNodeEvents = ()=>{
        this._nodeEventMap = {};
        this._nodeEventCache = {};
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

    _newAsyncTag = ()=>{
        const LENGTH = 10;
        let tag = '';

        for (let i = 0; i < LENGTH; i++){
            const num = Math.floor(Math.random() * 16).toString(16);
            tag += num;
        }

        return tag;
    }

    _onDialogBoxClose = (tag)=>{
        this._dispatchAsyncNodeEvent(tag, true);
    }

    _onFullScreenClose = (tag, restart)=>{
        if (restart){
            this.stop();
            this.restart();
        }
        else{
            this._dispatchAsyncNodeEvent(tag, true);
        }
    }

    start = ()=>{
        this._isRunning = true;
        this._timeStart = performance.now();
        this._curTime = this._timeStart;
        this._lastLoopTimestamp = this._timeStart;

        this._bindInputEvents();

        //load first room
        if (this._gameData.rooms.length <= 0){
            this.error('No rooms found in game data');
            this.stop();
            return;
        }
        else{
            const startRoomId = this._gameData.startRoom ?? this._gameData.rooms[0].id;

            try{
                this._loadRoom(startRoomId);
            }
            catch (e){
                console.error(e);
                this.stop();
                return;
            }
        }

        this._update();
        requestAnimationFrame(this._updateLoop);
    }

    stop = ()=>{
        cancelAnimationFrame(this._nextAnimationFrame);
        this._unbindInputEvents();
        this._keymap = {};
        this._nodeEventMap = {};
        this._nodeAsyncEventMap = {};
        this._nodeEventCache = {};
        this._collisionMap = {};
        this._globalVariables = {};
    }

    registerCollision = (sourceInstance, collisionInstance, force = false)=>{
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

    setInstancePosition = (instance, pos)=>{
        instance.lastPos.copy(instance.pos);
        this.room.instances.setPositionByRef(instance, pos);
    }

    removeInstance = (instance)=>{
        this.room.removeInstance(instance.id, instance.pos);
    }

    setGlobalVariable = (name, data)=>{
        this._globalVariables[name] = data;
    }

    getGlobalVariable = (name)=>{
        return this._globalVariables[name];
    }

    openDialogBox = (text, node, methodName)=>{
        const asyncTag = node ? this._registerAsyncNodeEvent(node, methodName) : null;
        this._dialogBox.open(text, asyncTag);
    }

    cacheNodeEventData = (tag, data)=>{
        this._nodeEventCache[tag] = data;
    }

    getCachedNodeEventData = (tag)=>{
        return this._nodeEventCache[tag];
    }
}

export default Engine;