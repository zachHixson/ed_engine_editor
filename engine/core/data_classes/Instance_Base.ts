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
    startFrame: number | '';
    fps: number | '';
    animLoop: 0 | 1 | '';
    animPlaying: 0 | 1 | '';
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
    needsRenderUpdate = false;
    startFrameOverride: number | null = null;
    fpsOverride: number | null = null;
    animLoopOverride: boolean | null = null;
    animPlayingOverride: boolean | null = null;

    constructor(id: number, pos: Vector = new Vector()){
        this.id = id;
        this.name = this.id.toString();
        this.pos = pos;
    }

    //Basic data getters
    abstract get TYPE(): INSTANCE_TYPE;
    abstract clone(): any;
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
    abstract get frameDataId(): number | string;
    abstract get frameData(): Array<ImageData>;

    get hasCollisionEvent(){return false};

    get animFrame(){
        const frame = Math.floor(this._animProgress * this.fps);

        if (!this.sprite){
            return 0;
        }

        if (this.animLoop){
            return Util.mod(frame, this.sprite.frames.length);
        }
        else{
            return Math.max(Math.min(frame, this.sprite.frames.length - 1), 0);
        }
    }
    set animFrame(val: number){
        if (!this.sprite){
            return;
        }
        
        const frame = Math.min(Math.max(val, 0), this.sprite.frames.length - 1);
        const animDur = Math.floor(this.sprite.frames.length * this.fps) * 1000;
        this._animProgress = Math.floor(frame / this.sprite.frames.length * animDur);
    }

    //Lifecycle events
    onCreate(): void {}
    onUpdate(deltaTime: number): void {}
    onCollision(event: iCollisionEvent): void {}
    onDestroy(): void {}

    advanceAnimation(deltaTime: number): void {
        if (this.animPlaying){
            this._animProgress += deltaTime;
            this.needsRenderUpdate = true;
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
        this.startFrameOverride = data.startFrame === '' ? null : data.startFrame;
        this.fpsOverride = data.fps === '' ? null : data.fps;
        this.animLoopOverride = data.animLoop === '' ? null : !!data.animLoop;
        this.animPlayingOverride = data.animPlaying === '' ? null : !!data.animPlaying;

        this.animFrame = this.startFrame;
    }

    getBaseSaveData(): iInstanceBaseSaveData {
        return {
            id: this.id,
            name: this.name,
            type: this.TYPE,
            pos: this.pos.toObject(),
            groups: this.groups,
            startFrame: this.startFrameOverride ?? '',
            fps: this.fpsOverride ?? '',
            animLoop: this.animLoopOverride === null ? '' : +this.animLoopOverride as (0 | 1),
            animPlaying: this.animPlayingOverride === null ? '' : +this.animPlayingOverride as (0 | 1),
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