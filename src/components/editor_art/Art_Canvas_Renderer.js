import Victor from 'victor';
import {drawCheckerBG, drawPixelData} from '@/common/Draw_2D';
import {getSpriteDimensions} from '@/common/Util_2D';

class Art_Canvas_Renderer{
    constructor(element, spriteData, previewData, navState){
        this.canvas = element;
        this.checkerBGBuff = document.createElement("canvas");
        this.checkerStencilBuff = document.createElement("canvas");
        this.pixelBuff = document.createElement("canvas");
        this.gridBuff = document.createElement("canvas");
        this.previewBuff = document.createElement("canvas");
        this.spriteData = spriteData;
        this.previewData = previewData;
        this.navState = navState;

        this.GRID_DIV = getSpriteDimensions(spriteData);
        this.CANVAS_WIDTH = this.GRID_DIV * 20;

        Object.defineProperty(this, "GRID_DIV", {configurable: false, writable: false});
        Object.defineProperty(this, "CANVAS_WIDTH", {configurable: false, writable: false});

        this.pixelBuff.width = this.GRID_DIV;
        this.pixelBuff.height = this.GRID_DIV;
        this.previewBuff.width = this.GRID_DIV;
        this.previewBuff.height = this.GRID_DIV;

        this.resize();
    }

    fullRedraw(){
        let ctx = this.canvas.getContext("2d");

        this.drawCheckerBG();
        this.drawBGStencil();
        this.drawSpriteData();
        this.drawGrid();
        this.drawPreviewBuffer();

        this.composite(ctx);
    }

    composite(ctx = this.canvas.getContext("2d")){
        const HALF_CANVAS = this.CANVAS_WIDTH / 2;

        let scaleFac = (this.CANVAS_WIDTH / this.GRID_DIV) * this.navState.zoomFac;

        ctx.drawImage(this.checkerBGBuff, 0, 0, this.checkerBGBuff.width, this.checkerBGBuff.height);

        //draw pixel and preview buffers
        ctx.imageSmoothingEnabled = false;
        ctx.webkitImageSmoothingEnabled = false;

        ctx.translate(
            (this.canvas.width / 2) + (this.navState.offset.x * this.navState.zoomFac),
            (this.canvas.height / 2) + (this.navState.offset.y * this.navState.zoomFac)
        );
        ctx.translate(
            -HALF_CANVAS * this.navState.zoomFac, -HALF_CANVAS * this.navState.zoomFac
        )
        ctx.scale(scaleFac, scaleFac);

        ctx.drawImage(this.pixelBuff, 0, 0, this.pixelBuff.width, this.pixelBuff.height);
        ctx.drawImage(this.previewBuff, 0, 0, this.previewBuff.width, this.previewBuff.height);

        ctx.resetTransform();

        ctx.drawImage(this.gridBuff, 0, 0, this.gridBuff.width, this.gridBuff.height);
        ctx.drawImage(this.checkerStencilBuff, 0, 0, this.checkerStencilBuff.width, this.checkerStencilBuff.height);
    }

    resize(width = this.canvas.width, height = this.canvas.height){
        this.checkerBGBuff.width = width;
        this.checkerBGBuff.height = height;
        this.checkerStencilBuff.width = width;
        this.checkerStencilBuff.height = height;
        this.gridBuff.width = width;
        this.gridBuff.height = height;

        this.fullRedraw();
    }

    navChanged(){        
        this.drawBGStencil();
        this.drawSpriteData();
        this.drawGrid();
        this.drawPreviewBuffer();
        
        this.composite();
    }

    setSprite(newSprite, navRef){
        this.spriteData = newSprite;
        this.navState = navRef;

        this.fullRedraw();
    }

    mouseDown(){
        this.drawSpriteData();
        this.drawPreviewBuffer();
        this.composite();
    }

    mouseUp(){
        this.drawSpriteData();
        this.drawPreviewBuffer();
        this.composite();
    }

    mouseMove(){
        this.drawSpriteData();
        this.drawPreviewBuffer();
        this.composite();
    }

    drawCheckerBG(canvas = this.checkerBGBuff){
        drawCheckerBG(canvas, 10, "#AAA", "#CCC");
    }

    drawBGStencil(ctx = this.checkerStencilBuff.getContext('2d')){
        const HALF_WIDTH = this.CANVAS_WIDTH / 2;
        ctx.fillStyle = "white";
        ctx.fillRect(0, 0, this.checkerStencilBuff.width, this.checkerStencilBuff.height);
        ctx.translate(
            (this.canvas.width / 2) + (this.navState.offset.x * this.navState.zoomFac),
            (this.canvas.height / 2) + (this.navState.offset.y * this.navState.zoomFac)
        );
        ctx.clearRect(
            -HALF_WIDTH * this.navState.zoomFac,
            -HALF_WIDTH * this.navState.zoomFac,
            this.CANVAS_WIDTH * this.navState.zoomFac,
            this.CANVAS_WIDTH * this.navState.zoomFac
        );
        ctx.resetTransform();

        //remove after debugging
        ctx.fillStyle = "black";
        ctx.fillRect(0, 0, 10, 10);
        ctx.fillRect(canvas.width - 10, canvas.height - 10, 10, 10);
    }

    drawPixelData(canvas, pixelData){
        if (pixelData){
            let ctx = canvas.getContext('2d');

            ctx.clearRect(0, 0, canvas.width, canvas.height);
            drawPixelData(canvas, pixelData);
        }
    }

    drawSpriteData(canvas = this.pixelBuff){
        this.drawPixelData(canvas, this.spriteData);
    }
 
    drawGrid(ctx = this.gridBuff.getContext("2d")){
        const PIXEL_SIZE = Math.round(this.CANVAS_WIDTH / this.GRID_DIV);
        const HALF_CANVAS = this.CANVAS_WIDTH / 2;

        ctx.clearRect(0, 0, this.gridBuff.width, this.gridBuff.height);

        ctx.translate(
            (this.canvas.width / 2) + (this.navState.offset.x * this.navState.zoomFac),
            (this.canvas.height / 2) + (this.navState.offset.y * this.navState.zoomFac)
        );
        ctx.scale(this.navState.zoomFac, this.navState.zoomFac);

        //draw grid
        ctx.strokeStyle = "black";
        ctx.lineWidth = 1;
        ctx.beginPath();
        for (let i = 1; i < this.GRID_DIV; i++) {
            let curLine = i * PIXEL_SIZE;
            let pos = new Victor(curLine, curLine);

            pos.subtractScalar(HALF_CANVAS);

            ctx.moveTo(pos.x, -HALF_CANVAS);
            ctx.lineTo(pos.x, HALF_CANVAS);
            ctx.moveTo(-HALF_CANVAS, pos.y);
            ctx.lineTo(HALF_CANVAS, pos.y);
        }

        ctx.resetTransform();
        ctx.stroke();
    }

    drawPreviewBuffer(canvas = this.previewBuff){
        this.drawPixelData(canvas, this.previewData);
    }
}

export default Art_Canvas_Renderer;