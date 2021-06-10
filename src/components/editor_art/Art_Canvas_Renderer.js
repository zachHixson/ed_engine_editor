import Victor from 'victor';
import {drawCheckerBG, drawPixelData} from '@/common/Draw_2D';

const GRID_DIV = 16;
const CANVAS_WIDTH = GRID_DIV * 20;

class Art_Canvas_Renderer{
    constructor(element, spriteData){
        this.canvas = element;
        this.checkerBGBuff = document.createElement("canvas");
        this.checkerStencilBuff = document.createElement("canvas");
        this.pixelBuff = document.createElement("canvas");
        this.gridBuff = document.createElement("canvas");
        this.previewBuff = document.createElement("canvas");
        this.spriteData = spriteData;
        this.previewData = new Array(this.spriteData.length).fill('');
        this.offset = new Victor(0, 0);
        this.zoomFac = 1;
        this.mouseCell = new Victor(0, 0);

        this.pixelBuff.width = GRID_DIV;
        this.pixelBuff.height = GRID_DIV;
        this.previewBuff.width = GRID_DIV;
        this.previewBuff.height = GRID_DIV;

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
        const HALF_CANVAS = CANVAS_WIDTH / 2;

        let scaleFac = (CANVAS_WIDTH / GRID_DIV) * this.zoomFac;

        ctx.drawImage(this.checkerBGBuff, 0, 0, this.checkerBGBuff.width, this.checkerBGBuff.height);

        //draw pixel and preview buffers
        ctx.imageSmoothingEnabled = false;
        ctx.webkitImageSmoothingEnabled = false;

        ctx.translate(
            (this.canvas.width / 2) + (this.offset.x * this.zoomFac),
            (this.canvas.height / 2) + (this.offset.y * this.zoomFac)
        );
        ctx.translate(
            -HALF_CANVAS * this.zoomFac, -HALF_CANVAS * this.zoomFac
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

    updateMouseCell(event){
        const CELL_SIZE = (CANVAS_WIDTH / GRID_DIV) * this.zoomFac;
        let mouseCell = new Victor(event.offsetX, event.offsetY);
        let windowHalfWidth = new Victor(this.canvas.width / 2, this.canvas.height / 2);
        let canvasHalfWidth = new Victor(CANVAS_WIDTH / 2, CANVAS_WIDTH / 2);
        let scaledOffset = this.offset.clone().multiplyScalar(this.zoomFac);

        canvasHalfWidth.multiplyScalar(this.zoomFac);

        mouseCell.subtract(windowHalfWidth);
        mouseCell.add(canvasHalfWidth);
        mouseCell.subtract(scaledOffset);
        mouseCell.divideScalar(CELL_SIZE);

        mouseCell.x = Math.floor(mouseCell.x);
        mouseCell.y = Math.floor(mouseCell.y);

        this.mouseCell.copy(mouseCell);
    }

    navChanged({rawOffset, zoomFac}){
        this.offset = rawOffset.clone();
        this.zoomFac = zoomFac;
        
        this.drawBGStencil();
        this.drawSpriteData();
        this.drawGrid();
        this.drawPreviewBuffer();
        
        this.composite();
    }

    unsetTool(){
        let ctx = this.previewBuff.getContext('2d');
        
        this.tool = null;
        ctx.clearRect(0, 0, this.previewBuff.width, this.previewBuff.height);
        this.composite();
    }

    setSprite(newSprite){
        this.spriteData = newSprite;
        this.previewData.fill('');

        this.drawSpriteData();
        this.drawPreviewBuffer();
        this.composite();
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

    mouseMove(event){
        this.updateMouseCell(event);
        this.drawSpriteData();
        this.drawPreviewBuffer();
        this.composite();
    }

    drawCheckerBG(canvas = this.checkerBGBuff){
        drawCheckerBG(canvas, 10, "#AAA", "#CCC");
    }

    drawBGStencil(ctx = this.checkerStencilBuff.getContext('2d')){
        const HALF_WIDTH = CANVAS_WIDTH / 2;
        ctx.fillStyle = "white";
        ctx.fillRect(0, 0, this.checkerStencilBuff.width, this.checkerStencilBuff.height);
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
        const PIXEL_SIZE = Math.round(CANVAS_WIDTH / GRID_DIV);
        const HALF_CANVAS = CANVAS_WIDTH / 2;

        ctx.clearRect(0, 0, this.gridBuff.width, this.gridBuff.height);

        ctx.translate(
            (this.canvas.width / 2) + (this.offset.x * this.zoomFac),
            (this.canvas.height / 2) + (this.offset.y * this.zoomFac)
        );
        ctx.scale(this.zoomFac, this.zoomFac);

        //draw grid
        ctx.strokeStyle = "black";
        ctx.lineWidth = 1;
        ctx.beginPath();
        for (let i = 1; i < GRID_DIV; i++) {
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

    getSpriteDimensions(){
        if (this.spriteData == null){
            return 0;
        }
        return Math.ceil(Math.sqrt(this.spriteData.length));
    }

    getViewBounds(){
        return [-500, -500, 500, 500];
    }

    getContentsBounds(){
        return [0, 0, CANVAS_WIDTH, CANVAS_WIDTH];
    }

    getZoomBounds(){
        let maxZoom = (Math.max(this.canvas.clientWidth, this.canvas.clientHeight) / CANVAS_WIDTH) * 2;
        return {min: 0.5, max: maxZoom};
    }
}

export default Art_Canvas_Renderer;