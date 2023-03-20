import { Vector } from "../Vector";
import { iAnyObj } from "../interfaces";

export interface iCameraSaveData {
    _size: number,
    pos: { x: number, y: number },
    velocity: { x: number, y: number },
    moveType: MOVE_TYPES,
    scrollDir: SCROLL_DIRS;
    scrollSpeed: number;
    followObjId: number | null;
    followType: FOLLOW_TYPES;
    tiledOrigin: Vector | null;
}

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
    private _size: number = 15;

    pos: Vector = new Vector(8, 8);
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

    toSaveData(): iCameraSaveData {
        return {
            _size: this._size,
            pos: this.pos.toObject(),
            velocity: this.velocity.toObject(),
            moveType: this.moveType,
            scrollDir: this.scrollDir,
            scrollSpeed: this.scrollSpeed,
            followObjId: this.followObjId,
            followType: this.followType,
            tiledOrigin: this.tiledOrigin,
        };
    }

    static fromSaveData(data: iCameraSaveData): Camera {
        return new Camera()._loadSaveData(data);
    }

    private _loadSaveData(data: iCameraSaveData): Camera {
        this.pos = Vector.fromObject(data.pos);
        this.velocity = Vector.fromObject(data.velocity);
        this.moveType = data.moveType;
        this.scrollDir = data.scrollDir;
        this.scrollSpeed = data.scrollSpeed;
        this.followObjId = data.followObjId;
        this.followType = data.followType;
        this.tiledOrigin = data.tiledOrigin;

        return this;
    }
};