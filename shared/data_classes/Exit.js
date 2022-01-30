import {ENTITY_TYPE} from '@shared/Enums';
import Victor from 'victor';

const TRANSITION = {
    NONE: 0,
    FADE: 1
}
Object.freeze(TRANSITION)

class Exit{
    constructor(id, pos = {x:0, y:0}){
        this.id = id;
        this.name = this.id.toString();
        this.pos = new Victor.fromObject(pos);
        this.isEnding = false;
        this.destinationRoom = null;
        this.destinationExit = null;
        this.transition = TRANSITION.NONE;
        this.endingDialog = "";
    }

    get TYPE(){return ENTITY_TYPE.EXIT};
    get TRANSITION_TYPES(){return TRANSITION};

    toSaveData(){
        let sanitized = {};

        Object.assign(sanitized, this);
        sanitized.destinationRoom = this.destinationRoom;
        sanitized.destinationExit = this.destinationExit;

        return sanitized;
    }

    fromSaveData(data){
        Object.assign(this, data);
        this.pos = Victor.fromObject(data.pos);

        return this;
    }
}

export default Exit;