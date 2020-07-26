import Victor from 'victor';
import Util_2D from '@/common/Util_2D';
import Draw_2D from '@/common/Draw_2D';
import {TOOL_TYPE} from './tools/Tool';
import Brush from './tools/Brush';
import Bucket from './tools/Bucket';
import Line_Brush from './tools/Line_Brush';
import Box_Brush from './tools/Box_Brush';
import Ellipse_Brush from './tools/Ellipse_Brush';
import Eraser from './tools/Eraser';
import Eye_Dropper from './tools/Eye_Dropper';

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
        this.mouse = {
            down: false,
            cell: new Victor(0, 0)
        }
        this.toolColor = null;
        this.toolSize = null;
        this.tool = null;
        this.commitCallback;

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
        if (this.tool == null){
            return;
        }

        this.tool.canDraw = false;
    }

    enableDrawing(){
        if (this.tool == null){
            return;
        }

        this.tool.canDraw = true;
    }

    setToolColor(newColor){
        this.toolColor = newColor;
        this.tool.setToolColor(this.toolColor);
    }

    setToolSize(newSize){
        this.toolSize = newSize;

        if (this.tool != null){
            this.tool.setToolSize(this.toolSize);
        }
    }

    setTool(newTool){
        if (this.tool != null){
            this.tool.beforeDestroy();
        }

        if (newTool == null){
            this.tool = null;
        }
        else{
            switch(newTool){
                case TOOL_TYPE.BRUSH:
                    this.tool = new Brush();
                    break;
                case TOOL_TYPE.BUCKET:
                    this.tool = new Bucket();
                    break;
                case TOOL_TYPE.LINE:
                    this.tool = new Line_Brush();
                    break;
                case TOOL_TYPE.BOX:
                    this.tool = new Box_Brush();
                    break;
                case TOOL_TYPE.BOX_FILL:
                    this.tool = new Box_Brush(true);
                    break;
                case TOOL_TYPE.ELLIPSE:
                    this.tool = new Ellipse_Brush();
                    break;
                case TOOL_TYPE.ELLIPSE_FILL:
                    this.tool = new Ellipse_Brush(true);
                    break;
                case TOOL_TYPE.ERASER:
                    this.tool = new Eraser();
                    break;
                case TOOL_TYPE.EYE_DROPPER:
                    this.tool = new Eye_Dropper();
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
    }

    setSprite(newSprite){
        this.spriteData = newSprite;
        this.previewData.fill('');

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
        if (this.tool == null){
            return;
        }

        this.tool.mouseDown(event);
        this.drawSpriteData();
        this.drawPreviewBuffer();
        this.composite();
    }

    mouseUp(event){
        if (this.tool == null){
            return;
        }

        this.tool.mouseUp(event);
        this.drawSpriteData();
        this.drawPreviewBuffer();
        this.composite();
    }

    mouseMove(event){
        this.updateMouse(event);

        if (this.tool == null){
            return;
        }

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

    drawCheckerBG(canvas = this.checkerBGBuff){
        Draw_2D.drawCheckerBG(canvas, 10, "#AAA", "#CCC");
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

    drawPixelData(canvas, pixelData){
        if (pixelData != null){
            const HALF_CANVAS = CANVAS_WIDTH / 2;

            let ctx = canvas.getContext('2d');

            ctx.clearRect(0, 0, this.pixelBuff.width, this.pixelBuff.height);

            ctx.save();
            ctx.translate(
                (this.canvas.width / 2)  + (this.offset.x * this.zoomFac),
                (this.canvas.height / 2) + (this.offset.y * this.zoomFac)
            );
            ctx.translate(-HALF_CANVAS * this.zoomFac, -HALF_CANVAS * this.zoomFac);
            ctx.scale(this.zoomFac, this.zoomFac);

            Draw_2D.drawPixelData(canvas, CANVAS_WIDTH, pixelData)

            ctx.restore();
        }
    }

    drawSpriteData(canvas = this.pixelBuff){
        this.drawPixelData(canvas, this.spriteData);
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