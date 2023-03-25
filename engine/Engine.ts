import Renderer from './rendering/Renderer';
import Logic from './Logic';
import Dialog_Box from './text/Dialog_Box';
import Dialog_Fullscreen from './text/Dialog_Fullscreen';
import {
    Exit,
    Room,
    Camera,
    Sprite,
    Game_Object,
    Instance_Base,
    iSerializedGameData,
    iAnyObj,
    Vector,
    Object_Instance,
    Util,
    Spacial_Collection,
    INSTANCE_TYPE,
    Node_Enums,
} from '@engine/core/core';
import Node from './Node';
import iGameData from './iGameData';

export * as Core from '@engine/core/core';

interface iEngineCallbacks {
    log?: (...args: any)=>void
    warn?: (...args: any)=>void
    error?: (...args: any)=>void
    nodeException?: (error: string, treeData: any)=>void;
    restart?: ()=>void
}

interface iCollisionMapping {
    sourceInstance: Instance_Base,
    collisions: Map<number, {
        instance: Instance_Base,
        startCollision: number,
        lastChecked: number,
        active: boolean,
        force: boolean,
    }>,
}

export class Engine implements iEngineCallbacks {
    static get VERSION(){return '0.1.0'}
    static get ACTION_KEY(){return 'Space'}

    private _canvas: HTMLCanvasElement;
    private _timeStart: number = 0;
    private _curTime: number = 0;
    private _deltaTime: number = 0;
    private _lastLoopTimestamp: number = 0;
    private _loadedRoom: Room = new Room();
    private _renderer: Renderer;
    private _dialogBox: Dialog_Box;
    private _dialogFullscreen: Dialog_Fullscreen;
    private _nextAnimationFrame: number = -1;
    private _keymap: Map<string, boolean> = new Map();
    private _nodeEventMap: Map<string, Map<number, Object_Instance>> = new Map();
    private _nodeAsyncEventMap: Map<string, any> = new Map();
    private _collisionMap: Map<number, iCollisionMapping> = new Map();
    private _globalVariables: Map<string, any> = new Map();
    private _errorLogs: Map<string, boolean> = new Map();
    private _gameData: iGameData;
    private _previousTransition: {exit: Exit | null, instance: Instance_Base | null} = {exit: null, instance: null};
    private _mouse = {
        x: 0,
        y: 0,
    };

    log: (...args: any)=>void = function(){console.log(...arguments)};
    warn: (...args: any)=>void = function(){console.warn(...arguments)};
    error: (...args: any)=>void = function(){console.error(...arguments)};
    nodeException: (error: string, treeData: any)=>void = function(error: string, treeData: any){console.error(error)};
    restart: ()=>void = function(){location.reload()};


    constructor(canvas: HTMLCanvasElement, gameData: string, callbacks?: iEngineCallbacks){
        window.IS_ENGINE = true;

        this._canvas = canvas;
        this._renderer = new Renderer(this._canvas);
        this._dialogBox = new Dialog_Box(this._canvas);
        this._dialogFullscreen = new Dialog_Fullscreen(this._canvas);
        this._gameData = this._parseGameData(gameData);

        //integrate callbacks
        if (callbacks){
            if (callbacks.log) this.log = callbacks.log;
            if (callbacks.warn) this.warn = callbacks.warn;
            if (callbacks.error) this.error = callbacks.error;
            if (callbacks.nodeException) this.nodeException = callbacks.nodeException;
            if (callbacks.restart) this.restart = callbacks.restart;
        }

        this._linkLogic();
        this._dialogBox.onCloseCallback = this._onDialogBoxClose;
        this._dialogFullscreen.onCloseCallback = this._onFullScreenClose;
        window.IS_ENGINE = false;
    }

    get room(){return this._loadedRoom}
    get currentTime(){return this._curTime}
    get deltaTime(){return this._deltaTime}
    get mouse(){return this._mouse}

    private _loadRoom = (roomId: number): void =>{
        const room = this._gameData.rooms.find((r: Room) => r.id == roomId)!;
        this._dispatchLogicEvent('e_before_destroy');
        this._loadedRoom = room.persist ? room : room.clone();
        this._collisionMap = new Map();
        this._renderer.setRoom(this._loadedRoom);
        this._clearNodeEvents();

        //setup instances
        this._loadedRoom.instances.forEach(instance => {
            if (instance.TYPE != INSTANCE_TYPE.OBJECT) return;

            if (instance.renderable){
                this._renderer.addInstance(instance);
            }

            const objInstance = instance as Object_Instance;
            const triggersExits = objInstance.objRef.triggerExits;
            const exitBehavior = objInstance.objRef.exitBehavior;

            //if the object triggers exits, it persists between rooms and we need to remove duplicates
            if (triggersExits && exitBehavior != Game_Object.EXIT_TYPES.TRANSITION_ONLY){
                room.removeInstance(instance.id);
            }
            
            objInstance.initLocalVariables();
            this._registerInstanceEvents(objInstance);
        });

        this._dispatchLogicEvent('e_create');
    }

    private _updateLoop = (time: number): void =>{
        this._curTime = time;
        this._deltaTime = Math.max((time - this._lastLoopTimestamp) / 1000, 0);

        this._update();

        this._lastLoopTimestamp = time;
        this._nextAnimationFrame = requestAnimationFrame(this._updateLoop);
    }

    private _update = (): void =>{
        window.IS_ENGINE = true;
        try{
            this._processDebugNav();
            this._updateAnimations();
            this._processCollisions();
            this._updateCamera();
        }
        catch(e){
            this.error(e);
            this.stop();
            return;
        }

        this._renderer.render();
        this._dialogBox.render(this.deltaTime);
        this._dialogFullscreen.render(this.deltaTime);
        window.IS_ENGINE = false;
    }

    private _processDebugNav = (): void =>{
        const camera = this._loadedRoom!.camera;
        const controlVelocity = new Vector(0, 0);
        const speed = 2 * camera.size;
        const zoomSpeed = 0.1;
        let zoom = 0;

        controlVelocity.y = (!!this._keymap.get('KeyI') ? speed : 0) - (!!this._keymap.get('KeyK') ? speed : 0);
        controlVelocity.x = (!!this._keymap.get('KeyJ') ? speed : 0) - (!!this._keymap.get('KeyL') ? speed : 0);
        zoom = (!!this._keymap.get('KeyO') ? zoomSpeed : 0) - (!!this._keymap.get('KeyU') ? zoomSpeed : 0);

        camera.velocity.copy(controlVelocity);
        camera.size += zoom;
    }

    private _updateAnimations = (): void => {
        this._loadedRoom.instances.forEach(instance => {
            instance.advanceAnimation(this._deltaTime);

            if (instance.needsRenderUpdate){
                this._renderer.updateInstance(instance, instance.animFrame);
                instance.needsRenderUpdate = false;
            }
        });
    }

    private _updateCamera = (): void =>{
        const camera = this._loadedRoom!.camera;
        const {MOVE_TYPES, SCROLL_DIRS, FOLLOW_TYPES} = Camera;

        camera.pos.add(camera.velocity.clone().multiplyScalar(this._deltaTime));

        switch(camera.moveType){
            case MOVE_TYPES.LOCKED:
                camera.velocity.x = 0;
                camera.velocity.y = 0;
                break;

            case MOVE_TYPES.FOLLOW:
                const target = this._loadedRoom!.instances.find(
                    instance => instance.id == camera.followObjId
                )!;
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

    private _processCollisions = (): void =>{
        this._mapInstanceOverlaps();
        this._dispatchCollisionEvents();
    }

    private _mapInstanceOverlaps = (): void =>{
        const prevExit = this._previousTransition!.exit;
        const prevInst = this._previousTransition!.instance;
        let overlappedExit: Exit | null = null;
        let triggeredInstance: Instance_Base | null = null;
        let doubleTriggerExit;

        this._loadedRoom!.instances.forEach(instance => {
            if (instance.TYPE != INSTANCE_TYPE.OBJECT) return;
            const objInstance = instance as Object_Instance;
            const overlappingInstances = objInstance.hasCollisionEvent ? this.getInstancesOverlapping(instance) : [];
            const overlappingExits = objInstance.triggerExits ? this.getExitsOverlapping(instance) : [];

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

        if (!overlappedExit){
            this._previousTransition!.exit = null;
            this._previousTransition!.instance = null;
            return;
        }

        //type assertion since typescript doesn't know how to check callbacks
        overlappedExit = overlappedExit as Exit;

        if (doubleTriggerExit) return;

        if (overlappedExit.isEnding){
            this._triggerEnding(overlappedExit['endingDialog']);
        }
        else{
            this._triggerExit(overlappedExit, triggeredInstance! as Object_Instance);
        }
    }

    private _dispatchCollisionEvents = (): void =>{
        this._collisionMap.forEach(instanceEntry => {
            const sourceInstance = instanceEntry.sourceInstance;

            if (sourceInstance.TYPE != INSTANCE_TYPE.OBJECT) return;

            const sourceObj = sourceInstance as Object_Instance;

            instanceEntry.collisions.forEach(collision => {

                if (collision.active){
                    let eventType;

                    if (collision.startCollision == this._curTime || collision.force){
                        eventType = Node_Enums.COLLISION_EVENT.START;
                    }
                    else if (collision.lastChecked != this._curTime){
                        eventType = Node_Enums.COLLISION_EVENT.STOP;
                        collision.active = false;
                    }
                    else{
                        eventType = Node_Enums.COLLISION_EVENT.REPEAT;
                    }

                    collision.force = false;

                    sourceObj.logic!.executeEvent('e_collision', sourceObj, {
                        type: eventType,
                        instance: sourceObj
                    });
                }
            });
        });
    }

    private _triggerEnding = (endingText: string): void =>{
        if (!this._dialogFullscreen.active){
            this._dialogFullscreen.open(endingText);
        }
    }

    private _triggerExit = (exit: Exit, instance: Object_Instance)=>{
        if (this._renderer.isTransitioning){
            return;
        }

        if (exit.destinationRoom != null){
            if (exit.transition){
                this._renderer.startTransition(
                    exit.transition,
                    1,
                    ()=>{this._transitionRoom(exit, instance)}
                );
            }
            else{
                this._transitionRoom(exit, instance);
            }
        }
        else{
            if (!this._errorLogs.get('exit_' + exit.id)){
                this.warn('no_destination_specified');
                this._errorLogs.set('exit_' + exit.id, true);
            }
        }
    }

    private _transitionRoom = (exit: Exit, instance: Object_Instance): void =>{
        const {
            TO_DESTINATION,
            THROUGH_DESTINATION,
            KEEP_POSITION,
            TRANSITION_ONLY,
        } = Game_Object.EXIT_TYPES;
        const exitBehavior = instance.objRef.exitBehavior;
        const prevRoom = this.room;
        const prevInstId = instance.id;

        if (exit.destinationRoom != null) this._loadRoom(exit.destinationRoom);

        if (exit.destinationExit != null){
            const destExit = this.room.exits.find(e => e.id == exit.destinationExit)!;

            switch(exitBehavior){
                case TO_DESTINATION:
                    instance.pos.copy(destExit.pos);
                    this.addInstance(instance);
                    break;
                case THROUGH_DESTINATION:
                    const velocity = instance.pos.clone().subtract(instance.lastPos);
                    const destPos = destExit.pos.clone();
                    const normDir = velocity.clone();
                    normDir.x = +(Math.abs(normDir.x) > 0) * Math.sign(normDir.x) * 16;
                    normDir.y = +(Math.abs(normDir.y) > 0) * Math.sign(normDir.y) * 16;
                    destPos.add(normDir);
                    instance.pos.copy(destPos);
                    this.addInstance(instance);
                    break
                case KEEP_POSITION:
                    this.addInstance(instance);
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
                case KEEP_POSITION:
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

        if (instance.objRef.keepCameraSettings){
            Object.assign(this.room.camera, prevRoom.camera.clone());

            if (prevRoom.camera.followObjId == prevInstId){
                this.room.camera.followObjId = instance.id;
            }
        }
    }

    private _parseGameData = (gameData: string): iGameData => {
        type serialSprite = iSerializedGameData["sprites"][number];
        type serialObject = iSerializedGameData["objects"][number];
        type serialRoom = iSerializedGameData["rooms"][number];
        type serialLogic = iSerializedGameData["logic"][number];

        const loadedData = {} as iGameData;
        const spriteMap = new Map<number, Sprite>();
        const objectMap = new Map<number, Game_Object>();
        let parsedJson;

        try {
            parsedJson = JSON.parse(gameData);
        }
        catch (e) {
            console.error("ERROR: Engine could not parse provided JSON", e);
            return {} as iGameData;
        }

        loadedData.startRoom = parsedJson.startRoom;

        loadedData.sprites = parsedJson.sprites.map((s: serialSprite) => Sprite.fromSaveData(s));
        loadedData.sprites.forEach(sprite => spriteMap.set(sprite.id, sprite));

        loadedData.objects = parsedJson.objects.map((o: serialObject) => Game_Object.fromSaveData(o, spriteMap));
        loadedData.objects.forEach(object => objectMap.set(object.id, object));

        loadedData.rooms = parsedJson.rooms.map((r: serialRoom) => Room.fromSaveData(r, objectMap));
        loadedData.logic = parsedJson.logic.map((l: serialLogic) => new Logic(l, this));

        loadedData.logic.forEach(logic => logic.dispatchLifecycleEvent('afterGameDataLoaded'));

        return loadedData;
    }

    private _linkLogic = (): void =>{
        const objects = this._gameData.objects;
        const logicScripts = this._gameData.logic;
        const logicMap = new Map<number, Logic>();

        logicScripts.forEach(l => logicMap.set(l.id, l));

        for (let i = 0; i < objects.length; i++){
            const curObj = objects[i];
            curObj.logicScript = logicMap.get(curObj.logicScriptId ?? -1) ?? null;
        }
    }

    private _bindInputEvents = ()=>{
        document.addEventListener("keydown", this._keyDown);
        document.addEventListener("keyup", this._keyUp);
    }

    private _keyDown = (e: KeyboardEvent): void =>{
        if (this._renderer.isTransitioning){
            return;
        }

        if (!this._keymap.get(e.code) && !this._dialogBox.active && !this._dialogFullscreen.active){
            this._keymap.set(e.code, true);
            this._dispatchLogicEvent('e_keyboard', {
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

    private _keyUp = (e: KeyboardEvent): void =>{
        this._keymap.set(e.code, false);
        this._dispatchLogicEvent('e_keyboard', {
            which_key: e.key.toUpperCase(),
            code: e.code,
            type: 'up',
        });
    }

    private _unbindInputEvents = ()=>{
        document.removeEventListener("keydown", this._keyDown);
        document.removeEventListener("keyup", this._keyUp);
    }

    private _registerInstanceEvents = (instance: Object_Instance): void =>{
        const logicEvents = instance.logic?.events;

        logicEvents?.forEach((event, key) => {
            this._registerNodeEvent(key, instance);
        });

        instance.initAnimProps();
    }

    private _registerNodeEvent = (eventName: string, instance: Object_Instance)=>{
        let eventMapGet = this._nodeEventMap.get(eventName);

        if (!eventMapGet){
            eventMapGet = new Map();
            this._nodeEventMap.set(eventName, eventMapGet);
        }

        eventMapGet.set(instance.id, instance);
    }

    private _registerAsyncNodeEvent = (node: Node, methodName: string): string =>{
        const tag = this._newAsyncTag();
        this._nodeAsyncEventMap.set(tag, {
            instance: node.instance,
            node,
            methodName
        });

        return tag;
    }

    private _dispatchLogicEvent = (eventName: string, data?: iAnyObj): void => {
        const nodeEvent = this._nodeEventMap.get(eventName);

        if (!nodeEvent) return;

        nodeEvent.forEach(nodeEvent => {
            nodeEvent.executeNodeEvent(eventName, data);
        })
    }

    private _dispatchAsyncLogicEvent = (tag: string, clearEvent: boolean = false): void =>{
        const {instance, node, methodName} = this._nodeAsyncEventMap.get(tag);
        node.parentScript.executeAsyncNodeMethod(instance, node, methodName);

        if (clearEvent){
            this._nodeAsyncEventMap.set(tag, null);
        }
    }

    private _clearNodeEvents = (): void =>{
        this._nodeEventMap = new Map();
    }

    private _filterOverlapping = <T extends Instance_Base>(entityList: Spacial_Collection<T>, {id, pos, TYPE}: {id: number, pos: Vector, TYPE: INSTANCE_TYPE}): Instance_Base[] =>{
        const broadCheck = entityList.getByRadius(pos, 32);
        return broadCheck.filter(checkEntity => (
                checkEntity.pos.x + 16 > pos.x &&
                checkEntity.pos.x < pos.x + 16 &&
                checkEntity.pos.y + 16 > pos.y &&
                checkEntity.pos.y < pos.y + 16 &&
                (checkEntity.id != id || checkEntity.TYPE != TYPE)
        ));
    }

    private _newAsyncTag = (): string =>{
        const LENGTH = 10;
        let tag = '';

        for (let i = 0; i < LENGTH; i++){
            const num = Math.floor(Math.random() * 16).toString(16);
            tag += num;
        }

        return tag;
    }

    private _onDialogBoxClose = (tag: string | null): void =>{
        if (!tag) return;
        this._dispatchAsyncLogicEvent(tag, true);
    }

    private _onFullScreenClose = (tag: string | null, restart?: boolean): void =>{
        if (restart){
            this.stop();
            this.restart();
        }
        else if (tag){
            this._dispatchAsyncLogicEvent(tag, true);
        }
    }

    public start = (): void =>{
        window.IS_ENGINE = true;
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
        window.IS_ENGINE = false;
    }

    stop = (): void =>{
        cancelAnimationFrame(this._nextAnimationFrame);
        this._unbindInputEvents();
        this._keymap = new Map();
        this._nodeEventMap = new Map();
        this._nodeAsyncEventMap = new Map();
        this._collisionMap = new Map();
        this._globalVariables = new Map();
        window.IS_ENGINE = false;
    }

    registerCollision = (sourceInstance: Instance_Base, collisionInstance: Instance_Base, force = false): void =>{
        let sourceInstanceEntry;

        //create entry for source instance if it does not already exist
        if (!this._collisionMap.get(sourceInstance.id)){
            this._collisionMap.set(sourceInstance.id, {
                sourceInstance,
                collisions: new Map(),
            });
        }

        sourceInstanceEntry = this._collisionMap.get(sourceInstance.id)!;

        //Register collision to map
        if (sourceInstanceEntry.collisions.get(collisionInstance.id)){
            const ref = sourceInstanceEntry.collisions.get(collisionInstance.id)!;
            ref.startCollision = ref.active ? ref.startCollision : this._curTime;
            ref.lastChecked = this._curTime;
            ref.active = true;
            ref.force = force;
        }
        else{
            sourceInstanceEntry.collisions.set(collisionInstance.id, {
                instance: collisionInstance,
                startCollision: this._curTime,
                lastChecked: this._curTime,
                active: true,
                force,
            });
        }
    }

    getInstancesAtPosition = (pos: Vector): Instance_Base[] =>{
        const broadCheck = this.room!.instances.getByRadius(pos, 32);
        return broadCheck.filter(instance => 
            Util.isInBounds(
                pos.x,
                pos.y,
                instance.pos.x,
                instance.pos.y,
                instance.pos.x + 15,
                instance.pos.y + 15
            )
        );
    }

    getInstancesOverlapping = (instance: Instance_Base): Object_Instance[] =>{
        return this._filterOverlapping(this.room!.instances, instance) as Object_Instance[];
    }

    getExitsOverlapping = (instance: Instance_Base): Exit[] =>{
        return this._filterOverlapping(this.room!.exits, instance) as Exit[];
    }

    addInstance = (instance: Instance_Base): void => {
        this.room!.addInstance(instance);

        if (instance.renderable){
            this._renderer.addInstance(instance);
        }
    }

    removeInstance = (instance: Instance_Base): void =>{
        this.room!.removeInstance(instance.id);

        if (instance.renderable){
            this._renderer.removeInstance(instance);
        }
    }

    setInstancePosition = (instance: Instance_Base, pos: Vector): void =>{
        instance.setPosition(pos);
        this.room!.instances.updatePosition(instance.id);

        if (instance.renderable){
            this._renderer.updateInstance(instance);
        }
    }

    setGlobalVariable = (name: string, data: any): void =>{
        const varname = name.trim().toLowerCase();
        this._globalVariables.set(varname, data);
    }

    getGlobalVariable = (name: string): any=>{
        const varname = name.trim().toLowerCase();
        return this._globalVariables.get(varname);
    }

    openDialogBox = (text: string, node: Node, methodName: string): void =>{
        const asyncTag = node ? this._registerAsyncNodeEvent(node, methodName) : null;
        this._dialogBox.open(text, asyncTag);
    }
}

export default Engine;