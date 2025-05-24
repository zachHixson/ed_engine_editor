import { INSTANCE_TYPE } from '../Enums';
import { Vector } from '../Vector';
import { Sprite } from './Sprite';
import { Instance_Exit } from './Instance_Exit';
import { Game_Object } from './Game_Object';
import { InstanceAnimEvent, iCollisionEvent, Instance_Base, InstanceBaseSave } from './Instance_Base';
import { iEngineVariable } from '../LogicInterfaces';

enum COLLISION_OVERRIDE {
    KEEP = 'K',
    FORCE = 'F',
    IGNORE = 'I',
};

export type InstanceObjectSave = InstanceBaseSave & {
    srcObjID: number,
    zDepOvr: number | '',
    colOvr: string,
};

export class Instance_Object extends Instance_Base {
    static DEFAULT_INSTANCE_ICON_ID = 'INSTANCE_ICON';
    static DEFAULT_INSTANCE_ICON = [new ImageData(Sprite.DIMENSIONS, Sprite.DIMENSIONS)];
    static COLLISION_OVERRIDES = COLLISION_OVERRIDE;

    protected  _objRef: Game_Object;
    
    private _hasCollisionEvent: boolean | null = null;
    private _prevExit: {
        exit: Instance_Exit,
        direction: Readonly<Vector>,
    } | null = null;
    private _useIcon = false;

    gravityOverride: boolean | null = null;
    collisionOverride: COLLISION_OVERRIDE = COLLISION_OVERRIDE.KEEP;
    localVariables: Map<string, iEngineVariable> = new Map();
    exposedProps: Map<string, any> = new Map();

    constructor(id: number, pos: Readonly<Vector>, objRef: Game_Object){
        super(id, pos);

        this._objRef = objRef;
        this.sprite = this._objRef.sprite;
        this.name = this._objRef.name + '_' + this.id;
        this.collisionOverride = COLLISION_OVERRIDE.KEEP;

        //engine props
        if (window.IS_ENGINE){
            this.lastPos = this.pos.clone();
            this.localVariables = new Map<string, iEngineVariable>();
            this.initLocalVariables();

            if (this._objRef){
                this.animFrame = this._objRef.startFrame;
            }
        }
    }

    get TYPE(){return INSTANCE_TYPE.OBJECT};
    get sourceId(){return this._objRef.id};
    get COLLISION_OVERRIDES(){return COLLISION_OVERRIDE};

    get objRef(){return this._objRef};
    set objRef(obj: Game_Object){this._objRef = obj};
    get userDepth(){return this.zDepthOverride ?? this._objRef.zDepth};
    get hasEditorFrame(){
        this.sprite = this._objRef.sprite;
        this._useIcon = this.sprite?.frameIsEmpty(this.startFrame) ?? true;
        return !this._useIcon;
    };
    get frameDataId(){return this._useIcon || !this.renderable ? Instance_Object.DEFAULT_INSTANCE_ICON_ID : this.sprite!.id};
    get frameData(){return this._useIcon || !this.renderable ? Instance_Object.DEFAULT_INSTANCE_ICON : this.sprite!.frames};
    get logic(){return this._objRef.logicScript};
    get isSolid(){
        switch(this.collisionOverride){
            case COLLISION_OVERRIDE.KEEP: return this._objRef.isSolid;
            case COLLISION_OVERRIDE.FORCE: return true;
            case COLLISION_OVERRIDE.IGNORE: return false;
        }
    }
    get applyGravity(){return this.gravityOverride == null ? this.objRef.applyGravity : this.gravityOverride}
    set applyGravity(newVal: boolean){this.gravityOverride = newVal}

    get startFrame(){return this.startFrameOverride ?? this._objRef.startFrame};
    get fps(){return this.fpsOverride ?? this._objRef.fps};
    get animLoop(){return this.animLoopOverride ?? this._objRef.animLoop};
    get animPlaying(){
        return this.animPlayingOverride ?? this._objRef.animPlaying
    };
    set animPlaying(playing: boolean){
        super.animPlaying = playing;
    }

    get startFrameOverrideClamped(){return this.startFrameOverride};
    set startFrameOverrideClamped(val: number | null){
        this.startFrameOverride = val === null ? null : Math.max(Math.min(val, (this.sprite?.frames.length ?? 0) - 1), 0);
    };

    get hasCollisionEvent(){
        if (this._hasCollisionEvent != null) return this._hasCollisionEvent;

        this._hasCollisionEvent = false;

        this.logic?.events.forEach((_, key) => {
            this._hasCollisionEvent ||= key == 'e_collision';
        });

        return !!this._hasCollisionEvent;
    }

    get triggerExits(){
        return this._objRef.triggerExits;
    }

    get prevExit(){return this._prevExit}

    override onCreate(): void {
        super.onCreate();
        this.logic?.dispatchOnCreate(this);
        this.executeNodeEvent('e_create');

        if (this.animPlaying){
            this.onAnimationChange(InstanceAnimEvent.START);
        }
    }

    override onUpdate(deltaTime: number): void {
        super.onUpdate(deltaTime, false);
        this.executeNodeEvent('e_update', deltaTime);
        this._onGround = false;
    }

    override onAnimationChange(state: InstanceAnimEvent): void {
        this.executeNodeEvent('e_animation', state);
    }

    override onCollision(event: iCollisionEvent): void {
        super.onCollision(event);
        this.executeNodeEvent('e_collision', event);
    }

    override clone(): Instance_Object {
        const clone = new Instance_Object(this.id, this.pos, this._objRef);
        Object.assign(clone, this);
        clone.pos = this.pos.clone();
        if (this.lastPos) clone.lastPos = this.lastPos.clone();
        clone.localVariables = new Map(this.localVariables);
        return clone;
    }

    override toSaveData(): InstanceObjectSave {
        return {
            ...this.getBaseSaveData(),
            srcObjID: this._objRef.id,
            zDepOvr: this._zDepthOverride ?? '',
            colOvr: this.collisionOverride,
        };
    }

    override needsPurge(objectMap: Map<number, any>): boolean {
        return !objectMap.get(this._objRef.id);
    }

    static fromSaveData(data: InstanceObjectSave, objMap: Map<number, Game_Object>): Instance_Object {
        const newObj = new Instance_Object(
            data.id,
            Vector.fromArray(data.pos),
            objMap.get(data.srcObjID)!
        );
        newObj._loadSaveData(data);

        return newObj;
    }

    private _loadSaveData(data: InstanceObjectSave): void {
        this.loadBaseSaveData(data);

        this.zDepthOverride = data.zDepOvr == '' ? null : data.zDepOvr;
        this.collisionOverride = data.colOvr as COLLISION_OVERRIDE;
    }

    executeNodeEvent(eventName: string, data?: any): void {
        this.logic?.executeEvent(eventName, this, data);
    }

    setPrevExit(exit: Instance_Exit, direction: Readonly<Vector>): void {
        this._prevExit = {
            exit,
            direction,
        };
    }

    clearPrevExit(): void {
        this._prevExit = null;
    }

    initLocalVariables(): void {
        this.logic?.localVariableDefaults.forEach((varDef, name) => {
            this.localVariables.set(name, Object.assign({}, varDef));
        });
    }

    setLocalVariable(name: string, value: any): void {
        const varName = name.trim().toLowerCase();
        const varData = this.localVariables.get(varName)!;
        varData.value = value;
    }

    getLocalVariable(name: string): iEngineVariable | null {
        const varName = name.trim().toLowerCase();
        return this.localVariables.get(varName) ?? null;
    }

    override isInGroup(group: string): boolean {
        return !!this.groups.find(g => g == group) || !!this.objRef?.groups.find(g => g == group);
    }
};