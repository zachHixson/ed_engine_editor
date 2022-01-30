import Victor from 'victor';

const MOVE_TYPES = {
    LOCKED: 0,
    FOLLOW: 1,
    SCROLL: 2
}
Object.freeze(MOVE_TYPES);

const SCROLL_DIRS = {
    UP: 0,
    DOWN: 1,
    RIGHT: 2,
    LEFT: 3
}
Object.freeze(SCROLL_DIRS);

const FOLLOW_TYPES = {
    SMOOTH: 0,
    TILED: 1
}
Object.freeze(FOLLOW_TYPES);

class Camera {
    constructor() {
        this.pos = new Victor(0, -16);
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

    fromSaveData(camera){
        Object.assign(this, camera);
        this.pos = Victor.fromObject(camera.pos);

        return this;
    }
}

export default Camera;