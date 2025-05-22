import { Vector } from '../Vector';
import { Sprite } from './Sprite';
import { Room } from './Room';
import { Instance_Base } from './Instance_Base';
import { CameraSave as CameraSave_L, CameraSaveId } from '@compiled/SaveTypes';

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
    SMART = 'S',
    CENTERED = 'C',
    TILED = 'T',
};

type vec = [number, number];

export type CameraSave = {
    _size: number,
	pos: vec,
	vel: vec,
	moveType: string,
	scrDir: string,
	scrSpeed: number,
	flwObjId: number | '',
	flwType: string,
};

export class Camera{
    private _size: number = 15;
    private _targetInstLastPos = new Vector(0, 0);
    private _smartTarget: Vector | null = null;

    pos: Vector = new Vector(8, 8);
    velocity: Vector = new Vector(0, 0);
    moveType: MOVE_TYPES = MOVE_TYPES.LOCKED;
    scrollDir: SCROLL_DIRS = SCROLL_DIRS.RIGHT;
    scrollSpeed: number = 10;
    followObjId: number | null = null;
    followType: FOLLOW_TYPES = FOLLOW_TYPES.SMART;
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

    toSaveData(): CameraSave {
        return {
            _size: this._size,
            pos: this.pos.toArray(),
            vel: this.velocity.toArray(),
            moveType: this.moveType,
            scrDir: this.scrollDir,
            scrSpeed: this.scrollSpeed,
            flwObjId: this.followObjId ?? '',
            flwType: this.followType,
        };
    }

    static fromSaveData(data: CameraSave_L): Camera {
        return new Camera()._loadSaveData(data);
    }

    private _loadSaveData(data: CameraSave_L): Camera {
        const followObjId = data[CameraSaveId.followObjId];

        this._size = data[CameraSaveId._size];
        this.pos = Vector.fromArray(data[CameraSaveId.pos]);
        this.velocity = Vector.fromArray(data[CameraSaveId.vel]);
        this.moveType = data[CameraSaveId.moveType] as MOVE_TYPES;
        this.scrollDir = data[CameraSaveId.scrollDir] as SCROLL_DIRS;
        this.scrollSpeed = data[CameraSaveId.scrollSpeed];
        this.followObjId = followObjId != '' ? followObjId : null;
        this.followType = data[CameraSaveId.followType] as FOLLOW_TYPES;

        return this;
    }

    private _moveFollow(deltaTime: number, room: Room): void {
        const target = room.instances.find(
            instance => instance.id == this.followObjId
        );

        if (!target) return;

        const targetPos = target.pos.clone().addScalar(8);

        switch(this.followType){
            case FOLLOW_TYPES.SMART:
                this._followSmart(deltaTime, target);
                break;
            case FOLLOW_TYPES.CENTERED:
                this.pos.copy(targetPos);
                break;
            case FOLLOW_TYPES.TILED:
                const width = Sprite.DIMENSIONS * this.size;
                
                if (!this.tiledOrigin){
                    this.tiledOrigin = this.pos.clone();
                }

                this.pos.x = Math.floor((targetPos.x - this.tiledOrigin.x + (width / 2)) / width) * width;
                this.pos.y = Math.floor((targetPos.y - this.tiledOrigin.y + (width / 2)) / width) * width;
                this.pos.x += this.tiledOrigin.x;
                this.pos.y += this.tiledOrigin.y;
        }
    }

    private _moveScroll(deltaTime: number): void {
        const speed = this.scrollSpeed * deltaTime;

        switch(this.scrollDir){
            case SCROLL_DIRS.UP:
                this.pos.y += speed;
                break;
            case SCROLL_DIRS.DOWN:
                this.pos.y -= speed;
                break;
            case SCROLL_DIRS.RIGHT:
                this.pos.x += speed;
                break;
            case SCROLL_DIRS.LEFT:
                this.pos.x -= speed;
                break;
        }
    }

    private _followSmart(deltaTime: number, targetInst: Instance_Base): void {
        const halfDim = Sprite.DIMENSIONS / 2;

        if (!this._smartTarget) {
            this._targetInstLastPos.copy(targetInst.pos);
            this._smartTarget = targetInst.pos.clone().addScalar(halfDim);
            this.pos.copy(this._smartTarget);
        }

        const instVelocity = targetInst.pos.clone().subtract(this._targetInstLastPos);
        const velLength = instVelocity.length();

        //only update target if player has moved
        if (velLength> 0){
            const scale = velLength >= 5 ? 2 : 20; //determine appropriate scale for tiled vs. smooth movement
            const offset = instVelocity.multiplyScalar(scale).clampLength((this.size * Sprite.DIMENSIONS) / 2);

            //remove vertical offset if player is making a platformer
            if (targetInst.applyGravity){
                offset.y = 0;
            }

            const newTargetPos = targetInst.pos.clone().add(offset).addScalar(halfDim);
            this._smartTarget.copy(newTargetPos);
        }

        //move a fraction of a distance to the target
        const pathToTarget = this._smartTarget.clone().subtract(this.pos);
        const distance = pathToTarget.length();

        this.pos.add(pathToTarget.multiplyScalar(deltaTime * distance * 0.2));

        this._targetInstLastPos.copy(targetInst.pos);
    }

    update(deltaTime: number, room: Room, updateMatrixCallback: ()=>void): void {
        this.pos.add(this.velocity.clone().multiplyScalar(deltaTime));

        switch(this.moveType){
            case MOVE_TYPES.LOCKED:
                this.velocity.set(0, 0);
                break;

            case MOVE_TYPES.FOLLOW:
                this._moveFollow(deltaTime, room);
                break;
            
            case MOVE_TYPES.SCROLL:
                this._moveScroll(deltaTime);
                break;
        }

        updateMatrixCallback();
    }

    copyCameraSettings(camera: Camera): void {
        Object.assign(this, camera);
        this._smartTarget = null;
    }
};