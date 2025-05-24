import { Asset_Base, AssetSave } from './Asset_Base';
import {CATEGORY_ID} from '../Enums';
import { Sprite } from './Sprite';
import { iEngineLogic } from '../LogicInterfaces';

enum EXIT_TYPES {
    TO_DESTINATION = 'TD',
    KEEP_POSITION = 'KP',
    TRANSITION_ONLY = 'TO',
};

export type GameObjectSave = AssetSave & {
	strtFrm: number,
	sprID: number | '',
	animFPS: number,
	loopAnim: 1 | 0,
	playAnim: 1 | 0,
	zDepth: number,
	isSolid: 1 | 0,
	useGrav: 1 | 0,
	tgrExit: 1 | 0,
	exitBeh: string,
	keepCamSet: 1 | 0,
	custLog: 1 | 0,
	logScrID: number | '',
	grpList: Array<string>,
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

    toSaveData(): GameObjectSave {
        return {
            ...this.getBaseAssetData(),
            strtFrm: this._startFrame,
            sprID: this.sprite?.id ?? '',
            animFPS: this.fps,
            loopAnim: +this.animLoop as (0 | 1),
            playAnim: +this.animPlaying as (0 | 1),
            zDepth: this.zDepth,
            isSolid: +this.isSolid as (0 | 1),
            useGrav: +this.applyGravity as (0 | 1),
            tgrExit: +this.triggerExits as (0 | 1),
            exitBeh: this.exitBehavior,
            keepCamSet: +this.keepCameraSettings as (0 | 1),
            custLog: +this.customLogic as (0 | 1),
            logScrID: this.logicScriptId ?? '',
            grpList: this.groups,
        };
    }

    static fromSaveData(data: GameObjectSave, spriteMap: Map<number, Sprite>): Game_Object {
        return new Game_Object()._loadSaveData(data, spriteMap);
    }

    private _loadSaveData(data: GameObjectSave, spriteMap: Map<number, Sprite>, logicMap?: Map<number, iEngineLogic>): Game_Object {
        this.loadBaseAssetData(data);

        this._startFrame = data.strtFrm;
        this.sprite = data.sprID ? spriteMap.get(data.sprID)! : null;
        this.fps = data.animFPS;
        this.animLoop = !!data.loopAnim;
        this.animPlaying = !!data.playAnim;
        this.zDepth = data.zDepth;
        this.isSolid = !!data.isSolid;
        this.applyGravity = !!data.useGrav;
        this.triggerExits = !!data.tgrExit;
        this.exitBehavior = data.exitBeh as EXIT_TYPES;
        this.keepCameraSettings = !!data.keepCamSet;
        this.customLogic = !!data.custLog;
        this.logicScriptId = data.logScrID == '' ? null : data.logScrID;
        this.logicScript = logicMap?.get(this.logicScriptId!) ?? null;
        this.groups = data.grpList;
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