import {INSTANCE_TYPE} from '../Enums';
import { Vector } from '../Vector';
import { Sprite } from './Sprite';
import { Instance_Exit } from './Instance_Exit';
import { Game_Object } from './Game_Object';
import { iCollisionEvent, iInstanceBaseSaveData, Instance_Base } from './Instance_Base';

export interface iObjectInstanceSaveData extends iInstanceBaseSaveData {
    objId: number;
    zOvr: number | '';
    collOvr: COLLISION_OVERRIDE;
}

enum COLLISION_OVERRIDE {
    KEEP = 'K',
    FORCE = 'F',
    IGNORE = 'I',
};

export class Instance_Object extends Instance_Base{
    static DEFAULT_INSTANCE_ICON_ID = 'INSTANCE_ICON';
    static DEFAULT_INSTANCE_ICON = [new ImageData(Sprite.DIMENSIONS, Sprite.DIMENSIONS)];
    static COLLISION_OVERRIDES = COLLISION_OVERRIDE;

    protected  _objRef: Game_Object;
    
    private _hasCollisionEvent: boolean | null = null;
    private _prevExit: {
        exit: Instance_Exit,
        direction: Vector,
    } | null = null;
    private _zDepthOverride: number | null = null;
    private _useIcon = false;

    collisionOverride: COLLISION_OVERRIDE = COLLISION_OVERRIDE.KEEP;
    localVariables: Map<string, any> = new Map();
    exposedProps: Map<string, any> = new Map();

    constructor(id: number, pos: Vector, objRef: Game_Object){
        super(id, pos);

        this._objRef = objRef;
        this.name = this._objRef.name + '_' + this.id;
        this.collisionOverride = COLLISION_OVERRIDE.KEEP;

        //engine props
        if (window.IS_ENGINE){
            this.lastPos = this.pos.clone();
            this.localVariables = new Map(this.logic?.localVariableDefaults);

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
    get userDepth(){return (this.zDepthOverride) ? this.zDepthOverride : this._objRef.zDepth};
    get zDepth(){return (this.userDepth / 100) + this.depthOffset};
    get renderable(){return !!this._objRef?.sprite};
    get hasEditorFrame(){
        this._useIcon = this._objRef?.sprite?.frameIsEmpty(this.startFrame) ?? true;
        return !this._useIcon;
    };
    get frameDataId(){return this._useIcon || !this.renderable ? Instance_Object.DEFAULT_INSTANCE_ICON_ID : this._objRef!.sprite!.id};
    get frameData(){return this._useIcon || !this.renderable ? Instance_Object.DEFAULT_INSTANCE_ICON : this._objRef!.sprite!.frames};
    get sprite(){return this._objRef?.sprite};
    get logic(){return this._objRef.logicScript};
    get isSolid(){
        switch(this.collisionOverride){
            case COLLISION_OVERRIDE.KEEP: return this._objRef.isSolid;
            case COLLISION_OVERRIDE.FORCE: return true;
            case COLLISION_OVERRIDE.IGNORE: return false;
        }
    }

    get startFrame(){return this.startFrameOverride ?? this._objRef.startFrame};
    get fps(){return this.fpsOverride ?? this._objRef.fps};
    get animLoop(){return this.animLoopOverride ?? this._objRef.animLoop};
    get animPlaying(){
        return this.animPlayingOverride ?? this._objRef.animPlaying
    };

    get startFrameOverrideClamped(){return this.startFrameOverride};
    set startFrameOverrideClamped(val: number | null){
        this.startFrameOverride = val === null ? null : Math.max(Math.min(val, (this._objRef.sprite?.frames.length ?? 0) - 1), 0);
    };

    get hasCollisionEvent(){
        if (this._hasCollisionEvent != null) return this._hasCollisionEvent;

        this._hasCollisionEvent = false;

        this.logic?.events.forEach((event, key) => {
            this._hasCollisionEvent ||= key == 'e_collision';
        });

        return !!this._hasCollisionEvent;
    }

    get triggerExits(){
        return this._objRef.triggerExits;
    }

    get prevExit(){return this._prevExit}

    get zDepthOverride(){return this._zDepthOverride}
    set zDepthOverride(newDepth: number | null){
        if (newDepth == null){
            this._zDepthOverride = null;
        }
        else{
            this._zDepthOverride = Math.max(Math.min(newDepth, 99), -99);
        }
    }

    override onCreate(): void {
        this.executeNodeEvent('e_create');
    }

    override onUpdate(deltaTime: number): void {
        super.onUpdate(deltaTime);
        this.logic?.dispatchOnTick(this);
        this.executeNodeEvent('e_update', deltaTime);
    }

    override onCollision(event: iCollisionEvent): void {
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

    override toSaveData(): iObjectInstanceSaveData {
        const baseData = this.getBaseSaveData();

        return {
            ...baseData,
            objId: this._objRef.id,
            zOvr: this.zDepthOverride ?? '',
            collOvr: this.collisionOverride,
        };
    }

    override needsPurge(objectMap: Map<number, any>): boolean {
        return !objectMap.get(this._objRef.id);
    }

    static fromSaveData(data: iObjectInstanceSaveData, objMap: Map<number, Game_Object>): Instance_Object {
        const newObj = new Instance_Object(data.id, Vector.fromObject(data.pos), objMap.get(data.objId)!);
        newObj._loadSaveData(data);

        return newObj;
    }

    private _loadSaveData(data: iObjectInstanceSaveData): void {
        this.loadBaseSaveData(data);
        this.zDepthOverride = data.zOvr == '' ? null : data.zOvr;
        this.collisionOverride = data.collOvr;
    }

    executeNodeEvent(eventName: string, data?: any): void {
        this.logic?.executeEvent(eventName, this, data);
    }

    setPrevExit(exit: Instance_Exit, direction: Vector): void {
        this._prevExit = {
            exit,
            direction,
        };
    }

    clearPrevExit(): void {
        this._prevExit = null;
    }

    initLocalVariables(): void {
        this.localVariables = new Map(this.logic?.localVariableDefaults);
    }

    setLocalVariable(name: string, data: any): void {
        const varName = name.trim().toLowerCase();
        this.localVariables.set(varName, data);
    }

    getLocalVariable(name: string): any {
        const varName = name.trim().toLowerCase();
        return this.localVariables.get(varName);
    }
};