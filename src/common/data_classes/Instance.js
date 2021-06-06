import {ENTITY_TYPE} from '@/common/Enums';
import Victor from 'victor';

const COLLISION_OVERRIDE = {
    KEEP: 0,
    FORCE: 1,
    IGNORE: 2
}
Object.freeze(COLLISION_OVERRIDE);

class Instance{
    constructor(id, objRef, {x, y}){
        this.id = id;
        this.objRef = objRef;
        this.pos = new Victor(x, y);
        this.name = this.objRef.name + '_' + this.id;
        this.zDepthOverride = null;
        this.collisionOverride = this.COLLISION_OVERRIDES.KEEP;
        this.groups = [];
        this.customVars = [];
    }

    get TYPE(){return ENTITY_TYPE.INSTANCE}
    get COLLISION_OVERRIDES(){return COLLISION_OVERRIDE};

    get zDepth(){return (this.zDepthOverride) ? this.zDepthOverride : this.objRef.zDepth}
    get editorFrame(){return this.objRef.editorFrame};
    get editorFrameID(){return this.objRef.editorFrameID};

    toSaveData(){
        let sanitized = Object.assign({}, this);

        sanitized.objId = this.objRef.id;
        sanitized.pos = this.pos.toObject();

        delete sanitized.objRef;

        return sanitized;
    }
}

export default Instance;