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
    private _sprite: Sprite;
    private _zDepth = 0;

    startFrameOverride: number = 0;
    fpsOverride: number = 6;

    constructor(id: number, pos = new Vector(), sprite: Sprite){
        super(id, pos);
        this._sprite = sprite;
        this.name = this._sprite.name + '_' + this.id;
    }

    get TYPE(){return INSTANCE_TYPE.SPRITE}
    get sprite(){return this._sprite}
    set sprite(sprite: Sprite){this._sprite = sprite}
    get startFrame(){return this.startFrameOverride}
    set startFrame(frame: number){
        this.startFrameOverride = Math.max(Math.min(Math.floor(frame), this.sprite.frames.length - 1), 0);
    }
    get fps(){return this.fpsOverride}
    get animLoop(){return !!this.animLoopOverride}
    get animPlaying(){return !!this.animPlayingOverride}
    get renderable(){return true}
    get hasEditorFrame(){
        this._useIcon = this.sprite?.frameIsEmpty(this.startFrameOverride ?? 0) ?? true;
        return !this._useIcon;
    }
    get frameDataId(){return this._useIcon || !this.renderable ? Instance_Sprite.DEFAULT_SPRITE_ICON_ID : this.sprite!.id}
    get frameData(){return this._useIcon || !this.renderable ? Instance_Sprite.DEFAULT_SPRITE_ICON : this.sprite!.frames}

    get zDepth(){return this._zDepth}
    set zDepth(newDepth: number){
        this._zDepth = Math.max(Math.min(newDepth, 99), -99);
    }

    override clone(): Instance_Sprite {
        const clone = new Instance_Sprite(0, new Vector(), this.sprite);
        Object.assign(clone, this);
        clone.pos = this.pos.clone();

        return clone;
    }

    override toSaveData(): iInstanceSpriteSaveData {
        return {
            ...this.getBaseSaveData(),
            spriteId: this.sprite.id,
        };
    }

    override needsPurge(spriteMap: Map<number, any>): boolean {
        return !spriteMap.get(this.sprite.id);
    }

    static fromSaveData(data: iInstanceSpriteSaveData, spriteMap: Map<number, Sprite>): Instance_Sprite {
        const newSprite = new Instance_Sprite(data.id, Vector.fromObject(data.pos), spriteMap.get(data.spriteId)!);
        newSprite.loadBaseSaveData(data);
        return newSprite;
    }
}