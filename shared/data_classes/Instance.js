import {ENTITY_TYPE} from '../Enums';

const COLLISION_OVERRIDE = {
    KEEP: 'K',
    FORCE: 'F',
    IGNORE: 'I',
};
Object.freeze(COLLISION_OVERRIDE);

export class Instance{
    constructor(id, pos, objRef){
        this.id = id;
        this.objRef = objRef;
        this.pos = new Victor.fromObject(pos);
        this.name = this.objRef.name + '_' + this.id;
        this.zDepthOverride = null;
        this.collisionOverride = COLLISION_OVERRIDE.KEEP;
        this.groups = [];
        this.customVars = [];

        //engine props
        this._animProgress = 0;
        this.startFrame = 0;
        this.fps = 0;
        this.animLoop = false;
        this.animPlaying = false;
        this.lastPos = this.pos.clone();
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
            hasCollisionEvent |= eventKey == 'e_collision';
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
    set animFrame(val){
        if (!this.sprite){
            return;
        }
        
        const frame = Math.min(Math.max(val, 0), this.sprite.frames.length - 1);
        const animDur = Math.floor(this.sprite.frames.length * this.fps) * 1000;
        this._animProgress = Math.floor(frame / this.sprite.frames.length * animDur);
    }

    clone(){
        const clone = new Instance(this.id, this.pos, this.objRef);
        Object.assign(clone, this);
        clone.pos = this.pos.clone();
        clone.lastPos = this.lastPos.clone();
        return clone;
    }

    toSaveData(){
        let sanitized = Object.assign({}, this);

        sanitized.objId = this.objRef.id;
        sanitized.pos = this.pos.toObject();

        delete sanitized.objRef;
        delete sanitized._animProgress;
        delete sanitized.startFrame;
        delete sanitized.fps;
        delete sanitized.animLoop;
        delete sanitized.animPlaying;
        delete sanitized.lastPos;

        return sanitized;
    }

    executeNodeEvent(eventName, data){
        this.logic.executeEvent(eventName, this, data);
    }

    initAnimProps(){
        this.startFrame = this.objRef.startFrame;
        this.fps = this.objRef.fps;
        this.animLoop = this.objRef.animLoop;
        this.animPlaying = this.objRef.animPlaying;
        this.animFrame = this.objRef.startFrame;
    }

    advanceAnimation(deltaTime){
        if (this.animPlaying){
            this._animProgress += deltaTime;
        }
    }
};