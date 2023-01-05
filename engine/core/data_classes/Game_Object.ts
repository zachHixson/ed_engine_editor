import { Asset_Base, iAssetSaveData } from './Asset_Base';
import {CATEGORY_ID} from '../Enums';
import { Sprite } from './Sprite';
import { iAnyObj } from '../interfaces';
import { iEditorLogic, iEngineLogic } from '../LogicInterfaces';

export interface iGameObjectSaveData extends iAssetSaveData {
    _startFrame: number
    spriteId: number | null;
    fps: number;
    animLoop: boolean;
    animPlaying: boolean;
    zDepth: number;
    isSolid: boolean;
    applyGravity: boolean;
    triggerExits: boolean;
    exitBehavior: EXIT_TYPES;
    keepCameraSettings: boolean;
    customLogic: boolean;
    logicPresetId: number | null;
    logicScriptId: number | null;
    groups: string[];
}

enum EXIT_TYPES {
    TO_DESTINATION = 'TD',
    THROUGH_DESTINATION = 'TH',
    KEEP_POSITION = 'KP',
    TRANSITION_ONLY = 'TO',
};

export class Game_Object extends Asset_Base {
    static get EXIT_TYPES(){return EXIT_TYPES}

    private _startFrame: number = 0;

    sprite: Sprite | null = null;
    fps = 6;
    animLoop: boolean = true;
    animPlaying: boolean = false;
    zDepth: number = 0;
    isSolid: boolean = false;
    applyGravity: boolean = false;
    triggerExits: boolean = false;
    exitBehavior: EXIT_TYPES = EXIT_TYPES.TO_DESTINATION;
    keepCameraSettings: boolean = true;
    customLogic: boolean = false;
    logicPresetId: number | null = null;
    logicScriptId: number | null = null;
    logicScript: iEngineLogic | null = null;
    groups: string[] = [];

    get thumbnail(){
        const thumbFrame = this.sprite?.frames[this._startFrame];

        if (!(thumbFrame && this.sprite)){
            return null;
        }

        return this.sprite.frameIsEmpty(this._startFrame) ? null : this.sprite.drawToCanvas(this._startFrame);
    }

    clone(): Game_Object {
        const clone = new Game_Object();
        Object.assign(clone, this);
        return clone;
    }

    toSaveData(): iGameObjectSaveData {
        return {
            ...this.getBaseAssetData(),
            _startFrame: this._startFrame,
            spriteId: this.sprite?.id ?? null,
            fps: this.fps,
            animLoop: this.animLoop,
            animPlaying: this.animPlaying,
            zDepth: this.zDepth,
            isSolid: this.isSolid,
            applyGravity: this.applyGravity,
            triggerExits: this.triggerExits,
            exitBehavior: this.exitBehavior,
            keepCameraSettings: this.keepCameraSettings,
            customLogic: this.customLogic,
            logicPresetId: this.logicPresetId,
            logicScriptId: this.logicScriptId,
            groups: this.groups,
        };
    }

    static fromSaveData(data: iGameObjectSaveData, spriteMap: Map<number, Sprite>): Game_Object {
        return new Game_Object()._loadSaveData(data, spriteMap);
    }

    private _loadSaveData(data: iGameObjectSaveData, spriteMap: Map<number, Sprite>, logicMap?: Map<number, iEngineLogic>): Game_Object {
        this.loadBaseAssetData(data);
        this._startFrame = data._startFrame;
        this.sprite = data.spriteId ? spriteMap.get(data.spriteId)! : null;
        this.fps = data.fps;
        this.animLoop = data.animLoop;
        this.animPlaying = data.animPlaying;
        this.zDepth = data.zDepth;
        this.isSolid = data.isSolid;
        this.applyGravity = data.applyGravity;
        this.triggerExits = data.triggerExits;
        this.exitBehavior = data.exitBehavior;
        this.keepCameraSettings = data.keepCameraSettings;
        this.customLogic = data.customLogic;
        this.logicPresetId = data.logicPresetId;
        this.logicScriptId = data.logicScriptId;
        this.logicScript = logicMap?.get(data.logicScriptId!) ?? null;
        this.groups = data.groups;
        return this;
    }

    purgeMissingReferences(sprites: Sprite[]): void {
        if (this.sprite){
            const spriteFound = sprites.find(s => s.id == this.sprite?.id);
            
            if (!spriteFound){
                this.sprite = null;
            }
        }
    }

    get category_ID(){return CATEGORY_ID.OBJECT}
    get hasEditorFrame(){return this.sprite ? !this.sprite.frameIsEmpty(this._startFrame) : false}
    get editorFrame(){return this.thumbnail}
    get editorFrameID(){return this.sprite?.frameIDs[this._startFrame]}

    get startFrame(){return this._startFrame}
    set startFrame(frame){
        this._startFrame = Math.max(Math.min(frame, (this.sprite?.frames.length ?? 0) - 1), 0);
    }
};