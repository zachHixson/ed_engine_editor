import { iAnyObj } from '../interfaces';
import { Vector } from '../Vector';
import { iInstanceBaseSaveData, Instance_Base } from './Instance_Base';
import {ENTITY_TYPE} from '../Enums';

export interface iExitSaveData extends iInstanceBaseSaveData {
    isEnding: boolean;
    destinationRoom: number | null;
    destinationExit: number | null;
    transition: TRANSITION;
    endingDialog: string;
}

enum TRANSITION {
    NONE = 'N',
    FADE = 'F',
};

export class Exit extends Instance_Base {
    isEnding: boolean = false;
    destinationRoom: number | null = null;
    destinationExit: number | null = null;
    transition: TRANSITION = TRANSITION.NONE;
    endingDialog: string = '';

    static get TRANSITION_TYPES(){return TRANSITION};

    get TYPE(){return ENTITY_TYPE.EXIT}

    clone(): Exit {
        const clone = new Exit(this.id, this.pos);
        Object.assign(clone, this);
        clone.pos = this.pos.clone();
        return clone;
    }

    toSaveData(): iExitSaveData {
        return {
            ...this.getBaseSaveData(),
            isEnding: this.isEnding,
            destinationRoom: this.destinationRoom,
            destinationExit: this.destinationExit,
            transition: this.transition,
            endingDialog: this.endingDialog,
        };
    }

    static fromSaveData(data: iExitSaveData): Exit {
        return new Exit(data.id, Vector.fromObject(data.pos))._loadSaveData(data);
    }

    private _loadSaveData(data: iExitSaveData): Exit {
        this.loadBaseSaveData(data);
        this.isEnding = data.isEnding;
        this.destinationRoom = data.destinationRoom;
        this.destinationExit = data.destinationExit;
        this.transition = data.transition;
        this.endingDialog = data.endingDialog;

        return this;
    }
};