import {ENTITY_TYPE} from '../Enums';

const TRANSITION = {
    NONE: 'N',
    FADE: 'F',
};
Object.freeze(TRANSITION);

export class Exit{
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
    static get TRANSITION_TYPES(){return TRANSITION};

    clone(){
        const clone = new Exit(this.id, this.pos);
        Object.assign(clone, this);
        clone.pos = this.pos.clone();
        return clone;
    }

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
};