import { Asset_Base, sAssetSaveData } from './Asset_Base';
import {CATEGORY_ID} from '../Enums';
import { Sprite } from './Sprite';
import { iEngineLogic } from '../LogicInterfaces';
import { Struct, GetKeyTypesFrom } from '../Struct';

enum EXIT_TYPES {
    TO_DESTINATION = 'TD',
    KEEP_POSITION = 'KP',
    TRANSITION_ONLY = 'TO',
};

export const sGameObjectSaveData = [
    ...sAssetSaveData,
    ['startFrame', Number()],
    ['spriteID', Struct.getDataType<number | ''>()],
    ['animFPS', Number()],
    ['loopAnim', 0 | 1],
    ['playAnim', 0 | 1],
    ['zDepth', Number()],
    ['isSolid', 0 | 1],
    ['useGravity', 0 | 1],
    ['triggerExits', 0 | 1],
    ['exitBehavior', Struct.getDataType<EXIT_TYPES>()],
    ['keepCameraSettings', 0 | 1],
    ['customLogic', 0 | 1],
    ['logicScriptID', Struct.getDataType<number | ''>()],
    ['groupList', Struct.getDataType<string[]>()],
] as const;

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

    toSaveData(): GetKeyTypesFrom<typeof sGameObjectSaveData> {
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

    static fromSaveData(data: GetKeyTypesFrom<typeof sGameObjectSaveData>, spriteMap: Map<number, Sprite>): Game_Object {
        return new Game_Object()._loadSaveData(data, spriteMap);
    }

    private _loadSaveData(data: GetKeyTypesFrom<typeof sGameObjectSaveData>, spriteMap: Map<number, Sprite>, logicMap?: Map<number, iEngineLogic>): Game_Object {
        this.loadBaseAssetData(data);

        const dataObj = Struct.objFromArr(sGameObjectSaveData, data);

        if (!dataObj){
            throw new Error('Error loading Game_Object from file');
        }

        this._startFrame = dataObj.startFrame;
        this.sprite = dataObj.spriteID ? spriteMap.get(dataObj.spriteID)! : null;
        this.fps = dataObj.animFPS;
        this.animLoop = !!dataObj.loopAnim;
        this.animPlaying = !!dataObj.playAnim;
        this.zDepth = dataObj.zDepth;
        this.isSolid = !!dataObj.isSolid;
        this.applyGravity = !!dataObj.useGravity;
        this.triggerExits = !!dataObj.triggerExits;
        this.exitBehavior = dataObj.exitBehavior;
        this.keepCameraSettings = !!dataObj.keepCameraSettings;
        this.customLogic = !!dataObj.customLogic;
        this.logicScriptId = dataObj.logicScriptID == '' ? null : dataObj.logicScriptID;
        this.logicScript = logicMap?.get(this.logicScriptId!) ?? null;
        this.groups = dataObj.groupList;
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