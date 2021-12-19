import Asset from './Asset';
import {CATEGORY_ID} from '../Enums';

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
        this.triggerExits = false;
        this.customLogic = false;
        this.logicPreset = null;
        this.logicScript = null;
        this.groups = [];

        delete this.navState;
    }

    get thumbnailData(){
        let thumbnail = this.sprite?.frames[this._startFrame];

        if (!thumbnail){
            return null;
        }
        
        for (let i = 0; i < thumbnail.length; i++){
            if (thumbnail[i] != ''){
                return thumbnail;
            }
        }

        return null;
    }

    toSaveData(){
        let sanitized = Object.assign({}, this);
        sanitized.sprite = this.sprite.id;
        return sanitized;
    }

    fromSaveData(object, spriteList){
        super.fromSaveData(object);
        this.sprite = spriteList.find(s => s.id == this.sprite);
        return this;
    }

    purgeMissingReferences(sprites){
        if (this.sprite){
            let spriteFound = sprites.find(s => s.id == this.sprite.id);
            
            if (!spriteFound){
                this.sprite = null;
            }
        }
    }

    get category_ID(){return CATEGORY_ID.OBJECT}
    get startFrame(){return this._startFrame}
    get editorFrame(){return this.thumbnailData;}
    get editorFrameID(){return this.sprite.frameIDs[this._startFrame]}

    set startFrame(frame){
        this._startFrame = Math.max(Math.min(frame, this.sprite.frames.length - 1), 0);
    }
}

export default Game_Object;