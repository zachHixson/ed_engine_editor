import { Vec2 } from "linearz";
import { INSTANCE_TYPE } from "../Enums";
import { Instance_Base, InstanceBaseSave } from "./Instance_Base";
import { Sprite } from "./Sprite";
import { u32ToVec2 } from "../Util";

export type InstanceSpriteSave = [
    ...InstanceBaseSave,
    spriteId: number,
];

export class Instance_Sprite extends Instance_Base {
    static DEFAULT_SPRITE_ICON_ID = 'SPRITE_ICON';
    static DEFAULT_SPRITE_ICON = [new ImageData(Sprite.DIMENSIONS, Sprite.DIMENSIONS)];

    private _useIcon = false;

    startFrameOverride: number = 0;
    fpsOverride: number = 6;

    constructor(id: number, pos = new Vec2(), sprite: Sprite | null){
        super(id, pos);
        this._sprite = sprite;
        this.name = (this._sprite?.name ?? 'Sprite') + '_' + this.id;
    }

    get TYPE(){return INSTANCE_TYPE.SPRITE}
    get sourceId(){return this.sprite?.id ?? -1}
    get startFrame(){return this.startFrameOverride}
    set startFrame(frame: number){
        if (!this.sprite) return;
        this.startFrameOverride = Math.max(Math.min(Math.floor(frame), this.sprite.frames.length - 1), 0);
    }
    get fps(){return this.fpsOverride}
    get animLoop(){return !!this.animLoopOverride}
    get animPlaying(){return !!this.animPlayingOverride}
    set animPlaying(playing: boolean){
        if (playing == this.animPlayingOverride) return;
        this.animPlayingOverride = playing;
    };
    get renderable(){return true}
    get hasEditorFrame(){
        this._useIcon = this.sprite?.frameIsEmpty(this.startFrameOverride ?? 0) ?? true;
        return !this._useIcon;
    }
    get frameDataId(){return this._useIcon || !this.renderable ? Instance_Sprite.DEFAULT_SPRITE_ICON_ID : this.sprite!.id}
    get frameData(){return this._useIcon || !this.renderable ? Instance_Sprite.DEFAULT_SPRITE_ICON : this.sprite!.frames}

    override clone(): Instance_Sprite {
        const clone = new Instance_Sprite(0, new Vec2(), this.sprite);
        Object.assign(clone, this);
        clone.pos = this.pos.clone();

        return clone;
    }

    override toSaveData(): InstanceSpriteSave {
        return [
            ...this.getBaseSaveData(),
            this.sprite?.id ?? -1,
        ];
    }

    override needsPurge(spriteMap: Map<number, any>): boolean {
        if (!this.sprite) return false;
        return !spriteMap.get(this.sprite.id);
    }

    static fromSaveData(data: InstanceSpriteSave, spriteMap: Map<number, Sprite>): Instance_Sprite {
        const id = data[0];
        const spriteID = data[10];
        const pos = data[3];
        const spriteAsset = spriteID >= 0 ? spriteMap.get(spriteID)! : null;
        const newSprite = new Instance_Sprite(id, u32ToVec2(pos), spriteAsset);
        newSprite.loadBaseSaveData(data);
        return newSprite;
    }
}
