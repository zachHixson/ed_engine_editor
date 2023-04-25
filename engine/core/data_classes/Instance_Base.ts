import { INSTANCE_TYPE } from "../Enums";
import { Vector } from "../Vector";
import { Node_Enums } from "../core";
import { Draw } from "../core";
import { Sprite } from "../core";
import { Util } from "../core";

export interface iInstanceBaseSaveData {
    id: number;
    name: string;
    type: string;
    pos: { x: number, y: number };
    groups: string[];
    strtFrm: number | '';
    fps: number | '';
    loop: 0 | 1 | 2;
    play: 0 | 1 | 2;
}

export interface iCollisionEvent {
    type: Node_Enums.COLLISION_EVENT,
    instance: Instance_Base,
}

export abstract class Instance_Base{
    private _animProgress: number = 0;

    id: number;
    name: string;
    pos: Vector;
    groups: string[] = [];
    depthOffset: number = 0;
    depthOverride: number | null = null;
    needsRenderUpdate = false;
    startFrameOverride: number | null = null;
    fpsOverride: number | null = null;
    animLoopOverride: boolean | null = null;
    animPlayingOverride: boolean | null = null;
    backAnim = 1;

    constructor(id: number, pos: Vector = new Vector()){
        this.id = id;
        this.name = this.id.toString();
        this.pos = pos;
    }

    //Basic data getters
    abstract get TYPE(): INSTANCE_TYPE;
    abstract get sourceId(): number | string;
    abstract clone(): Instance_Base;
    abstract toSaveData(): any;
    abstract needsPurge(assetMap: Map<number, any>): boolean;

    //Rendering getters
    get sprite(): Sprite | null {return null};
    get renderable(){return false};
    get hasEditorFrame(){return false};
    get startFrame(){return 0};
    get fps(){return 0};
    get animLoop(){return false};
    get animPlaying(){return false};
    get userDepth(){return 0};
    get zDepth(){return 0};
    set zDepth(val){};
    get zDepthOverride(){return 0};
    set zDepthOverride(val: number | null){};
    abstract get frameDataId(): number | string;
    abstract get frameData(): Array<ImageData>;

    get hasCollisionEvent(){return false};

    get animFrame(){
        if (!this.sprite){
            return 0;
        }

        return Math.floor(this._animProgress * this.sprite.frames.length);
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
    onUpdate(deltaTime: number): void {}
    onCollision(event: iCollisionEvent): void {}
    onDestroy(): void {}

    advanceAnimation(deltaTime: number): void {
        if (!this.sprite) return;

        if (this.animPlaying){
            const oldProgress = this._animProgress;
            const dt = 1000 * deltaTime;
            const frameDuration = 1000 / this.fps;
            const animDuration = frameDuration * this.sprite.frames.length;
            const curProgress = (this._animProgress * animDuration + dt) / animDuration;
            this._animProgress = curProgress;

            if (this.animLoop){
                this._animProgress = Util.mod(this._animProgress, 1);
            }
            else{
                this._animProgress = Math.max(Math.min(this._animProgress, 1), 0);
            }
            
            if (this._animProgress != oldProgress){
                this.needsRenderUpdate = true;
            }
        }
    }

    setPosition(newPos: Vector): void {
        this.pos.copy(newPos);
    }

    loadBaseSaveData(data: iInstanceBaseSaveData): void {
        this.id = data.id;
        this.name = data.name;
        this.pos = Vector.fromObject(data.pos);
        this.groups = data.groups;
        this.startFrameOverride = data.strtFrm === '' ? null : data.strtFrm;
        this.fpsOverride = data.fps === '' ? null : data.fps;
        this.animLoopOverride = data.loop === 0 ? null : !!(data.loop - 1);
        this.animPlayingOverride = data.play === 0 ? null : !!(data.play - 1);

        this.animFrame = this.startFrame;
    }

    getBaseSaveData(): iInstanceBaseSaveData {
        return {
            id: this.id,
            name: this.name,
            type: this.TYPE,
            pos: this.pos.toObject(),
            groups: this.groups,
            strtFrm: this.startFrameOverride ?? '',
            fps: this.fpsOverride ?? '',
            loop: this.animLoopOverride === null ? 0 : +this.animLoopOverride + 1 as (1 | 2),
            play: this.animPlayingOverride === null ? 0 : +this.animPlayingOverride + 1 as (1 | 2),
        } satisfies iInstanceBaseSaveData;
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
}