import Victor from 'victor';

let enumVal = 0;

const COLLISION_OVERRIDE = {
    KEEP: enumVal++,
    FORCE: enumVal++,
    IGNORE: enumVal++
}
Object.freeze(COLLISION_OVERRIDE);

class Instance{
    constructor(id, objRef, {x, y}){
        this.id = id;
        this.objRef = objRef;
        this.pos = new Victor(x, y);
        this.instanceName = this.objRef.name + '_' + this.id;
        this.zDepthOverride = null;
        this.collisionOverride = this.COLLISION_OVERRIDES.KEEP;
        this.customVars = [];
    }

    get COLLISION_OVERRIDES(){return COLLISION_OVERRIDE};

    get zDepth(){return (this.zDepthOverride) ? this.zDepthOverride : this.objRef.zDepth}
    get editorFrame(){return this.objRef.editorFrame};
    get editorFrameID(){return this.objRef.editorFrameID};
}

export default Instance;