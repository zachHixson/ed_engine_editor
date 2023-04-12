import { INSTANCE_TYPE } from "../Enums";
import { Vector } from "../Vector";
import { Instance_Base, iInstanceBaseSaveData } from "./Instance_Base";
import { Sprite } from "./Sprite";

export interface iInstanceSpriteSaveData extends iInstanceBaseSaveData {
    spriteId: number;
}

export class Instance_Sprite extends Instance_Base {
    static DEFAULT_SPRITE_ICON_ID = 'SPRITE_ICON';
    static DEFAULT_SPRITE_ICON = [new ImageData(Sprite.DIMENSIONS, Sprite.DIMENSIONS)];

    private _useIcon = false;

    sprite: Sprite;

    constructor(id: number, pos = new Vector(), sprite: Sprite){
        super(id, pos);
        this.sprite = sprite;
    }

    get TYPE(){return INSTANCE_TYPE.SPRITE}
    get renderable(){return true}
    get hasEditorFrame(){
        this._useIcon = this.sprite?.frameIsEmpty(this.startFrame) ?? true;
        return !this._useIcon;
    }
    get frameDataId(){return this._useIcon || !this.renderable ? Instance_Sprite.DEFAULT_SPRITE_ICON_ID : this.sprite!.id}
    get frameData(){return this._useIcon || !this.renderable ? Instance_Sprite.DEFAULT_SPRITE_ICON : this.sprite!.frames}

    clone(): Instance_Sprite {
        const clone = new Instance_Sprite(0, new Vector(), this.sprite);
        Object.assign(clone, this);
        clone.pos = this.pos.clone();

        return clone;
    }

    toSaveData(): iInstanceSpriteSaveData {
        return {
            ...this.getBaseSaveData(),
            spriteId: this.sprite.id,
        };
    }

    static fromSaveData(data: iInstanceSpriteSaveData, spriteMap: Map<number, Sprite>): Instance_Sprite {
        const newSprite = new Instance_Sprite(data.id, Vector.fromObject(data.pos), spriteMap.get(data.spriteId)!);
        return newSprite;
    }
}