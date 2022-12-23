import { Vector } from "../Vector";
import { iAnyObj } from "../interfaces";

enum MOVE_TYPES {
    LOCKED = 'L',
    FOLLOW = 'F',
    SCROLL = 'S',
}

enum SCROLL_DIRS {
    UP = 'U',
    DOWN = 'D',
    RIGHT = 'R',
    LEFT = 'L',
};

enum FOLLOW_TYPES {
    SMOOTH = 'S',
    TILED = 'T',
};

export class Camera{
    private _size: number = 1;

    pos: Vector = new Vector(8, -8);
    velocity: Vector = new Vector(0, 0);
    moveType: MOVE_TYPES = MOVE_TYPES.LOCKED;
    scrollDir: SCROLL_DIRS = SCROLL_DIRS.RIGHT;
    scrollSpeed: number = 10;
    followObjId: number | null = null;
    followType: FOLLOW_TYPES = FOLLOW_TYPES.SMOOTH;
    tiledOrigin: Vector | null = null;

    static get MOVE_TYPES() {return MOVE_TYPES};
    static get SCROLL_DIRS(){return SCROLL_DIRS};
    static get FOLLOW_TYPES() {return FOLLOW_TYPES};

    get size(){return this._size};

    set size(newSize){this._size = Math.max(newSize, 0.5)}

    clone(): Camera {
        const clone = Object.assign(new Camera(), this);
        clone.pos = this.pos.clone();
        return clone;
    }

    fromSaveData(camera: iAnyObj){
        Object.assign(this, camera);
        this.pos = Vector.fromObject(camera.pos);
        this.velocity = Vector.fromObject(camera.velocity);

        return this;
    }
};