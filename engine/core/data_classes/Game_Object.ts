import { Asset_Base } from './Asset_Base';
import {CATEGORY_ID} from '../Enums';
import { Sprite } from './Sprite';
import { iAnyObj } from '../interfaces';

type Logic = {[key: string]: any};

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
    logicPreset: number | null = null;
    logicScript: Logic | null = null;
    groups: string[] = [];

    constructor(){
        super();
        delete this.navState;
    }

    get thumbnail(){
        const thumbFrame = this.sprite?.frames[this._startFrame];

        if (!(thumbFrame && this.sprite)){
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
        const sanitized = Object.assign({}, this) as any;
        sanitized.sprite = this.sprite?.id ?? null;
        return sanitized;
    }

    fromSaveData(object: iAnyObj, spriteList: Sprite[]): Game_Object {
        Object.assign(this, object);
        this.sprite = spriteList.find(s => s.id == this.sprite?.id) ?? null;
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