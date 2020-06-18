import store from '@/store/index';
import Victor from 'victor';

const GRID_DIV = 16;
const CANVAS_OFFSET = 5;
const CANVAS_WIDTH = GRID_DIV * 20;

class Art_Canvas{
    constructor(element){
        this.canvas = element;
        this.checkerBGBuff = document.createElement("canvas");
        this.checkerStencilBuff = document.createElement("canvas");
        this.pixelBuff = document.createElement("canvas");
        this.overlayBuff = document.createElement("canvas");
        this.pixelData = store.getters['GameData/getRandomSprite'];
        this.offset = new Victor(0, 0);
        this.zoomFac = 1;
    }

    setup(){
        this.resize();
        this.update();
    }

    update(){
        let ctx = this.canvas.getContext("2d");

        this.drawBGStencil();
        this.drawSpriteData();
        this.drawOverlay();

        ctx.drawImage(this.checkerBGBuff, 0, 0, this.checkerBGBuff.width, this.checkerBGBuff.height);
        ctx.drawImage(this.checkerStencilBuff, 0, 0, this.checkerStencilBuff.width, this.checkerStencilBuff.height);
        ctx.drawImage(this.pixelBuff, 0, 0, this.pixelBuff.width, this.pixelBuff.height);
        ctx.drawImage(this.overlayBuff, 0, 0, this.overlayBuff.width, this.overlayBuff.height);
    }

    resize(width = this.canvas.width, height = this.canvas.height){
        this.checkerBGBuff.width = width;
        this.checkerBGBuff.height = height;
        this.checkerStencilBuff.width = width;
        this.checkerStencilBuff.height = height;
        this.pixelBuff.width = width;
        this.pixelBuff.height = height;
        this.overlayBuff.width = width;
        this.overlayBuff.height = height;

        this.drawCheckerBG();
    }

    navChanged({rawOffset, zoomFac}){
        this.offset = rawOffset.clone();
        this.zoomFac = zoomFac;
        
        this.drawBGStencil();
        this.drawSpriteData();
        this.drawOverlay();
    }

    drawCheckerBG(ctx = this.checkerBGBuff.getContext('2d')){
        const CHECKER_SIZE = 10;
        const LIGHT = "#AAA";
        const DARK = "#CCC";

        let xCount = Math.ceil(this.checkerBGBuff.width / CHECKER_SIZE);
        let yCount = Math.ceil(this.checkerBGBuff.height / CHECKER_SIZE);

        if (xCount % 2 == 0){
            xCount += 1;
        }

        for (let x = 0; x < xCount; x++){
            for (let y = 0; y < yCount; y++){
                let curIdx = this.get2DIdx(x, y, xCount);
                ctx.fillStyle = (curIdx % 2) ? LIGHT : DARK;
                ctx.fillRect(
                    x * CHECKER_SIZE,
                    y * CHECKER_SIZE,
                    CHECKER_SIZE,
                    CHECKER_SIZE
                );
            }
        }
    }

    drawBGStencil(ctx = this.checkerStencilBuff.getContext('2d')){
        const HALF_WIDTH = CANVAS_WIDTH / 2;
        ctx.fillStyle = "white";
        ctx.fillRect(0, 0, this.checkerStencilBuff.width, this.checkerStencilBuff.height);
        ctx.save();
        ctx.translate(
            (this.canvas.width / 2) + (this.offset.x * this.zoomFac),
            (this.canvas.height / 2) + (this.offset.y * this.zoomFac)
        );
        ctx.clearRect(
            -HALF_WIDTH * this.zoomFac,
            -HALF_WIDTH * this.zoomFac,
            CANVAS_WIDTH * this.zoomFac,
            CANVAS_WIDTH * this.zoomFac
        );
        ctx.restore();
    }

    drawSpriteData(ctx = this.pixelBuff.getContext("2d")){
        const PIXEL_WIDTH = Math.round(CANVAS_WIDTH / GRID_DIV);
        const HALF_CANVAS = CANVAS_WIDTH / 2;

        ctx.clearRect(0, 0, this.pixelBuff.width, this.pixelBuff.height);

        ctx.save();
        ctx.translate(
            (this.canvas.width / 2) + (this.offset.x * this.zoomFac),
            (this.canvas.height / 2) + (this.offset.y * this.zoomFac)
        );
        ctx.scale(this.zoomFac, this.zoomFac);

        for (let x = 0; x < GRID_DIV; x++){
            for (let y = 0; y < GRID_DIV; y++){
                let curPixel = this.pixelData[this.get2DIdx(x, y, GRID_DIV)];

                if (curPixel.length > 0){
                    ctx.fillStyle = curPixel;
                    ctx.fillRect(
                        (x * PIXEL_WIDTH) - HALF_CANVAS,
                        (y * PIXEL_WIDTH) - HALF_CANVAS,
                        PIXEL_WIDTH,
                        PIXEL_WIDTH
                    );
                }
            }
        }

        ctx.restore();
    }

    drawOverlay(ctx = this.overlayBuff.getContext("2d")){
        const PIXEL_SIZE = Math.round(CANVAS_WIDTH / GRID_DIV);
        const HALF_CANVAS = CANVAS_WIDTH / 2;

        ctx.clearRect(0, 0, this.overlayBuff.width, this.overlayBuff.height);

        ctx.save();
        ctx.translate(
            (this.canvas.width / 2) + (this.offset.x * this.zoomFac),
            (this.canvas.height / 2) + (this.offset.y * this.zoomFac)
        );
        ctx.scale(this.zoomFac, this.zoomFac);

        //draw grid
        ctx.strokeStyle = "black";
        ctx.lineWidth = 2;
        ctx.beginPath();
        for (let i = 1; i < GRID_DIV; i++){
            let curLine = i * PIXEL_SIZE;
            let pos = new Victor(curLine, curLine);

            pos.subtract(new Victor(HALF_CANVAS, HALF_CANVAS));

            ctx.moveTo(pos.x, -HALF_CANVAS);
            ctx.lineTo(pos.x, HALF_CANVAS);
            ctx.moveTo(-HALF_CANVAS, pos.y);
            ctx.lineTo(HALF_CANVAS, pos.y);
        }
        
        ctx.restore();
        ctx.stroke();
    }

    get2DIdx(x, y, width){
        return (y * width) + x;
    }

    getViewTransform(x, y){
        //
    }

    getViewBounds(){
        return [-500, -500, 500, 500];
    }

    getContentsBounds(){
        return [0, 0, CANVAS_WIDTH, CANVAS_WIDTH];
    }
}

export default Art_Canvas;