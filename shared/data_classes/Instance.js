import {ENTITY_TYPE} from '../Enums';

const COLLISION_OVERRIDE = {
    KEEP: 0,
    FORCE: 1,
    IGNORE: 2
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
        this.animFrame = 0;
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

    clone(){
        const clone = new Instance(this.id, this.pos, this.objRef);
        Object.assign(clone, this);
        this.pos.clone();
        return clone;
    }

    toSaveData(){
        let sanitized = Object.assign({}, this);

        sanitized.objId = this.objRef.id;
        sanitized.pos = this.pos.toObject();

        delete sanitized.objRef;

        return sanitized;
    }

    executeNodeEvent(eventName, data){
        this.logic.executeEvent(eventName, this, data);
    }
};