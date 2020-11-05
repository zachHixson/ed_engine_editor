import Victor from 'victor';

class Instance{
    constructor(id, objRef, {x, y}){
        this.id = id;
        this.objRef = objRef;
        this.pos = new Victor(x, y);
        this.zDepthOverride = null;
    }

    get zDepth(){return (this.objRef) ? this.objRef.zDepth : this.zDepthOverride}
    get editorFrame(){return this.objRef.editorFrame};
    get editorFrameID(){return this.objRef.editorFrameID};
}

export default Instance;