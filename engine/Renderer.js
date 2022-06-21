import Transition from "./Transition";

export default class Renderer{
    static get SCREEN_RES(){return 240}

    constructor(canvas){
        this.canvas = canvas;
        this.room = null;
        this._spriteCache = {};
        this._scaleFac = null;
        this._transition = new Transition(this.canvas);
    }

    get isTransitioning(){return this._transition.active}

    setRoom = (room)=>{
        this.room = room;
        this._spriteCache = {};
    }

    startTransition = (type, duration, switchCallback = null, completeCallback = null)=>{
        this._transition.start(type, duration, switchCallback, completeCallback);
    }

    render = (deltaTime)=>{
        if (!this.room){
            console.error('Cannot render scene without room being set');
            return;
        }

        const ctx = this.canvas.getContext('2d');

        this._scaleFac = this.canvas.width / Renderer.SCREEN_RES;

        //draw background
        ctx.fillStyle = this.room.bgColor;
        ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        this._drawInstances(deltaTime);
        this._transition.render(deltaTime);
    }

    _drawInstances = (deltaTime)=>{
        const ctx = this.canvas.getContext('2d');
        const {camera, instances} = this.room;
        const scale = (1 / camera.size) * this._scaleFac;

        ctx.imageSmoothingEnabled = false;
        ctx.webkitImageSmoothingEnabled = false;

        //camera transform
        ctx.translate(
            (this.canvas.width / 2) + (-camera.pos.x * scale),
            (this.canvas.height / 2) + (-camera.pos.y * scale)
        );
        ctx.scale(scale, scale);

        instances.zSort.forEach((instance)=>{
            if (instance.sprite){
                const cacheGrab = this._spriteCache[instance.sprite.id];
                let sprite = cacheGrab;
                let curFrame;

                if (!cacheGrab){
                    sprite = instance.sprite.drawAllFrames()
                    this._spriteCache[instance.sprite.id] = sprite;
                }

                curFrame = sprite[instance.animFrame];
                ctx.drawImage(curFrame, instance.pos.x, instance.pos.y);
                instance.advanceAnimation(deltaTime);
            }
        });

        ctx.resetTransform();
    }
}