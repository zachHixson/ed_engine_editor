export default class Renderer{
    constructor(canvas){
        this.canvas = canvas;
        this.room = null;
        this._spriteCache = {};
    }

    setRoom(room){
        this.room = room;
        this._spriteCache = {};
    }

    render(){
        if (!this.room){
            console.error('Cannot render scene without room being set');
            return;
        }

        const ctx = this.canvas.getContext('2d');

        //draw background
        ctx.fillStyle = this.room.bgColor;
        ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        this._drawInstances();
    }

    _drawInstances(){
        const ctx = this.canvas.getContext('2d');
        const {camera, instances} = this.room;

        //move to camera
        ctx.translate(
            (this.canvas.width / 2) + camera.pos.x,
            (this.canvas.height / 2) + camera.pos.y
        );

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
            }
        });

        ctx.resetTransform();
    }
}