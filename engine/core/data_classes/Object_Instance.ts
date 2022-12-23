import {ENTITY_TYPE} from '../Enums';
import { iAnyObj } from '../interfaces';
import { Vector } from '../Vector';
import { Game_Object } from './Game_Object';
import { Instance_Base } from './Instance_Base';

enum COLLISION_OVERRIDE {
    KEEP = 'K',
    FORCE = 'F',
    IGNORE = 'I',
};

export class Object_Instance extends Instance_Base{
    private _animProgress: number = 0;

    objRef: Game_Object;
    zDepthOverride: number | null = null;
    collisionOverride: COLLISION_OVERRIDE = COLLISION_OVERRIDE.KEEP;
    groups: string[];
    startFrame: number = 0;
    fps: number = 0;
    animLoop: boolean = false;
    animPlaying: boolean = false;
    lastPos: Vector = new Vector();
    localVariables: Map<string, any> = new Map();


    constructor(id: number, pos: Vector, objRef: Game_Object){
        super(id, pos);

        this.objRef = objRef;
        this.name = this.objRef.name + '_' + this.id;
        this.zDepthOverride = null;
        this.collisionOverride = COLLISION_OVERRIDE.KEEP;
        this.groups = [];

        //engine props
        if (window.IS_ENGINE){
            this.lastPos = this.pos.clone();
            this.localVariables = new Map(this.logic?.localVariableDefaults);
        }
    }

    get TYPE(){return ENTITY_TYPE.INSTANCE}
    get COLLISION_OVERRIDES(){return COLLISION_OVERRIDE};

    get zDepth(){return (this.zDepthOverride) ? this.zDepthOverride : this.objRef.zDepth}
    get hasEditorFrame(){return this.objRef.hasEditorFrame};
    get editorFrame(){return this.objRef.editorFrame};
    get editorFrameID(){return this.objRef.editorFrameID};
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
        let hasCollisionEvent = false;

        for (const eventKey in this.logic?.events){
            hasCollisionEvent ||= eventKey == 'e_collision';
        }

        return !!hasCollisionEvent;
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

    clone(): Object_Instance {
        const clone = new Object_Instance(this.id, this.pos, this.objRef);
        Object.assign(clone, this);
        clone.pos = this.pos.clone();
        if (this.lastPos) clone.lastPos = this.lastPos.clone();
        clone.localVariables = new Map(this.localVariables);
        return clone;
    }

    toSaveData(): iAnyObj {
        let sanitized = Object.assign({}, this) as iAnyObj;

        sanitized.objId = this.objRef.id;
        sanitized.pos = this.pos.toObject();
        
        delete sanitized.objRef;
        delete sanitized.localVariables;

        return sanitized;
    }

    fromSaveData(data: iAnyObj): Object_Instance {
        delete data.pos;
        delete data.objId;

        Object.assign(this, data);

        return this;
    }

    executeNodeEvent(eventName: string, data: iAnyObj): void {
        this.logic?.executeEvent(eventName, this, data);
    }

    initAnimProps(): void {
        this.startFrame = this.objRef.startFrame;
        this.fps = this.objRef.fps;
        this.animLoop = this.objRef.animLoop;
        this.animPlaying = this.objRef.animPlaying;
        this.animFrame = this.objRef.startFrame;
    }

    advanceAnimation(deltaTime: number): void {
        if (this.animPlaying){
            this._animProgress += deltaTime;
        }
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