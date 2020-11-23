import Asset from './Asset';
import {CATEGORY_ID, CATEGORY_TYPE} from '../Enums';

class Game_Object extends Asset{
    constructor(){
        super();
        this.sprite = null;
        this._startFrame = 0;
        this.fps = 6;
        this.animLoop = true;
        this.zDepth = 0;
        this.isSolid = false;
        this.applyGravity = false;
        this.customLogic = false;
        this.logicPreset = null;
        this.groups = [];
    }

    get type(){return CATEGORY_TYPE.OBJECT}
    get category_ID(){return CATEGORY_ID.OBJECT}
    get startFrame(){return this._startFrame}
    get editorFrame(){return this.sprite.frames[this._startFrame]}
    get editorFrameID(){return this.sprite.frameIDs[this._startFrame]}

    set startFrame(frame){
        this._startFrame = Math.max(Math.min(frame, this.sprite.frames.length - 1), 0);
    }
}

export default Game_Object;