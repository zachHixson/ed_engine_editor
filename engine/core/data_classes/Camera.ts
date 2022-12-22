const MOVE_TYPES = {
    LOCKED: 'L',
    FOLLOW: 'F',
    SCROLL: 'S',
};
Object.freeze(MOVE_TYPES);

const SCROLL_DIRS = {
    UP: 'U',
    DOWN: 'D',
    RIGHT: 'R',
    LEFT: 'L',
};
Object.freeze(SCROLL_DIRS);

const FOLLOW_TYPES = {
    SMOOTH: 'S',
    TILED: 'T',
};
Object.freeze(FOLLOW_TYPES);

export class Camera{
    constructor() {
        this.pos = new Victor(8, -8);
        this.velocity = new Victor(0, 0);
        this._size = 1;
        this.moveType = MOVE_TYPES.LOCKED;
        this.scrollDir = SCROLL_DIRS.RIGHT;
        this.scrollSpeed = 10;
        this.followObjId = null;
        this.followType = FOLLOW_TYPES.SMOOTH;
        this.tiledOrigin = null;
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
};