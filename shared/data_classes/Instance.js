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
};