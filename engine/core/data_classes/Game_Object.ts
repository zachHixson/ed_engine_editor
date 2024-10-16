import { Asset_Base, tAssetSaveData, Label } from './Asset_Base';
import {CATEGORY_ID} from '../Enums';
import { Sprite } from './Sprite';
import { iEngineLogic } from '../LogicInterfaces';

export type tGameObjectSaveData = [
    ...tAssetSaveData,
    Label<number, 'Start Frame'>,
    Label<number | '', 'Sprite ID'>,
    Label<number, 'Anim FPS'>,
    Label<0 | 1, 'Loop Anim'>,
    Label<0 | 1, 'Play Anim'>,
    Label<number, 'Object zDepth'>,
    Label<0 | 1, 'Is Solid'>,
    Label<0 | 1, 'Use Gravity'>,
    Label<0 | 1, 'Trigger Exits'>,
    Label<EXIT_TYPES, 'Exit Behavior'>,
    Label<0 | 1, 'Keep Camera Settings'>,
    Label<0 | 1, 'Custom Logic'>,
    Label<number | '', 'Logic Script ID'>,
    Label<string[], 'Groups'>,
]

enum EXIT_TYPES {
    TO_DESTINATION = 'TD',
    KEEP_POSITION = 'KP',
    TRANSITION_ONLY = 'TO',
};

export class Game_Object extends Asset_Base {
    static get EXIT_TYPES(){return EXIT_TYPES}

    private _startFrame: number = 0;
    private _zDepth: number = 0;

    sprite: Sprite | null = null;
    fps = 6;
    animLoop: boolean = true;
    animPlaying: boolean = false;
    isSolid: boolean = false;
    applyGravity: boolean = false;
    triggerExits: boolean = false;
    exitBehavior: EXIT_TYPES = EXIT_TYPES.TO_DESTINATION;
    keepCameraSettings: boolean = true;
    customLogic: boolean = false;
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

    get zDepth(){return this._zDepth}
    set zDepth(newDepth: number){
        this._zDepth = Math.max(Math.min(newDepth, 99), -99);
    }

    clone(): Game_Object {
        const clone = new Game_Object();
        Object.assign(clone, this);
        return clone;
    }

    toSaveData(): tGameObjectSaveData {
        return [
            ...this.getBaseAssetData(),
            this._startFrame,
            this.sprite?.id ?? '',
            this.fps,
            +this.animLoop as (0 | 1),
            +this.animPlaying as (0 | 1),
            this.zDepth,
            +this.isSolid as (0 | 1),
            +this.applyGravity as (0 | 1),
            +this.triggerExits as (0 | 1),
            this.exitBehavior,
            +this.keepCameraSettings as (0 | 1),
            +this.customLogic as (0 | 1),
            this.logicScriptId ?? '',
            this.groups,
        ];
    }

    static fromSaveData(data: tGameObjectSaveData, spriteMap: Map<number, Sprite>): Game_Object {
        return new Game_Object()._loadSaveData(data, spriteMap);
    }

    private _loadSaveData(data: tGameObjectSaveData, spriteMap: Map<number, Sprite>, logicMap?: Map<number, iEngineLogic>): Game_Object {
        this.loadBaseAssetData(data);
        this._startFrame = data[3];
        this.sprite = data[4] ? spriteMap.get(data[4])! : null;
        this.fps = data[5];
        this.animLoop = !!data[6];
        this.animPlaying = !!data[7];
        this.zDepth = data[8];
        this.isSolid = !!data[9];
        this.applyGravity = !!data[10];
        this.triggerExits = !!data[11];
        this.exitBehavior = data[12];
        this.keepCameraSettings = !!data[13];
        this.customLogic = !!data[14];
        this.logicScriptId = data[15] == '' ? null : data[15];
        this.logicScript = logicMap?.get(this.logicScriptId!) ?? null;
        this.groups = data[16];
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
    get editorFrameNum(){return this._startFrame}

    get startFrame(){return this._startFrame}
    set startFrame(frame){
        this._startFrame = Math.max(Math.min(frame, (this.sprite?.frames.length ?? 0) - 1), 0);
    }
};