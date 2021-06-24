import Victor from 'victor';
import {drawPixelData, hexToRGBA, RGBAToHex} from '@/common/Draw_2D';
import {mod, clamp} from '@/common/Util';

const NO_SPRITE_PADDING = 0.75;

export default class Room_Edit_Renderer{
    constructor(element, navState){
        this.showGrid = true;
        this.roomRef = null;
        this.canvas = element;
        this.objBuff = document.createElement('canvas');
        this.iconBuff = document.createElement('canvas');
        this.iconColor = document.createElement('canvas');
        this.cursorBuff = document.createElement('canvas');
        this.gridBuff = document.createElement('canvas');
        this.selectionBuff = document.createElement('canvas');
        this.zDrawList = null;
        this.exits = null;
        this.spriteCache = new Map();
        this.selectedEntity = null;
        this.mouseCell = new Victor(0, 0);
        this.enableCursor = false;
        this.navState = navState;
        this.cameraIcon = null;
        this.noSpriteSVG = null;
        this.exitSVG = null;
        this.endSVG = null;

        //cached data
        this.roundedCanvas = new Victor(0, 0);
        this.scaledCellWidth = this.cell_px_width * this.navState.zoomFac;
        this.halfCanvas = new Victor(0, 0);
        this.recalcRoundedCanvas();
        this.recalcHalfCanvas();
    }

    get CELL_PX_WIDTH(){return 50};
    get UNIT_WIDTH(){return this.CELL_PX_WIDTH / 16};

    getMouseCell(){
        return this.mouseCell;
    }

    getMouseWorldCell(){
        return this.mouseCell.clone().multiplyScalar(16);
    }

    setRoomRef(roomObj){
        this.roomRef = roomObj;
        this.zDrawList = this.roomRef.zSortedList;
        this.exits = this.roomRef.exitsList;
        this.navState = this.roomRef.navState;
        this.navChange();
    }

    setSelection(instRef){
        this.selectedEntity = instRef;
        this._drawCursor();
        this._composite();
    }

    setSVG({camera, noSprite, exit, end}){
        this.cameraIcon = camera;
        this.noSpriteSVG = noSprite;
        this.exitSVG = exit;
        this.endSVG = end;
    }

    setGridVisibility(newVisibility){
        this.showGrid = newVisibility;
        this._drawGrid();
        this._composite();
    }

    recalcHalfCanvas(){
        this.halfCanvas.x = this.canvas.width / 2;
        this.halfCanvas.y = this.canvas.height / 2;
    }

    recalcRoundedCanvas(){
        this.roundedCanvas.x = Math.ceil(this.canvas.width / this.scaledCellWidth) * this.scaledCellWidth;
        this.roundedCanvas.y = Math.ceil(this.canvas.height / this.scaledCellWidth) * this.scaledCellWidth;
    }

    mouseMove(event){
        let screenCoords = new Victor(event.offsetX, event.offsetY);
        let worldCoords = this.screenToWorldPos(screenCoords.clone());
        let cell = worldCoords.clone();
        
        cell.divideScalar(16);
        cell.subtractScalar(0.5);
        cell.unfloat();

        this.mouseCell.copy(cell);

        this._drawCursor();
        this._composite();
    }

    navChange(){
        this.scaledCellWidth = this.CELL_PX_WIDTH * this.navState.zoomFac;
        this.recalcRoundedCanvas();
        this.fullRedraw();
    }

    instancesChanged(){
        this._drawObjects();
        this._composite();
    }

    bgColorChanged(){
        this._drawGrid();
        this._composite();
    }

    resize(){
        this.objBuff.width = this.canvas.width;
        this.objBuff.height = this.canvas.height;
        this.iconBuff.width = this.canvas.width;
        this.iconBuff.height = this.canvas.height;
        this.iconColor.width = this.canvas.width;
        this.iconColor.height = this.canvas.height;
        this.cursorBuff.width = this.canvas.width;
        this.cursorBuff.height = this.canvas.height;
        this.gridBuff.width = this.canvas.width;
        this.gridBuff.height = this.canvas.height;
        this.selectionBuff.width = this.canvas.width;
        this.selectionBuff.height = this.canvas.height;
        this.recalcRoundedCanvas();
        this.recalcHalfCanvas();
        this.fullRedraw();
    }

    drawObjects(){
        this._drawObjects();
        this._composite();
    }

    drawCursor(){
        this._drawCursor();
        this._composite();
    }

    drawGrid(){
        this._drawGrid();
        this._composite();
    }

    fullRedraw(){
        this._drawObjects();
        this._drawCursor();
        this._drawGrid();
        this._composite();
    }

    _composite(){
        let ctx = this.canvas.getContext('2d');
        let iconCtx = this.iconBuff.getContext('2d');
        let iconColorCtx = this.iconColor.getContext('2d');
        let bgColor = hexToRGBA(this.roomRef?.bgColor ?? '#FFFFFF');
        let luma = Math.max(Math.max(bgColor.r, bgColor.g), bgColor.b);

        //composite icon and iconColor buffs together
        iconColorCtx.fillStyle = (luma > 100) ? '#000' : '#EEE';
        iconColorCtx.fillRect(0, 0, this.iconColor.width, this.iconColor.height);
        iconCtx.globalCompositeOperation = 'source-in';
        iconCtx.drawImage(this.iconColor, 0, 0, this.iconBuff.width, this.iconBuff.height);
        iconCtx.globalCompositeOperation = 'source-over';

        //composite normal buffers to main canvas
        ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        ctx.fillStyle = this.roomRef?.bgColor ?? 'white';
        ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        ctx.drawImage(this.objBuff, 0, 0, this.objBuff.width, this.objBuff.height);
        ctx.drawImage(this.iconBuff,0, 0, this.iconBuff.width, this.iconBuff.height);
        ctx.drawImage(this.gridBuff, 0, 0, this.gridBuff.width, this.gridBuff.height);
        ctx.drawImage(this.cursorBuff, 0, 0, this.cursorBuff.width, this.cursorBuff.height);

        //composite selection buff
        ctx.globalCompositeOperation = (luma > 150) ? 'exclusion' : 'lighten';
        ctx.drawImage(this.selectionBuff, 0, 0, this.selectionBuff.width, this.selectionBuff.height);
        ctx.globalCompositeOperation = 'source-over';
    }

    _drawObjects(){
        let ctx = this.objBuff.getContext('2d');
        let iconCtx = this.iconBuff.getContext('2d');

        ctx.clearRect(0, 0, this.objBuff.width, this.objBuff.height);
        iconCtx.clearRect(0, 0, this.iconBuff.width, this.iconBuff.height);
        ctx.imageSmoothingEnabled = false;
        ctx.webkitImageSmoothingEnabled = false;

        this._drawInstances();
        this._drawExits();
        this._drawCameraCursor();
    }

    _drawInstances(){
        if (this.zDrawList){
            let paddingOffset = this.scaledCellWidth - (this.scaledCellWidth * NO_SPRITE_PADDING);

            paddingOffset /= 2;

            this.zDrawList.forEach((inst) => {
                this._drawInstance(inst, paddingOffset);
            });
        }
    }

    _drawInstance(inst, paddingOffset){
        let pos = Victor.fromObject(inst.pos);
        let offset = 0;

        this.worldToScreenPos(pos);

        //only draw sprite if it's within the view bounds
        if (
            pos.x > -this.scaledCellWidth &&
            pos.x < this.objBuff.width + this.scaledCellWidth &&
            pos.y > -this.scaledCellWidth &&
            pos.y < this.objBuff.height + this.scaledCellWidth
        ){
            let spriteBuff;
            let scaleFac;
            let ctx = this.objBuff.getContext('2d');

            if (inst.objRef.sprite && inst.objRef.editorFrame){
                //cache sprites after they are parsed once
                spriteBuff = this.spriteCache.get(inst.editorFrameID);

                if (!spriteBuff){
                    spriteBuff = this.newSpriteBuff();
                    drawPixelData(spriteBuff, inst.editorFrame);
                    this.spriteCache.set(inst.editorFrameID, spriteBuff);
                }

                scaleFac = this.scaledCellWidth / spriteBuff.width;
            }
            else if (this.noSpriteSVG){
                ctx = this.iconBuff.getContext('2d');
                spriteBuff = this.noSpriteSVG;
                scaleFac = this.scaledCellWidth / spriteBuff.width;
                scaleFac *= NO_SPRITE_PADDING;
                offset = paddingOffset;
            }
            else{
                //This prevents a rare edge case where spriteBuff goes undefined
                spriteBuff = document.createElement('canvas');
            }

            //draw sprite
            ctx.translate(pos.x + offset, pos.y + offset);
            ctx.scale(scaleFac, scaleFac);
            ctx.drawImage(spriteBuff, 0, 0);
            ctx.resetTransform();
        }
    }

    _drawExits(){
        let ctx = this.iconBuff.getContext('2d');

        if (this.exits){
            this.exits.forEach((exit) => {
                let pos = Victor.fromObject(exit.pos);
                let scaleFac = this.scaledCellWidth / this.exitSVG.width;
                this.worldToScreenPos(pos);
                ctx.translate(pos.x, pos.y);
                ctx.scale(scaleFac, scaleFac);

                if (exit.isEnding){
                    ctx.drawImage(this.endSVG, 0, 0);
                }
                else{
                    ctx.drawImage(this.exitSVG, 0, 0);
                }
                
                ctx.resetTransform();
            })
        }
    }

    _drawCameraCursor(){
        let ctx = this.iconBuff.getContext('2d');

        if (this.roomRef?.camera){
            let scaleFac = this.scaledCellWidth / this.cameraIcon.width;
            let screenPos = this.roomRef.camera.pos.clone();
            screenPos = this.worldToScreenPos(screenPos);
            ctx.translate(screenPos.x, screenPos.y);
            ctx.scale(scaleFac, scaleFac);
            ctx.drawImage(this.cameraIcon, 0, 0);
            ctx.resetTransform();
        }
    }

    _drawCursor(){
        const CURSOR_SHIFT = 120;

        let ctx = this.cursorBuff.getContext('2d');
        let selectionCtx = this.selectionBuff.getContext('2d');
        let screenCell = this.worldToScreenPos(this.getMouseWorldCell());
        let bgColor = hexToRGBA(this.roomRef?.bgColor ?? '#FFFFFF');
        let luma = Math.max(Math.max(bgColor.r, bgColor.g), bgColor.b);
        let shiftDir = (luma > 127) ? -CURSOR_SHIFT : CURSOR_SHIFT;

        ctx.clearRect(0, 0, this.cursorBuff.width, this.cursorBuff.height);
        selectionCtx.clearRect(0, 0, this.selectionBuff.width, this.selectionBuff.height);

        //draw mouse cursor
        if (this.enableCursor){
            ctx.fillStyle = RGBAToHex(bgColor.r + shiftDir, bgColor.g + shiftDir, bgColor.b + shiftDir, 120);
            ctx.fillRect(screenCell.x, screenCell.y, this.scaledCellWidth, this.scaledCellWidth);
        }

        //draw selection cursor
        if (this.selectedEntity){
            let screenPos = this.selectedEntity.pos.clone();
            screenPos = this.worldToScreenPos(screenPos);
            selectionCtx.strokeStyle = '#FA8814';
            selectionCtx.lineWidth = 5;
            selectionCtx.strokeRect(screenPos.x, screenPos.y, this.scaledCellWidth, this.scaledCellWidth);
        }
    }

    _drawGrid(){
        const GRID_SHIFT = 30;
        const AXIS_SHIFT = 100;

        let ctx = this.gridBuff.getContext('2d');
        let maxDim = Math.max(this.gridBuff.width, this.gridBuff.height);
        let lineCount = Math.ceil(maxDim / this.scaledCellWidth);
        let origin = new Victor(0, 0);
        let bgCol = hexToRGBA(this.roomRef?.bgColor ?? '#2aa4f5');
        let luma = Math.max(Math.max(bgCol.r, bgCol.g), bgCol.b);
        let gridShiftAmt = (luma > 127) ? -GRID_SHIFT : GRID_SHIFT;
        let gridCol = RGBAToHex(bgCol.r + gridShiftAmt, bgCol.g + gridShiftAmt, bgCol.b + gridShiftAmt);
        let xAxisCol = RGBAToHex(bgCol.r + AXIS_SHIFT, bgCol.g - AXIS_SHIFT, bgCol.b - AXIS_SHIFT);
        let yAxisCol = RGBAToHex(bgCol.r - AXIS_SHIFT, bgCol.g + AXIS_SHIFT, bgCol.b - AXIS_SHIFT);

        lineCount += (lineCount % 2 == 0) ? 1 : 0;
        this.worldToScreenPos(origin);

        ctx.clearRect(0, 0, this.gridBuff.width, this.gridBuff.height);

        if (this.showGrid){
            //draw lines
            ctx.strokeStyle = gridCol;
            ctx.lineWidth = 2;
            ctx.beginPath();
            for (let i = 1; i <= lineCount; i++){
                let offset = i * 16;
                let pos = new Victor(offset, offset);

                this.worldToScreenPos(pos);

                //wrap lines around canvas
                pos.x = mod(pos.x, this.roundedCanvas.x);
                pos.y = mod(pos.y, this.roundedCanvas.y);

                //draw lines
                pos.unfloat();
                ctx.moveTo(pos.x, 0);
                ctx.lineTo(pos.x, this.gridBuff.height);
                ctx.moveTo(0, pos.y);
                ctx.lineTo(this.gridBuff.width, pos.y);
            }
            ctx.stroke();

            //draw origin axis
            ctx.strokeStyle = xAxisCol;
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(0, origin.y);
            ctx.lineTo(this.canvas.width, origin.y);
            ctx.stroke();
            ctx.strokeStyle = yAxisCol;
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(origin.x, 0);
            ctx.lineTo(origin.x, this.canvas.height);
            ctx.stroke();
        }

        //draw test points
        ctx.fillStyle = 'black';
        ctx.fillRect(0, 0, 10, 10);
        ctx.fillRect(this.gridBuff.width - 10, this.gridBuff.height - 10, this.gridBuff.width, this.gridBuff.height);
    }

    screenToWorldPos(pt){
        pt.subtract(this.halfCanvas);
        pt.divideScalar(this.navState.zoomFac);
        pt.subtract(this.navState.offset);
        pt.divideScalar(this.UNIT_WIDTH);

        return pt;
    }

    worldToScreenPos(pt){
        pt.multiplyScalar(this.UNIT_WIDTH);
        pt.add(this.navState.offset);
        pt.multiplyScalar(this.navState.zoomFac);
        pt.add(this.halfCanvas);

        return pt;
    }

    newSpriteBuff(){
        let newBuff = document.createElement('canvas');
        newBuff.width = 16;
        newBuff.height = 16;

        return newBuff;
    }
}