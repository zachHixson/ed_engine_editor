import Victor from 'victor';

let enumVal = 0;

const MOVE_TYPES = {
    LOCKED: enumVal++,
    FOLLOW: enumVal++,
    SCROLL: enumVal++
}
Object.freeze(MOVE_TYPES);

const SCROLL_DIRS = {
    UP: enumVal++,
    DOWN: enumVal++,
    RIGHT: enumVal++,
    LEFT: enumVal++
}
Object.freeze(SCROLL_DIRS);

const FOLLOW_TYPES = {
    SMOOTH: enumVal++,
    TILED: enumVal++
}
Object.freeze(FOLLOW_TYPES);

class Camera {
    constructor() {
        this.pos = new Victor(0, 0);
        this._size = 1;
        this.moveType = this.MOVE_TYPES.LOCKED;
        this.scrollDir = this.SCROLL_DIRS.RIGHT;
        this.scrollSpeed = 10;
        this.followObjId = null;
        this.followType = this.FOLLOW_TYPES.SMOOTH;
    }

    get MOVE_TYPES() {return MOVE_TYPES};
    get SCROLL_DIRS(){return SCROLL_DIRS};
    get FOLLOW_TYPES() {return FOLLOW_TYPES};

    get size(){return this._size};

    set size(newSize){this._size = Math.max(newSize, 1)}
}

export default Camera;