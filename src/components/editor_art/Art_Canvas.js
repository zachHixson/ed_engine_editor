import Victor from 'victor';
import Util_2D from '@/common/Util_2D';
import Brush from './tools/Brush';
import Bucket from './tools/Bucket';
import Line_Brush from './tools/Line_Brush';
import Box_Brush from './tools/Box_Brush';
import Ellipse_Brush from './tools/Ellipse_Brush';
import Eraser from './tools/Eraser';

const GRID_DIV = 16;
const CANVAS_WIDTH = GRID_DIV * 20;

class Art_Canvas{
    constructor(element){
        this.canvas = element;
        this.checkerBGBuff = document.createElement("canvas");
        this.checkerStencilBuff = document.createElement("canvas");
        this.pixelBuff = document.createElement("canvas");
        this.gridBuff = document.createElement("canvas");
        this.previewBuff = document.createElement("canvas");
        this.spriteData;
        this.previewData;
        this.offset = new Victor(0, 0);
        this.zoomFac = 1;
        this.mouse = {
            down: false,
            cell: new Victor(0, 0)
        }
        this.toolColor = null;
        this.toolSize = null;
        this.tool = null;
        this.commitCallback;
    }

    setup(){
        this.resize();
        this.fullRedraw();
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
        ctx.drawImage(this.checkerBGBuff, 0, 0, this.checkerBGBuff.width, this.checkerBGBuff.height);
        ctx.drawImage(this.pixelBuff, 0, 0, this.pixelBuff.width, this.pixelBuff.height);
        ctx.drawImage(this.previewBuff, 0, 0, this.previewBuff.width, this.previewBuff.height);
        ctx.drawImage(this.gridBuff, 0, 0, this.gridBuff.width, this.gridBuff.height);
        ctx.drawImage(this.checkerStencilBuff, 0, 0, this.checkerStencilBuff.width, this.checkerStencilBuff.height);
    }

    resize(width = this.canvas.width, height = this.canvas.height){
        this.checkerBGBuff.width = width;
        this.checkerBGBuff.height = height;
        this.checkerStencilBuff.width = width;
        this.checkerStencilBuff.height = height;
        this.pixelBuff.width = width;
        this.pixelBuff.height = height;
        this.gridBuff.width = width;
        this.gridBuff.height = height;
        this.previewBuff.width = width;
        this.previewBuff.height = height;

        this.fullRedraw();
    }

    updateMouse(event){
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

        this.mouse.cell.copy(mouseCell);
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

    disableDrawing(){
        this.tool.canDraw = false;
    }

    enableDrawing(){
        this.tool.canDraw = true;
    }

    setToolColor(newColor){
        this.toolColor = newColor;
        this.tool.setToolColor(this.toolColor);
    }

    setToolSize(newSize){
        let numSize = 0;

        switch(newSize){
            case 'small_brush':
                numSize = 0;
                break;
            case 'medium_brush':
                numSize = 1;
                break;
            case 'large_brush':
                numSize = 2;
                break;
            default:
                numSize = 1;
        }

        this.toolSize = numSize;
        this.tool.setToolSize(this.toolSize);
    }

    setTool(newTool){
        if (this.tool != null){
            this.tool.beforeDestroy();
        }

        switch(newTool){
            case 'brush':
                this.tool = new Brush();
                break;
            case 'bucket':
                this.tool = new Bucket();
                break;
            case 'line':
                this.tool = new Line_Brush();
                break;
            case 'box':
                this.tool = new Box_Brush();
                break;
            case 'box_fill':
                this.tool = new Box_Brush(true);
                break;
            case 'ellipse':
                this.tool = new Ellipse_Brush();
                break;
            case 'ellipse_fill':
                this.tool = new Ellipse_Brush(true);
                break;
            case 'eraser':
                this.tool = new Eraser();
                break;
            default:
                this.tool = new Brush();
                console.warn("Warning: Unkown brush: \"" + newTool + ".\" Defaulting to standard brush");
                break;
        }

        this.tool.setPreviewBuff(this.previewData);
        this.tool.setPixelBuff(this.spriteData);
        this.tool.setMouseCell(this.mouse.cell);
        this.tool.setToolColor(this.toolColor);
        this.tool.setToolSize(this.toolSize);
        this.tool.setCommitCallback(this.commitStroke.bind(this));
        this.drawPreviewBuffer();
    }

    setSprite(newSprite){
        this.spriteData = newSprite;

        if (this.previewData == null){
            this.previewData = new Array(this.spriteData.length).fill('');
        }
        else{
            this.previewData.fill('');
        }

        if (this.tool != null){
            this.tool.beforeDestroy();
            this.tool.setPixelBuff(newSprite);
        }

        this.drawSpriteData();
        this.drawPreviewBuffer();
        this.composite();
    }

    setCommitCallback(callback){
        this.commitCallback = callback;
    }

    mouseDown(event){
        this.tool.mouseDown(event);
        this.drawSpriteData();
        this.drawPreviewBuffer();
        this.composite();
    }

    mouseUp(event){
        this.tool.mouseUp(event);
        this.drawSpriteData();
        this.drawPreviewBuffer();
        this.composite();
    }

    mouseMove(event){
        this.updateMouse(event);
        this.tool.mouseMove(event);
        this.drawSpriteData();
        this.drawPreviewBuffer();
        this.composite();
    }

    commitStroke(){
        if (this.commitCallback != null){
            this.commitCallback();
        }
    }

    beforeDestroy(){
        this.tool.beforeDestroy();
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
                let curIdx = Util_2D.get2DIdx(x, y, xCount);
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

        //remove after debugging
        ctx.fillStyle = "black";
        ctx.fillRect(0, 0, 10, 10);
        ctx.fillRect(canvas.width - 10, canvas.height - 10, 10, 10);
    }

    drawPixelData(ctx, pixelData){
        const SPRITE_DIM = this.getSpriteDimensions();
        const HALF_CANVAS = CANVAS_WIDTH / 2;
        const PIXEL_WIDTH = Math.round(CANVAS_WIDTH / SPRITE_DIM);

        ctx.clearRect(0, 0, this.pixelBuff.width, this.pixelBuff.height);

        ctx.save();
        ctx.translate(
            (this.canvas.width / 2) + (this.offset.x * this.zoomFac),
            (this.canvas.height / 2) + (this.offset.y * this.zoomFac)
        );
        ctx.scale(this.zoomFac, this.zoomFac);

        for (let x = 0; x < SPRITE_DIM; x++){
            for (let y = 0; y < SPRITE_DIM; y++){
                let curPixel = pixelData[Util_2D.get2DIdx(x, y, GRID_DIV)];

                if (pixelData[Util_2D.get2DIdx(x, y, GRID_DIV)] == null){
                    console.error(pixelData[Util_2D.get2DIdx(x, y, GRID_DIV)]);
                    console.error(pixelData);
                    console.error(Util_2D.get2DIdx(x, y, GRID_DIV));
                    console.error(x + " | " + y);
                }

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

    drawSpriteData(ctx = this.pixelBuff.getContext("2d")){
        this.drawPixelData(ctx, this.spriteData);
    }
 
    drawGrid(ctx = this.gridBuff.getContext("2d")){
        const PIXEL_SIZE = Math.round(CANVAS_WIDTH / GRID_DIV);
        const HALF_CANVAS = CANVAS_WIDTH / 2;

        ctx.clearRect(0, 0, this.gridBuff.width, this.gridBuff.height);

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
        for (let i = 1; i < GRID_DIV; i++) {
            let curLine = i * PIXEL_SIZE;
            let pos = new Victor(curLine, curLine);

            pos.subtractScalar(HALF_CANVAS);

            ctx.moveTo(pos.x, -HALF_CANVAS);
            ctx.lineTo(pos.x, HALF_CANVAS);
            ctx.moveTo(-HALF_CANVAS, pos.y);
            ctx.lineTo(HALF_CANVAS, pos.y);
        }

        ctx.restore();
        ctx.stroke();
    }

    drawPreviewBuffer(ctx = this.previewBuff.getContext('2d')){
        this.drawPixelData(ctx, this.previewData);
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
}

export default Art_Canvas;