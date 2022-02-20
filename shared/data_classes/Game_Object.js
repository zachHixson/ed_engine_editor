Shared.Game_Object = class extends Shared.Asset{
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

    get category_ID(){return Shared.CATEGORY_ID.OBJECT}
    get startFrame(){return this._startFrame}
    get editorFrame(){return this.thumbnailData;}
    get editorFrameID(){return this.sprite.frameIDs[this._startFrame]}

    set startFrame(frame){
        this._startFrame = Math.max(Math.min(frame, this.sprite.frames.length - 1), 0);
    }
};