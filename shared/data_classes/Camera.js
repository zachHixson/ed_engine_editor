Shared.Camera = class {
    static MOVE_TYPES = {
        LOCKED: 0,
        FOLLOW: 1,
        SCROLL: 2
    }

    static SCROLL_DIRS = {
        UP: 0,
        DOWN: 1,
        RIGHT: 2,
        LEFT: 3
    }

    static FOLLOW_TYPES = {
        SMOOTH: 0,
        TILED: 1
    }

    constructor() {
        this.pos = new Victor(0, -16);
        this._size = 1;
        this.moveType = Shared.Camera.MOVE_TYPES.LOCKED;
        this.scrollDir = Shared.Camera.SCROLL_DIRS.RIGHT;
        this.scrollSpeed = 10;
        this.followObjId = null;
        this.followType = Shared.Camera.FOLLOW_TYPES.SMOOTH;
    }

    get MOVE_TYPES() {return Shared.Camera.MOVE_TYPES};
    get SCROLL_DIRS(){return Shared.Camera.SCROLL_DIRS};
    get FOLLOW_TYPES() {return Shared.Camera.FOLLOW_TYPES};

    get size(){return this._size};

    set size(newSize){this._size = Math.max(newSize, 1)}

    fromSaveData(camera){
        Object.assign(this, camera);
        this.pos = Victor.fromObject(camera.pos);

        return this;
    }
};