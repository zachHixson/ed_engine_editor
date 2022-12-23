import { iAnyObj } from '../interfaces';
import { Vector } from '../Vector';
import { Instance_Base } from './Instance_Base';
import { Room } from './Room';

enum TRANSITION {
    NONE = 'N',
    FADE = 'F',
};

export class Exit extends Instance_Base {
    isEnding: boolean = false;
    destinationRoom: number | null = null;
    destinationExit: Exit | null = null;
    transition: TRANSITION = TRANSITION.NONE;
    endingDialog: string = '';

    static get TRANSITION_TYPES(){return TRANSITION};

    clone(): Exit {
        const clone = new Exit(this.id, this.pos);
        Object.assign(clone, this);
        clone.pos = this.pos.clone();
        return clone;
    }

    toSaveData(): iAnyObj {
        const sanitized = {} as iAnyObj;

        Object.assign(sanitized, this);
        sanitized.destinationRoom = this.destinationRoom;
        sanitized.destinationExit = this.destinationExit;

        return sanitized;
    }

    fromSaveData(data: iAnyObj): Exit {
        Object.assign(this, data);
        this.pos = Vector.fromObject(data.pos);

        return this;
    }
};