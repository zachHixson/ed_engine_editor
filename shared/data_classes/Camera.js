const MOVE_TYPES = {
    LOCKED: 0,
    FOLLOW: 1,
    SCROLL: 2
};
Object.freeze(MOVE_TYPES);

const SCROLL_DIRS = {
    UP: 0,
    DOWN: 1,
    RIGHT: 2,
    LEFT: 3
};
Object.freeze(MOVE_TYPES);

const FOLLOW_TYPES = {
    SMOOTH: 0,
    TILED: 1
};
Object.freeze(MOVE_TYPES);

export class Camera{
    constructor() {
        this.pos = new Victor(0, -16);
        this.velocity = new Victor(0, 0);
        this._size = 1;
        this.moveType = MOVE_TYPES.LOCKED;
        this.scrollDir = SCROLL_DIRS.RIGHT;
        this.scrollSpeed = 10;
        this.followObjId = null;
        this.followType = FOLLOW_TYPES.SMOOTH;
    }

    static get MOVE_TYPES() {return MOVE_TYPES};
    static get SCROLL_DIRS(){return SCROLL_DIRS};
    static get FOLLOW_TYPES() {return FOLLOW_TYPES};

    get size(){return this._size};

    set size(newSize){this._size = Math.max(newSize, 0.5)}

    clone(){
        const clone = Object.assign(new Camera(), this);
        clone.pos = this.pos.clone();
        return clone;
    }

    fromSaveData(camera){
        Object.assign(this, camera);
        this.pos = Victor.fromObject(camera.pos);
        this.velocity = Victor.fromObject(camera.velocity);

        return this;
    }

    update(){
        this.pos.add(this.velocity);
    }
};