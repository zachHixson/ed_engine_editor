Shared.Exit = class {
    static TRANSITION = {
        NONE: 0,
        FADE: 1
    }

    constructor(id, pos = {x:0, y:0}){
        this.id = id;
        this.name = this.id.toString();
        this.pos = new Victor.fromObject(pos);
        this.isEnding = false;
        this.destinationRoom = null;
        this.destinationExit = null;
        this.transition = Shared.Exit.TRANSITION.NONE;
        this.endingDialog = "";
    }

    get TYPE(){return Shared.ENTITY_TYPE.EXIT};
    get TRANSITION_TYPES(){return Shared.Exit.TRANSITION};

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

Object.freeze(Shared.Exit.TRANSITION);