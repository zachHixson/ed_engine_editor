import { INSTANCE_TYPE } from '../Enums';
import { Vector } from '../Vector';
import { Draw } from '../core';
import { Sprite, Util, Node_Enums } from '../core';
import { InstanceBaseSave, InstanceBaseSaveId } from '@compiled/SaveTypes';
import type Engine from '@engine/Engine';

export enum InstanceAnimEvent {
    START = 1,
    STOP,
    TICK,
    FINISHED,
}

export interface iCollisionEvent {
    type: Node_Enums.COLLISION_EVENT,
    instance: Instance_Base,
    normal?: Vector,
}

export abstract class Instance_Base{
    private _animProgress: number = 0;
    private _engine: Engine | null = null;
    private _physForce: Vector = new Vector(0, 0);
    private _cachedTotalVelocity = new Vector(0, 0);

    protected _sprite: Sprite | null = null;
    protected _onGround: boolean = false;
    protected _zDepthOverride: number | null = null;

    id: number;
    name: string;
    pos: Vector;
    lastPos: Vector = new Vector();
    velocity: Vector = new Vector(0, 0);
    moveVector: Vector = new Vector(0, 0);
    groups: string[] = [];
    depthOffset: number = 0;
    needsRenderUpdate = false;
    startFrameOverride: number | null = null;
    fpsOverride: number | null = null;
    animLoopOverride: boolean | null = null;
    animPlayingOverride: boolean | null = null;
    flipH: boolean = false;
    flipV: boolean = false;
    backAnim = 1;

    constructor(id: number, pos: Readonly<Vector> = new Vector()){
        this.id = id;
        this.name = this.id.toString();
        this.pos = pos.clone();
    }

    //Basic data getters
    abstract get TYPE(): INSTANCE_TYPE;
    abstract get sourceId(): number | string;
    abstract clone(): Instance_Base;
    abstract toSaveData(): any;
    abstract needsPurge(assetMap: Map<number, any>): boolean;

    //Rendering getters
    get sprite(){return this._sprite};
    set sprite(newSprite: Sprite | null){this._sprite = newSprite};
    get renderable(){return !!this.sprite};
    get hasEditorFrame(){return false};
    get startFrame(){return 0};
    get fps(){return 0};
    get animLoop(){return false};
    get animPlaying(){return false};
    set animPlaying(playing: boolean){
        if (playing == this.animPlayingOverride) return;
        this.animPlayingOverride = playing;
        this.onAnimationChange(this.animPlayingOverride ? InstanceAnimEvent.START : InstanceAnimEvent.STOP);
    };
    get userDepth(){return this._zDepthOverride ?? 0};
    get zDepth(){return (this.userDepth / 100) + this.depthOffset};
    get zDepthOverride(){return this._zDepthOverride}
    set zDepthOverride(newDepth: number | null){
        if (newDepth == null){
            this._zDepthOverride = null;
        }
        else{
            this._zDepthOverride = Math.max(Math.min(newDepth, 99), -99);
        }
    }

    //Logic Getters
    get isSolid(){return false};
    set isSolid(newVal: boolean){};
    get onGround(){return this._onGround};
    get applyGravity(){return false};
    set applyGravity(newVal: boolean){};
    get totalVelocity(){return this._cachedTotalVelocity as Readonly<Vector>};
    abstract get frameDataId(): number | string;
    abstract get frameData(): Array<ImageData>;

    get hasCollisionEvent(){return false};
    get triggerExits(){return false};

    get animFrame(){
        if (!this.sprite){
            return 0;
        }

        const frame = Math.floor(this._animProgress * this.sprite.frames.length);

        return Math.min(frame, this.sprite.frames.length - 1);
    }
    set animFrame(val: number){
        if (!this.sprite){
            return;
        }

        const negOffset = +(Math.sign(this.fps) < 0);
        const frame = Math.min(Math.max(val, 0), this.sprite.frames.length - 1);
        this._animProgress = (frame + negOffset) / this.sprite.frames.length;
    }

    //Lifecycle events
    onCreate(): void {}
    onUpdate(deltaTime: number, resetOnGround = true): void {
        const isStatic = this.velocity.lengthNoSqrt() == 0 && this.moveVector.lengthNoSqrt() == 0 && !this.applyGravity;

        if (isStatic) return;

        if (this.applyGravity){
            this._physForce.y -= this._engine!.room.gravity;
        }

        const moveFunc = this.isSolid ? this._engine!.moveAndSlide : this._engine!.translateInstance;
        const vel = this._cachedTotalVelocity.copy(this.velocity)
            .add(this.moveVector)
            .add(this._physForce);

        moveFunc(this, vel);

        this.moveVector.set(0, 0);

        if (resetOnGround){
            this._onGround = false;
        }
    }
    onAnimationChange(state: InstanceAnimEvent): void {}
    onCollision(event: iCollisionEvent): void {
        if (!this.isSolid) return;

        if (event.normal && event.type != Node_Enums.COLLISION_EVENT.STOP){
            this._onGround ||= event.normal.y > 0;
            
            //Arrest velocity in direction of collision
            if (-Math.sign(event.normal.x) == Math.sign(this._physForce.x)){
                this._physForce.x = 0;
            }

            if (-Math.sign(event.normal.y) == Math.sign(this._physForce.y)){
                this._physForce.y = 0;
            }

            //Apply friction
            if (event.normal.y > 0){
                this._physForce.x *= 0.9;
            }
        }
    }
    onDestroy(): void {}

    setEngine(engine: Engine): void {
        this._engine = engine;
    }

    advanceAnimation(deltaTime: number): void {
        if (!this.sprite) return;

        if (this.animPlaying){
            const oldFrame = this.animFrame;
            const oldProgress = this._animProgress;
            const dt = 1000 * deltaTime;
            const frameDuration = 1000 / this.fps;
            const animDuration = frameDuration * this.sprite.frames.length;
            const curProgress = (this._animProgress * animDuration + dt) / animDuration;
            this._animProgress = curProgress;
            let newFrame: number;
            let hasLooped: boolean;
            let hasFinished: boolean;

            if (this.animLoop){
                this._animProgress = Util.mod(this._animProgress, 1);
            }
            else{
                this._animProgress = Math.max(Math.min(this._animProgress, 1), 0);
            }

            newFrame = this.animFrame;
            hasLooped = this.animLoop && (
                (this.fps >= 0 && newFrame < oldFrame) ||
                (this.fps < 0 && newFrame > oldFrame)
            );
            hasFinished = hasLooped || (
                (this._animProgress != oldProgress) &&
                (this._animProgress == (Math.sign(this.fps) + 1) / 2)
            )
            
            if (newFrame != oldFrame){
                this.needsRenderUpdate = true;
                this.onAnimationChange(InstanceAnimEvent.TICK);
            }

            if (hasFinished){
                this.onAnimationChange(InstanceAnimEvent.FINISHED);
            }
        }
    }

    setPosition(newPos: Readonly<Vector>): void {
        this.lastPos.copy(this.pos);
        this.pos.copy(newPos);
    }

    loadBaseSaveData(data: [...InstanceBaseSave, ...any[]]): void {
        this.id = data[InstanceBaseSaveId.id];
        this.name = data[InstanceBaseSaveId.name];
        this.pos = Vector.fromArray(data[InstanceBaseSaveId.pos]);
        this._zDepthOverride = data[InstanceBaseSaveId.zDepthOverride] != '' ? data[InstanceBaseSaveId.zDepthOverride] : null;
        this.groups = data[InstanceBaseSaveId.groups];
        this.startFrameOverride = data[InstanceBaseSaveId.startFrameOverride] === '' ? null : data[InstanceBaseSaveId.startFrameOverride];
        this.fpsOverride = data[InstanceBaseSaveId.fpsOverride] === '' ? null : data[InstanceBaseSaveId.fpsOverride];
        this.animLoopOverride = data[InstanceBaseSaveId.animLoopOverride] === 0 ? null : !!(data[InstanceBaseSaveId.animLoopOverride] - 1);
        this.animPlayingOverride = data[InstanceBaseSaveId.animPlayingOverride] === 0 ? null : !!(data[InstanceBaseSaveId.animPlayingOverride] - 1);

        this.animFrame = this.startFrame;
    }

    getBaseSaveData(): InstanceBaseSave {
        return [
            this.id,
            this.name,
            this.TYPE,
            this.pos.toArray(),
            this._zDepthOverride ?? '',
            this.groups,
            this.startFrameOverride ?? '',
            this.fpsOverride ?? '',
            this.animLoopOverride === null ? 0 : +this.animLoopOverride + 1 as (1 | 2),
            this.animPlayingOverride === null ? 0 : +this.animPlayingOverride + 1 as (1 | 2),
        ];
    }

    drawThumbnail(canvas: HTMLCanvasElement): void {
        const ctx = canvas.getContext('2d')!;
        let imageCanvas: HTMLCanvasElement;
        let startFame = 0;
        let imageData: ImageData;
        let scaleFac: number;

        if (this.hasEditorFrame){
            ctx.imageSmoothingEnabled = false;
            startFame = this.startFrame;
        }

        imageData = this.frameData[startFame];
        imageCanvas = Draw.createCanvas(imageData.width, imageData.height);
        scaleFac = canvas.width / imageData.width;

        imageCanvas.getContext('2d')!.putImageData(imageData, 0, 0);

        ctx.scale(scaleFac, scaleFac);
        ctx.drawImage(imageCanvas, 0, 0);
    }

    isInGroup(group: string): boolean {
        return !!this.groups.find(g => g == group);
    }

    applyForce(force: Vector): void {
        this._physForce.add(force);
    }
}