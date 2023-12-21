import Renderer from './Renderer';
import Logic from './Logic';
import Dialog_Box from './text/Dialog_Box';
import Dialog_Fullscreen from './text/Dialog_Fullscreen';
import {
    Instance_Exit,
    Room,
    Sprite,
    Game_Object,
    Instance_Base,
    iSerializedGameData,
    iAnyObj,
    Vector,
    Instance_Object,
    Util,
    INSTANCE_TYPE,
    Node_Enums,
    WGL,
    CATEGORY_ID,
    Asset_Base,
    iEngineLogic,
    Instance_Logic,
    MOUSE_EVENT,
    iEngineVariable,
} from '@engine/core/core';
import iGameData from './iGameData';
import getTransitions from './transitions/getTransitions';
import Transition_Base, { TRANSITION } from './transitions/Transition_Base';
import { SOCKET_TYPE } from './core/nodes/Node_Enums';

import * as Physics from './Physics';

export * as Core from '@engine/core/core';

enum KEY_STATE {
    DOWN = 'down',
    PRESSED = 'pressed',
    UP = 'up',
    NONE = 'NONE',
}

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
        normal?: Vector,
        startCollision: number,
        lastChecked: number,
        active: boolean,
        force: boolean,
    }>,
}

export class Engine implements iEngineCallbacks {
    static readonly VERSION = '0.1.0';
    static readonly DEFAULT_ACTION_KEY = 'Space';

    private _canvas: HTMLCanvasElement;
    private _gl: WebGL2RenderingContext;
    private _timeStart: number = -1;
    private _curTime: number = 0;
    private _deltaTime: number = 0;
    private _lastLoopTimestamp: number = 0;
    private _loadedRoom: Room = new Room();
    private _renderer: Renderer;
    private _dialogBox: Dialog_Box;
    private _dialogFullscreen: Dialog_Fullscreen;
    private _nextAnimationFrame: number = -1;
    private _keymap: Map<string, KEY_STATE> = new Map();
    private _nodeEventMap: Map<string, Map<number, Instance_Object>> = new Map();
    private _collisionMap: Map<number, iCollisionMapping> = new Map();
    private _globalVariables: Map<string, iEngineVariable> = new Map();
    private _gameData: iGameData;
    private _mouse = {
        screenPos: new Vector,
        pos: new Vector(),
        down: false,
        moved: false,
        buttons: 0,
    };
    private _transitionMap: Map<TRANSITION, Transition_Base>;
    private _transition: Transition_Base;

    enableInput = true;
    enableUpdate = true;

    log: (...args: any)=>void = function(){console.log(...arguments)};
    warn: (...args: any)=>void = function(){console.warn(...arguments)};
    error: (...args: any)=>void = function(){console.error(...arguments)};
    nodeException: (error: string, treeData: any)=>void = function(error: string, treeData: any){console.error(error)};
    restart: ()=>void = function(){location.reload()};

    constructor(canvas: HTMLCanvasElement, gameData: string, callbacks?: iEngineCallbacks){
        window.IS_ENGINE = true;

        this._canvas = canvas;
        this._gl = WGL.getGLContext(this._canvas, {alpha: false})!;
        this._renderer = new Renderer(this._gl);
        this._dialogBox = new Dialog_Box(this._gl);
        this._dialogFullscreen = new Dialog_Fullscreen(this._gl);
        this._gameData = this._parseGameData(gameData);
        this._transitionMap = getTransitions(this._gl, this._renderer);
        this._transition = this._transitionMap.get(TRANSITION.NONE)!;

        //integrate callbacks
        if (callbacks){
            if (callbacks.log) this.log = callbacks.log;
            if (callbacks.warn) this.warn = callbacks.warn;
            if (callbacks.error) this.error = callbacks.error;
            if (callbacks.nodeException) this.nodeException = callbacks.nodeException;
            if (callbacks.restart) this.restart = callbacks.restart;
        }

        this._linkLogic();
        window.IS_ENGINE = false;

        //setup static properties
        Instance_Exit.engine = this;
    }

    get gameData(){return this._gameData}
    get room(){return this._loadedRoom}
    get currentTime(){return this._curTime}
    get deltaTime(){return this._deltaTime}
    get mouse(){return this._mouse}
    get keyMap(){return this._keymap}
    get isRunning(){return this._timeStart >= 0}

    loadRoom = (roomId: number): void =>{
        const room = this._gameData.rooms.find((r: Room) => r.id == roomId)!;
        this._dispatchLogicEvent('e_before_destroy');

        this._loadedRoom && this._loadedRoom.clearSpacialData();
        
        this._loadedRoom = room.persist ? room : room.clone();
        this._loadedRoom.initSpacialData();
        this._collisionMap = new Map();
        this._renderer.setRoom(this._loadedRoom);
        this._clearNodeEvents();

        //setup instances
        this._loadedRoom.instances.forEach(instance => {
            if (instance.renderable){
                this._renderer.addInstance(instance);
            }
            
            if (instance.TYPE == INSTANCE_TYPE.OBJECT || instance.TYPE == INSTANCE_TYPE.LOGIC){
                const objInstance = instance as Instance_Object | Instance_Logic;
                objInstance.initLocalVariables();
                this._registerInstanceEvents(objInstance);
            }
        });

        this._loadedRoom.instances.forEach(instance => {
            instance.setEngine(this);
            instance.onCreate();
        });
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

        if (this.enableUpdate){
            try{
                this._dispatchInputEvents();
                this._updateInstances();
                this._updateAnimations();
                this._updateCamera();
                this._mapInstanceOverlaps();
                this._dispatchCollisionEvents();
            }
            catch(e){
                this.error(e);
                this.stop();
                return;
            }
        }

        this._renderer.render();
        this._transition.render(this.deltaTime);
        this._dialogBox.render(this.deltaTime);
        this._dialogFullscreen.render(this.deltaTime);

        window.IS_ENGINE = false;
    }

    private _dispatchInputEvents = (): void => {
        //Dispatch keyboard events
        for (let [code, state] of this._keymap){
            if (state != KEY_STATE.NONE){
                let nextState: KEY_STATE = state;

                this._dispatchLogicEvent('e_keyboard', {
                    which_key: code.toUpperCase(),
                    code: code,
                    type: state,
                });

                switch(state){
                    case KEY_STATE.DOWN:
                        nextState = KEY_STATE.PRESSED;
                        break;
                    case KEY_STATE.UP:
                        nextState = KEY_STATE.NONE;
                        break;
                }

                this._keymap.set(code, nextState);
            }
        }

        //Dispatch mouse events
        {
            const instances = this.getInstancesAtPosition(this.mouse.pos);
            const eventType = this.mouse.down ? MOUSE_EVENT.DOWN : MOUSE_EVENT.UP;

            this._dispatchLogicEvent('e_mouse_button', {
                type: eventType,
                buttons: this.mouse.buttons,
                pos: this.mouse.pos,
                instances,
            });
        }

        if (this.mouse.moved){
            this._dispatchLogicEvent('e_mouse_move');
            this.mouse.moved = false;
        }
    }

    private _updateInstances = (): void => {
        this._loadedRoom.instances.forEach(instance => {
            instance.onUpdate(this._deltaTime);
        });
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
        this._loadedRoom.camera.update(this.deltaTime, this._loadedRoom!, this._renderer.updateViewMatrix);
    }

    private _mapInstanceOverlaps = (): void =>{
        this._loadedRoom!.instances.forEach(instance => {
            if (!instance.hasCollisionEvent) return;
            
            const overlappingInstances = this.getInstancesOverlapping(instance);

            //iterate over overlapped instances and make collision entries
            for (let i = 0; i < overlappingInstances.length; i++){
                const collisionInstance = overlappingInstances[i];
                this.registerCollision(instance, collisionInstance);
            }
        });
    }

    private _dispatchCollisionEvents = (): void =>{
        this._collisionMap.forEach(instanceEntry => {
            const sourceInstance = instanceEntry.sourceInstance;

            instanceEntry.collisions.forEach(collision => {
                if (collision.active){
                    let eventType: Node_Enums.COLLISION_EVENT;

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

                    sourceInstance.onCollision({
                        type: eventType,
                        instance: collision.instance,
                        normal: collision.normal,
                    });
                }
            });
        });
    }

    private _parseGameData = (gameData: string): iGameData => {
        type serialSprite = iSerializedGameData["sprites"][number];
        type serialObject = iSerializedGameData["objects"][number];
        type serialRoom = iSerializedGameData["rooms"][number];
        type serialLogic = iSerializedGameData["logic"][number];

        const loadedData = {} as iGameData;
        const spriteMap = new Map<number, Sprite>();
        const objectMap = new Map<number, Game_Object>();
        const logicMap = new Map<number, iEngineLogic>();
        const assetMap = new Map<CATEGORY_ID, Map<number, Asset_Base | iEngineLogic>>([
            [CATEGORY_ID.SPRITE, spriteMap],
            [CATEGORY_ID.OBJECT, objectMap],
            [CATEGORY_ID.LOGIC, logicMap],
        ]);
        let parsedJson;

        try {
            parsedJson = JSON.parse(gameData);
        }
        catch (e) {
            console.error("ERROR: Engine could not parse provided JSON", e);
            return {} as iGameData;
        }

        loadedData.startRoom = parsedJson.startRoom;

        loadedData.logic = parsedJson.logic.map((l: serialLogic) => new Logic(l, this));
        loadedData.logic.forEach(logic => logicMap.set(logic.id, logic));

        loadedData.sprites = parsedJson.sprites.map((s: serialSprite) => Sprite.fromSaveData(s));
        loadedData.sprites.forEach(sprite => spriteMap.set(sprite.id, sprite));

        loadedData.objects = parsedJson.objects.map((o: serialObject) => Game_Object.fromSaveData(o, spriteMap));
        loadedData.objects.forEach(object => objectMap.set(object.id, object));

        loadedData.rooms = parsedJson.rooms.map((r: serialRoom) => Room.fromSaveData(r, assetMap));

        loadedData.logic.forEach(logic => logic.dispatchAfterGameDataLoaded());

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
        this._canvas.addEventListener("mousedown", this._mouseDown);
        this._canvas.addEventListener("mouseup", this._mouseUp);
        this._canvas.addEventListener("mousemove", this._mouseMove);
        this._canvas.addEventListener("mouseleave", this._mouseLeave);
    }

    private _unbindInputEvents = ()=>{
        document.removeEventListener("keydown", this._keyDown);
        document.removeEventListener("keyup", this._keyUp);
        this._canvas.removeEventListener("mousedown", this._mouseDown);
        this._canvas.removeEventListener("mouseup", this._mouseUp);
        this._canvas.removeEventListener("mousemove", this._mouseMove);
        this._canvas.removeEventListener("mouseleave", this._mouseLeave);
    }

    private _keyDown = (e: KeyboardEvent): void =>{
        const keyGet = this._keymap.get(e.code);
        const isActive = keyGet && keyGet != KEY_STATE.NONE;

        if (!isActive && this.enableInput){
            this._keymap.set(e.code, KEY_STATE.DOWN);
        }
        else {
            this._dialogBox.checkInteractKey(e.code);
            this._dialogFullscreen.checkInteractKey(e.code);
        }
    }

    private _keyUp = (e: KeyboardEvent): void =>{
        this._keymap.set(e.code, KEY_STATE.UP);
    }

    private _mouseDown = (e: MouseEvent): void =>{
        this.mouse.down = true;
        this.mouse.buttons = e.buttons;
    }

    private _mouseUp = (e: MouseEvent): void =>{
        this.mouse.down = false;
        this.mouse.buttons = e.buttons;
    }

    private _mouseMove = (e: MouseEvent): void =>{
        this.mouse.screenPos.set(e.offsetX, e.offsetY);
        this.mouse.pos.copy(this._screenToWorldPos(this.mouse.screenPos));
        this.mouse.moved = true;
    }

    private _mouseLeave = (e: MouseEvent): void =>{
        if (this.mouse.down){
            this._mouseUp(e);
        }
    }

    private _screenToWorldPos = (pos: Vector): Vector =>{
        const p = pos.clone();

        //convert to clip space
        p.divide(new Vector(this._canvas.clientWidth, this._canvas.clientHeight));
        p.subtractScalar(0.5);
        p.multiplyScalar(2);
        p.y *= -1;

        //convert to world space
        p.multiplyMat3(this._renderer.viewMatrixInv.clone().transpose());

        return p;
    }

    private _registerInstanceEvents = (instance: Instance_Object): void =>{
        const logicEvents = instance.logic?.events;

        logicEvents?.forEach((_, key) => {
            this._registerNodeEvent(key, instance);
        });
    }

    private _registerNodeEvent = (eventName: string, instance: Instance_Object)=>{
        let eventMapGet = this._nodeEventMap.get(eventName);

        if (!eventMapGet){
            eventMapGet = new Map();
            this._nodeEventMap.set(eventName, eventMapGet);
        }

        eventMapGet.set(instance.id, instance);
    }

    private _dispatchLogicEvent = (eventName: string, data?: iAnyObj): void => {
        const registeredInstances = this._nodeEventMap.get(eventName);

        if (!registeredInstances) return;

        registeredInstances.forEach(instance => {
            instance.executeNodeEvent(eventName, data);
        });
    }

    private _clearNodeEvents = (): void =>{
        this._nodeEventMap = new Map();
    }

    private _filterOverlapping = ({id, pos, TYPE}: {id: number, pos: Vector, TYPE: INSTANCE_TYPE}): Instance_Base[] =>{
        const broadCheck = this.room!.getInstancesInRadius(pos, 32);
        return broadCheck.filter(checkEntity => (
                checkEntity.pos.x + 16 > pos.x &&
                checkEntity.pos.x < pos.x + 16 &&
                checkEntity.pos.y + 16 > pos.y &&
                checkEntity.pos.y < pos.y + 16 &&
                (checkEntity.id != id || checkEntity.TYPE != TYPE)
        ));
    }

    start = (): void =>{
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
                this.loadRoom(startRoomId);
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
        this._collisionMap = new Map();
        this._globalVariables = new Map();
        this._timeStart = -1;
        window.IS_ENGINE = false;
        Instance_Exit.engine = null;
    }

    getRoomData = (roomId: number): Room | undefined => {
        return this._gameData.rooms.find(room => room.id == roomId);
    }

    setTransition = (transitionType: TRANSITION): Transition_Base => {
        this._transition = this._transitionMap.get(transitionType) ?? this._transitionMap.get(TRANSITION.NONE)!;
        return this._transition;
    }

    triggerEnding = (endingText: string): void =>{
        this.enableInput = false;
        this.enableUpdate = false;
        this._dialogFullscreen.open(endingText, Engine.DEFAULT_ACTION_KEY, ()=>this.restart());
    }

    registerCollision = (sourceInstance: Instance_Base, collisionInstance: Instance_Base, normal?: Vector, force = false): void =>{
        let sourceInstanceEntry = this._collisionMap.get(sourceInstance.id);
        let subInstanceEntry;

        //create entry for source instance if it does not already exist
        if (!sourceInstanceEntry){
            sourceInstanceEntry = {
                sourceInstance,
                collisions: new Map(),
            }
            this._collisionMap.set(sourceInstance.id, sourceInstanceEntry);
        }

        subInstanceEntry = sourceInstanceEntry.collisions.get(collisionInstance.id);

        //Register collision to map
        if (subInstanceEntry){
            subInstanceEntry.normal = normal;
            subInstanceEntry.startCollision = subInstanceEntry.active ? subInstanceEntry.startCollision : this._curTime;
            subInstanceEntry.lastChecked = this._curTime;
            subInstanceEntry.active = true;
            subInstanceEntry.force = force;
        }
        else{
            sourceInstanceEntry.collisions.set(collisionInstance.id, {
                instance: collisionInstance,
                normal: normal,
                startCollision: this._curTime,
                lastChecked: this._curTime,
                active: true,
                force,
            });
        }
    }

    getInstancesAtPosition = (pos: Vector): Instance_Base[] =>{
        const broadCheck = this.room!.getInstancesInRadius(pos, 32);
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

    getInstancesOverlapping = (instance: Instance_Base): Instance_Object[] =>{
        return this._filterOverlapping(instance) as Instance_Object[];
    }

    addInstance = (instance: Instance_Base): void => {
        this.room!.addInstance(instance);

        if (instance.renderable){
            this._renderer.addInstance(instance);
        }

        if (instance.TYPE == INSTANCE_TYPE.OBJECT){
            this._registerInstanceEvents(instance as Instance_Object);
        }
    }

    removeInstance = (instance: Instance_Base): void =>{
        this.room!.removeInstance(instance.id);

        if (instance.renderable){
            this._renderer.removeInstance(instance);
        }
    }

    setInstancePosition = (instance: Instance_Base, pos: Vector): void =>{
        this.room!.setInstancePosition(instance, pos);

        if (instance.renderable){
            this._renderer.updateInstance(instance);
        }
    }

    moveAndSlide = (instance: Instance_Base, velocity: Vector): void => {
        const vel = velocity.clone().scale(this._deltaTime);
        const nearByInstances = this.room.getInstancesInRadius(instance.pos, vel.length())
            .filter(i => i.isSolid && i.id != instance.id);
        const result = Physics.moveAndSlide(instance.pos, nearByInstances, vel);

        this.setInstancePosition(instance, result.point);
        result.collisions.forEach(collisionBody => {
            this.registerCollision(instance, collisionBody, result.normal);
            this.registerCollision(collisionBody, instance, result.normal);
        });
    }

    refreshRenderedInstance = (instance: Instance_Base): void =>{
        if (!instance.renderable) return;

        this._renderer.removeInstance(instance);
        this._renderer.addInstance(instance);
    }

    createGlobalVariable = (name: string, value: any, type: SOCKET_TYPE, isList: boolean): void =>{
        const varname = name.trim().toLowerCase();
        this._globalVariables.set(varname, {value, type, isList});
    }

    setGlobalVariable = (name: string, value: any): void =>{
        const varname = name.trim().toLowerCase();
        const varGet = this._globalVariables.get(varname);

        if (varGet){
            varGet.value = value;
        }
    }

    getGlobalVariable = (name: string): iEngineVariable | undefined =>{
        const varname = name.trim().toLowerCase();
        return this._globalVariables.get(varname);
    }

    openDialogBox = (text: string, pause: boolean, fullscreen: boolean, closeCallback: ()=>void, interactionKey = Engine.DEFAULT_ACTION_KEY): void =>{
        const wrappedCallback = ()=>{
            this.enableInput = true;
            this.enableUpdate = true;

            closeCallback();
        }
        
        this.enableInput = false;
        this.enableUpdate = !pause;

        if (fullscreen){
            this._dialogFullscreen.open(text, interactionKey, wrappedCallback);
        }
        else{
            this._dialogBox.open(text, interactionKey, wrappedCallback);
        }
    }

    broadcastMessage = (name: string): void => {
        this._dispatchLogicEvent('e_message', {name});
    }
}

export default Engine;