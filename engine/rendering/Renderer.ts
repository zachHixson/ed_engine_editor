import { Room } from "@engine/core/core_filemap";
import Transition from "./Transition";

export default class Renderer{
    static get SCREEN_RES(){return 240}

    private _spriteCache: Map<number, HTMLCanvasElement[]> = new Map();
    private _scaleFac: number = 1;
    private _transition: Transition;

    canvas: HTMLCanvasElement;
    room: Room | null = null;

    constructor(canvas: HTMLCanvasElement){
        this.canvas = canvas;
        this._transition = new Transition(this.canvas);
    }

    get isTransitioning(){return this._transition.active}

    setRoom = (room: Room): void =>{
        this.room = room;
        this._spriteCache = new Map();
    }

    startTransition = (type: any, duration: number, switchCallback: ()=>void, completeCallback?: ()=>void): void =>{
        this._transition.start(type, duration, switchCallback, completeCallback ?? (()=>{}));
    }

    render = (deltaTime: number): void =>{
        if (!this.room){
            console.error('Cannot render scene without room being set');
            return;
        }

        const ctx = this.canvas.getContext('2d')!;

        this._scaleFac = this.canvas.width / Renderer.SCREEN_RES;

        //draw background
        ctx.fillStyle = this.room.bgColor.toHex();
        ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        this._drawInstances(deltaTime);
        this._transition.render(deltaTime);
    }

    _drawInstances = (deltaTime: number): void =>{
        const ctx = this.canvas.getContext('2d')!;
        const {camera, instances} = this.room!;
        const scale = (1 / camera.size) * this._scaleFac;

        ctx.imageSmoothingEnabled = false;

        //camera transform
        ctx.translate(
            (this.canvas.width / 2) + (-camera.pos.x * scale),
            (this.canvas.height / 2) + (-camera.pos.y * scale)
        );
        ctx.scale(scale, scale);

        instances.forEach(instance => {
            if (instance.sprite){
                const cacheGrab = this._spriteCache.get(instance.sprite.id);
                let sprite = cacheGrab;
                let curFrame;

                if (!sprite){
                    sprite = instance.sprite.drawAllFrames();
                    this._spriteCache.set(instance.sprite.id, sprite);
                }

                curFrame = sprite[instance.animFrame];
                ctx.drawImage(curFrame, instance.pos.x, instance.pos.y);
                instance.advanceAnimation(deltaTime);
            }
        });

        ctx.resetTransform();
    }
}