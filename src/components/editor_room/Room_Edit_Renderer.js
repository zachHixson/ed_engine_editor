import Victor from 'victor';
import Draw_2D from '@/common/Draw_2D';

export default class Room_Edit_Renderer{
    constructor(element){
        this.cell_px_width = 50;
        this.showGrid = true;
        this.roomRef = null;
        this.canvas = element;
        this.objBuff = document.createElement('canvas');
        this.cursorBuff = document.createElement('canvas');
        this.gridBuff = document.createElement('canvas');
        this.zDrawList = null;
        this.spriteCache = new Map();
        this.selectedInstance = null;
        this.mouse = {
            down: false,
            pos: new Victor(0, 0),
            cell: new Victor(0, 0)
        };
        this.navData = {
            rawOffset: new Victor(0, 0),
            zoomFac: 1
        };
        this.cameraIcon = null;
        this.noSpriteSVG = null;

        //cached data
        this.roundedCanvas = new Victor(0, 0);
        this.scaledCellWidth = this.cell_px_width * this.navData.zoomFac;
        this.halfCanvas = new Victor(0, 0);
        this.recalcRoundedCanvas();
        this.recalcHalfCanvas();
    }

    getMouseWorldPos(){
        return this.mouse.pos;
    }

    getMouseCell(){
        return this.mouse.cell;
    }

    getMouseWorldCell(){
        return this.mouse.cell.clone().multiplyScalar(16);
    }

    setRoomRef(roomObj){
        this.roomRef = roomObj;
        this.zDrawList = this.roomRef.zSortedList;
    }

    setZDrawList(list){
        this.zDrawList = list;
        this.drawObjects();
        this.composite();
    }

    setCameraSVG(svgIcon){
        this.cameraIcon = svgIcon;
        this.drawCursor();
        this.composite();
    }

    setSelectedInstance(instRef){
        this.selectedInstance = instRef;
        this.drawCursor();
        this.composite();
    }

    setNoSpriteSVG(svg){
        this.noSpriteSVG = svg;
    }

    setGridVisibility(newVisibility){
        this.showGrid = newVisibility;
        this.drawGrid();
        this.composite();
    }

    recalcHalfCanvas(){
        this.halfCanvas.x = this.canvas.width / 2;
        this.halfCanvas.y = this.canvas.height / 2;
    }

    recalcRoundedCanvas(){
        this.roundedCanvas.x = Math.ceil(this.canvas.width / this.scaledCellWidth) * this.scaledCellWidth;
        this.roundedCanvas.y = Math.ceil(this.canvas.height / this.scaledCellWidth) * this.scaledCellWidth;
    }

    mouseDown(event){
        this.mouse.down = true;
    }

    mouseUp(event){
        this.mouse.down = false;
    }

    mouseMove(event){
        let screenCoords = new Victor(event.offsetX, event.offsetY);
        let worldCoords = this.screenToWorldPos(screenCoords.clone());
        let cell = worldCoords.clone();
        
        cell.divideScalar(16);
        cell.subtractScalar(0.5);
        cell.unfloat();

        this.mouse.pos.copy(worldCoords);
        this.mouse.cell.copy(cell);

        this.drawCursor();
        this.composite();
    }

    navChange(navEventData){
        this.navData.rawOffset.copy(navEventData.rawOffset);
        this.navData.zoomFac = navEventData.zoomFac;
        this.scaledCellWidth = this.cell_px_width * this.navData.zoomFac;
        this.recalcRoundedCanvas();
        this.fullRedraw();
    }

    instancesChanged(){
        this.drawObjects();
        this.drawCursor();
        this.composite();
    }

    bgColorChanged(){
        this.composite();
    }

    resize(){
        this.objBuff.width = this.canvas.width;
        this.objBuff.height = this.canvas.height;
        this.cursorBuff.width = this.canvas.width;
        this.cursorBuff.height = this.canvas.height;
        this.gridBuff.width = this.canvas.width;
        this.gridBuff.height = this.canvas.height;
        this.recalcRoundedCanvas();
        this.recalcHalfCanvas();
        this.fullRedraw();
    }

    composite(){
        let ctx = this.canvas.getContext('2d');

        ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        this.drawBackground();
        ctx.drawImage(this.objBuff, 0, 0, this.objBuff.width, this.objBuff.height);
        ctx.drawImage(this.gridBuff, 0, 0, this.gridBuff.width, this.gridBuff.height);
        ctx.drawImage(this.cursorBuff, 0, 0, this.cursorBuff.width, this.cursorBuff.height);
    }

    fullRedraw(){
        this.drawObjects();
        this.drawCursor();
        this.drawGrid();
        this.composite();
    }

    drawBackground(){
        let ctx = this.canvas.getContext('2d');
        ctx.fillStyle = this.roomRef?.bgColor ?? 'white';
        ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    }

    drawObjects(){
        const NO_SPRITE_PADDING = 0.75;

        let ctx = this.objBuff.getContext('2d');
        let scaleFac = this.scaledCellWidth / 16;
        let paddingOffset = this.scaledCellWidth - (this.scaledCellWidth * NO_SPRITE_PADDING);

        paddingOffset /= 2;

        ctx.clearRect(0, 0, this.objBuff.width, this.objBuff.height);
        ctx.imageSmoothingEnabled = false;
        ctx.webkitImageSmoothingEnabled = false;

        if (this.zDrawList){
            this.zDrawList.forEach((inst) => {
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

                    if (inst.objRef.sprite){
                        //cache sprites once they are already drawn once
                        if (this.spriteCache.has(inst.editorFrameID)){
                            spriteBuff = this.spriteCache.get(inst.editorFrameID);
                        }
                        else{
                            spriteBuff = this.newSpriteBuff();
                            Draw_2D.drawPixelData(spriteBuff, inst.editorFrame);
                            this.spriteCache.set(inst.editorFrameID, spriteBuff);
                        }

                        scaleFac = this.scaledCellWidth / spriteBuff.width;
                    }
                    else if (this.noSpriteSVG){
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
                    ctx.save();
                    ctx.translate(pos.x + offset, pos.y + offset);
                    ctx.scale(scaleFac, scaleFac);
                    ctx.drawImage(spriteBuff, 0, 0);
                    ctx.restore();
                }
            });
        }
    }

    drawCursor(){
        //draw mouse cursor
        let ctx = this.cursorBuff.getContext("2d");
        let screenCell = this.worldToScreenPos(this.getMouseWorldCell());

        ctx.clearRect(0, 0, this.cursorBuff.width, this.cursorBuff.height);

        ctx.fillStyle = "#AAAAAA88";
        ctx.fillRect(screenCell.x, screenCell.y, this.scaledCellWidth, this.scaledCellWidth);

        //draw selection cursor
        if (this.selectedInstance){
            let screenPos = this.selectedInstance.pos.clone();
            screenPos = this.worldToScreenPos(screenPos);
            ctx.strokeStyle = "blue";
            ctx.strokeRect(screenPos.x, screenPos.y, this.scaledCellWidth, this.scaledCellWidth);
        }

        //draw camera cursor
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

    drawGrid(){
        let ctx = this.gridBuff.getContext('2d');
        let maxDim = Math.max(this.gridBuff.width, this.gridBuff.height);
        let lineCount = Math.ceil(maxDim / this.scaledCellWidth);
        let origin = new Victor(0, 0);

        lineCount += (lineCount % 2 == 0) ? 1 : 0;
        this.worldToScreenPos(origin);

        ctx.clearRect(0, 0, this.gridBuff.width, this.gridBuff.height);

        if (this.showGrid){
            //draw lines
            ctx.strokeStyle = "#BBB";
            ctx.lineWidth = 2;
            ctx.beginPath();
            for (let i = 1; i < lineCount; i++){
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
            ctx.strokeStyle = "#FF0000";
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(0, origin.y);
            ctx.lineTo(this.canvas.width, origin.y);
            ctx.stroke();
            ctx.strokeStyle = "#00FF00";
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
        pt.divideScalar(this.navData.zoomFac);
        pt.subtract(this.navData.rawOffset);
        pt.divideScalar(this.cell_px_width / 16);

        return pt;
    }

    worldToScreenPos(pt){
        pt.multiplyScalar(this.cell_px_width / 16);
        pt.add(this.navData.rawOffset);
        pt.multiplyScalar(this.navData.zoomFac);
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

function mod(n, m){
    return ((n%m)+m)%m;
}