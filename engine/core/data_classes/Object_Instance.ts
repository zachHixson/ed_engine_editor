import {INSTANCE_TYPE} from '../Enums';
import { Vector } from '../Vector';
import { Sprite } from './Sprite';
import { Exit } from './Exit';
import { Game_Object } from './Game_Object';
import { iInstanceBaseSaveData, Instance_Base } from './Instance_Base';

export interface iObjectInstanceSaveData extends iInstanceBaseSaveData {
    objId: number;
    zDepthOverride: number | null;
    collisionOverride: COLLISION_OVERRIDE;
}

enum COLLISION_OVERRIDE {
    KEEP = 'K',
    FORCE = 'F',
    IGNORE = 'I',
};

export class Object_Instance extends Instance_Base{
    static DEFAULT_INSTANCE_ICON_ID = 'INSTANCE_ICON';
    static DEFAULT_INSTANCE_ICON = [new ImageData(Sprite.DIMENSIONS, Sprite.DIMENSIONS)];

    private _animProgress: number = 0;
    private _hasCollisionEvent: boolean | null = null;
    private _prevExit: {
        exit: Exit,
        direction: Vector,
    } | null = null;
    private _zDepthOverride: number | null = null;
    private _useIcon = false;

    objRef: Game_Object;
    collisionOverride: COLLISION_OVERRIDE = COLLISION_OVERRIDE.KEEP;
    startFrameOverride: number | null = null;
    fps: number = 0;
    animLoop: boolean = false;
    animPlaying: boolean = false;
    lastPos: Vector = new Vector();
    localVariables: Map<string, any> = new Map();
    exposedProps: Map<string, any> = new Map();

    constructor(id: number, pos: Vector, objRef: Game_Object){
        super(id, pos);

        this.objRef = objRef;
        this.name = this.objRef.name + '_' + this.id;
        this.collisionOverride = COLLISION_OVERRIDE.KEEP;

        //engine props
        if (window.IS_ENGINE){
            this.lastPos = this.pos.clone();
            this.localVariables = new Map(this.logic?.localVariableDefaults);

            if (this.objRef){
                this.animFrame = this.objRef.startFrame;
            }
        }
    }

    get TYPE(){return INSTANCE_TYPE.OBJECT};
    get COLLISION_OVERRIDES(){return COLLISION_OVERRIDE};

    get userDepth(){return (this.zDepthOverride) ? this.zDepthOverride : this.objRef.zDepth};
    get zDepth(){return (this.userDepth / 100) + this.depthOffset};
    get renderable(){return !!this.objRef?.sprite};
    get hasEditorFrame(){
        this._useIcon = this.objRef?.sprite?.frameIsEmpty(this.startFrame) ?? true;
        return !this._useIcon;
    };
    get startFrame(){return this.startFrameOverride ?? this.objRef.startFrame};
    get frameDataId(){return this._useIcon || !this.renderable ? Object_Instance.DEFAULT_INSTANCE_ICON_ID : this.objRef!.sprite!.id};
    get frameData(){return this._useIcon || !this.renderable ? Object_Instance.DEFAULT_INSTANCE_ICON : this.objRef!.sprite!.frames};
    get sprite(){return this.objRef?.sprite};
    get logic(){return this.objRef.logicScript};
    get isSolid(){
        switch(this.collisionOverride){
            case COLLISION_OVERRIDE.KEEP: return this.objRef.isSolid;
            case COLLISION_OVERRIDE.FORCE: return true;
            case COLLISION_OVERRIDE.IGNORE: return false;
        }
    }

    get hasCollisionEvent(){
        if (this._hasCollisionEvent != null) return this._hasCollisionEvent;

        this._hasCollisionEvent = false;

        this.logic?.events.forEach((event, key) => {
            this._hasCollisionEvent ||= key == 'e_collision';
        });

        return !!this._hasCollisionEvent;
    }

    get triggerExits(){
        return this.objRef.triggerExits;
    }

    get animFrame(){
        const frame = Math.floor(this._animProgress * this.fps);

        if (!this.sprite){
            return 0;
        }

        if (this.animLoop){
            return frame % this.sprite.frames.length;
        }
        else{
            return Math.min(frame, this.sprite.frames.length - 1);
        }
    }
    set animFrame(val: number){
        if (!this.sprite){
            return;
        }
        
        const frame = Math.min(Math.max(val, 0), this.sprite.frames.length - 1);
        const animDur = Math.floor(this.sprite.frames.length * this.fps) * 1000;
        this._animProgress = Math.floor(frame / this.sprite.frames.length * animDur);
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

    onCreate(): void {
        this.executeNodeEvent('e_create');
    }

    clone(): Object_Instance {
        const clone = new Object_Instance(this.id, this.pos, this.objRef);
        Object.assign(clone, this);
        clone.pos = this.pos.clone();
        if (this.lastPos) clone.lastPos = this.lastPos.clone();
        clone.localVariables = new Map(this.localVariables);
        return clone;
    }

    toSaveData(): iObjectInstanceSaveData {
        const baseData = this.getBaseSaveData();

        return {
            ...baseData,
            objId: this.objRef.id,
            zDepthOverride: this.zDepthOverride,
            collisionOverride: this.collisionOverride,
        };
    }

    static fromSaveData(data: iObjectInstanceSaveData, objMap: Map<number, Game_Object>): Object_Instance {
        const newObj = new Object_Instance(data.id, Vector.fromObject(data.pos), objMap.get(data.objId)!);
        newObj._loadSaveData(data);

        return newObj;
    }

    private _loadSaveData(data: iObjectInstanceSaveData): void {
        this.loadBaseSaveData(data);
        this.zDepthOverride = data.zDepthOverride;
        this.collisionOverride = data.collisionOverride;
    }

    executeNodeEvent(eventName: string, data?: any): void {
        this.logic?.executeEvent(eventName, this, data);
    }

    initAnimProps(): void {
        this.fps = this.objRef.fps;
        this.animLoop = this.objRef.animLoop;
        this.animPlaying = this.objRef.animPlaying;
        this.animFrame = this.objRef.startFrame;
    }

    advanceAnimation(deltaTime: number): void {
        if (this.animPlaying){
            this._animProgress += deltaTime;
            this.needsRenderUpdate = true;
        }
    }
    
    setPosition(newPos: Vector): void {
        this.lastPos.copy(this.pos);
        this.pos.copy(newPos);
    }

    setPrevExit(exit: Exit, direction: Vector): void {
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