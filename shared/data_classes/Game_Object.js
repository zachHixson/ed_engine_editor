import {Asset} from './Asset';
import {CATEGORY_ID} from '../Enums';

export class Game_Object extends Asset{
    constructor(){
        super();
        this.sprite = null;
        this._startFrame = 0;
        this.fps = 6;
        this.animLoop = true;
        this.animPlaying = false;
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

    get thumbnail(){
        let thumbFrame = this.sprite?.frames[this._startFrame];

        if (!thumbFrame){
            return null;
        }

        return this.sprite.frameIsEmpty(this._startFrame) ? null : this.sprite.drawToCanvas(this._startFrame);
    }

    clone(){
        const clone = new Game_Object();
        Object.assign(clone, this);
        return clone;
    }

    toSaveData(){
        let sanitized = Object.assign({}, this);
        sanitized.sprite = this.sprite?.id ?? null;
        return sanitized;
    }

    fromSaveData(object, spriteList){
        Object.assign(this, object);
        this.sprite = spriteList.find(s => s.id == this.sprite) ?? null;
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
    get hasEditorFrame(){return this.sprite ? !this.sprite.frameIsEmpty(this._startFrame) : false}
    get editorFrame(){return this.thumbnail}
    get editorFrameID(){return this.sprite.frameIDs[this._startFrame]}

    set startFrame(frame){
        this._startFrame = Math.max(Math.min(frame, this.sprite.frames.length - 1), 0);
    }
};