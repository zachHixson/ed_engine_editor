import Core from '@/core';

const { Vector, Draw } = Core;

const NO_SPRITE_PADDING = 0.75;

export default class Room_Edit_Renderer{
    showGrid: boolean = true;
    roomRef: Core.Room | null = null;
    canvas: HTMLCanvasElement;
    objBuff = document.createElement('canvas') as HTMLCanvasElement;
    iconBuff = document.createElement('canvas') as HTMLCanvasElement;
    iconColor = document.createElement('canvas') as HTMLCanvasElement;
    cursorBuff = document.createElement('canvas') as HTMLCanvasElement;
    gridBuff = document.createElement('canvas') as HTMLCanvasElement;
    selectionBuff = document.createElement('canvas') as HTMLCanvasElement;
    exits: Core.Exit[] | null = null;
    selectedEntity: Core.Instance_Base | null = null;
    mouseCell = new Vector(0, 0);
    enableCursor = false;
    navState: {[key: string]: any};
    cameraIcon: HTMLImageElement;
    noSpriteSVG: HTMLImageElement;
    exitSVG: HTMLImageElement;
    endSVG: HTMLImageElement;

    //data caches
    spriteCache = new Map<string, HTMLCanvasElement>();
    roundedCanvas = new Vector(0, 0);
    scaledCellWidth: number;
    halfCanvas = new Vector(0, 0);
    
    constructor(element: HTMLCanvasElement, navState: object, svgIcons: {[key: string]: HTMLImageElement}){
        this.canvas = element;
        this.navState = navState;
        this.cameraIcon = svgIcons.cameraIcon;
        this.noSpriteSVG = svgIcons.noSpriteSVG;
        this.exitSVG = svgIcons.exitSVG;
        this.endSVG = svgIcons.endSVG;

        //cached data
        this.scaledCellWidth = this.CELL_PX_WIDTH * this.navState.zoomFac;
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

    setRoomRef(roomObj: Core.Room){
        this.roomRef = roomObj;
        this.navState = this.roomRef.navState!;
        this.navChange();
    }

    setSelection(instRef: Core.Instance_Base){
        this.selectedEntity = instRef;
        this._drawCursor();
        this._composite();
    }

    setGridVisibility(newVisibility: boolean){
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

    mouseMove(event: MouseEvent){
        const screenCoords = new Vector(event.offsetX, event.offsetY);
        const worldCoords = this.screenToWorldPos(screenCoords.clone());
        const cell = worldCoords.clone();
        
        cell.divideScalar(16);
        cell.subtractScalar(0.5);
        cell.round();

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
        this._drawCursor();
        this._composite();
    }

    bgColorChanged(){
        this._drawGrid();
        this._composite();
    }

    resize(){
        const {clientWidth, clientHeight} = this.canvas;
        Draw.resizeHDPICanvas(this.objBuff, clientWidth, clientHeight);
        Draw.resizeHDPICanvas(this.iconBuff, clientWidth, clientHeight);
        Draw.resizeHDPICanvas(this.iconColor, clientWidth, clientHeight);
        Draw.resizeHDPICanvas(this.cursorBuff, clientWidth, clientHeight);
        Draw.resizeHDPICanvas(this.gridBuff, clientWidth, clientHeight);
        Draw.resizeHDPICanvas(this.selectionBuff, clientWidth, clientHeight);
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
        const ctx = this.canvas.getContext('2d') as CanvasRenderingContext2D;
        const iconCtx = this.iconBuff.getContext('2d') as CanvasRenderingContext2D;
        const iconColorCtx = this.iconColor.getContext('2d') as CanvasRenderingContext2D;
        const bgColor = this.roomRef?.bgColor ?? new Draw.Color(255, 255, 255);
        const luma = Math.max(Math.max(bgColor.r, bgColor.g), bgColor.b);

        //composite icon and iconColor buffs together
        iconColorCtx.fillStyle = (luma > 100) ? '#000' : '#EEE';
        iconColorCtx.fillRect(0, 0, this.iconColor.width, this.iconColor.height);
        iconCtx.globalCompositeOperation = 'source-in';
        iconCtx.drawImage(this.iconColor, 0, 0, this.iconBuff.width, this.iconBuff.height);
        iconCtx.globalCompositeOperation = 'source-over';

        //composite normal buffers to main canvas
        ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        ctx.fillStyle = this.roomRef?.bgColor.toHex() ?? 'white';
        ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        ctx.drawImage(this.objBuff, 0, 0, this.objBuff.width, this.objBuff.height);
        ctx.drawImage(this.gridBuff, 0, 0, this.gridBuff.width, this.gridBuff.height);
        ctx.drawImage(this.iconBuff,0, 0, this.iconBuff.width, this.iconBuff.height);
        ctx.drawImage(this.cursorBuff, 0, 0, this.cursorBuff.width, this.cursorBuff.height);

        //composite selection buff
        ctx.globalCompositeOperation = (luma > 150) ? 'exclusion' : 'lighten';
        ctx.drawImage(this.selectionBuff, 0, 0, this.selectionBuff.width, this.selectionBuff.height);
        ctx.globalCompositeOperation = 'source-over';
    }

    _drawObjects(){
        const ctx = this.objBuff.getContext('2d') as CanvasRenderingContext2D;
        const iconCtx = this.iconBuff.getContext('2d') as CanvasRenderingContext2D;

        ctx.clearRect(0, 0, this.objBuff.width, this.objBuff.height);
        iconCtx.clearRect(0, 0, this.iconBuff.width, this.iconBuff.height);
        ctx.imageSmoothingEnabled = false;

        this._drawInstances();
        this._drawExits();
        this._drawCameraCursor();
    }

    _drawInstances(){
        if (this.roomRef){
            let paddingOffset = this.scaledCellWidth - (this.scaledCellWidth * NO_SPRITE_PADDING);

            paddingOffset /= 2;

            this.roomRef.instanceList.forEach((inst: Core.Instance_Base) => {
                this._drawInstance(inst, paddingOffset);
            });
        }
    }

    _drawInstance(inst: Core.Instance_Base, paddingOffset: number){
        const pos = Vector.fromObject(inst.pos);
        let offset = 0;

        this.worldToScreenPos(pos);

        //only draw sprite if it's within the view bounds
        if (
            pos.x > -this.scaledCellWidth &&
            pos.x < this.objBuff.width + this.scaledCellWidth &&
            pos.y > -this.scaledCellWidth &&
            pos.y < this.objBuff.height + this.scaledCellWidth
        ){
            let ctx = this.objBuff.getContext('2d') as CanvasRenderingContext2D;
            let spriteBuff: HTMLCanvasElement | HTMLOrSVGImageElement | undefined;
            let scaleFac = 1;

            if (inst.hasEditorFrame){
                //cache sprites after they are parsed once
                spriteBuff = this.spriteCache.get(inst.editorFrameID!);

                if (!spriteBuff){
                    spriteBuff = inst.editorFrame as HTMLCanvasElement;
                    this.spriteCache.set(inst.editorFrameID!, spriteBuff);
                }

                scaleFac = this.scaledCellWidth / spriteBuff.width;
            }
            else if (this.noSpriteSVG){
                ctx = this.iconBuff.getContext('2d') as CanvasRenderingContext2D;
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
        const ctx = this.iconBuff.getContext('2d') as CanvasRenderingContext2D;

        if (this.roomRef){
            this.roomRef.exitsList.forEach((exit) => {
                const pos = Vector.fromObject(exit.pos);
                const scaleFac = this.scaledCellWidth / this.exitSVG.width;

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
        const ctx = this.iconBuff.getContext('2d') as CanvasRenderingContext2D;

        if (this.roomRef?.camera){
            const cameraPos = this.roomRef.camera.pos;
            const cameraSize = this.roomRef.camera.size;

            //draw camera icon
            const scaleFac = this.scaledCellWidth / this.cameraIcon.width;
            let screenPos = cameraPos.clone().subtractScalar(8);
            screenPos = this.worldToScreenPos(screenPos);
            ctx.translate(screenPos.x, screenPos.y);
            ctx.scale(scaleFac, scaleFac);
            ctx.drawImage(this.cameraIcon, 0, 0);
            ctx.resetTransform();

            //draw camera bounds
            let ul = cameraPos.clone().subtractScalar(120 * cameraSize);
            let br = cameraPos.clone().addScalar(120 * cameraSize);
            ul = this.worldToScreenPos(ul);
            br = this.worldToScreenPos(br);
            ctx.strokeStyle = "#00000055";
            ctx.lineWidth = 2;
            ctx.strokeRect(ul.x, ul.y, br.x - ul.x, br.y - ul.y);
        }
    }

    _drawCursor(){
        const CURSOR_SHIFT = 120;

        const ctx = this.cursorBuff.getContext('2d') as CanvasRenderingContext2D;
        const selectionCtx = this.selectionBuff.getContext('2d') as CanvasRenderingContext2D;
        const screenCell = this.worldToScreenPos(this.getMouseWorldCell());
        const bgColor = this.roomRef?.bgColor ?? new Draw.Color(255, 255, 255);
        const luma = Math.max(Math.max(bgColor.r, bgColor.g), bgColor.b);
        const shiftDir = (luma > 127) ? -CURSOR_SHIFT : CURSOR_SHIFT;

        ctx.clearRect(0, 0, this.cursorBuff.width, this.cursorBuff.height);
        selectionCtx.clearRect(0, 0, this.selectionBuff.width, this.selectionBuff.height);

        //draw mouse cursor
        if (this.enableCursor){
            ctx.fillStyle = Draw.RGBAToHex(bgColor.r + shiftDir, bgColor.g + shiftDir, bgColor.b + shiftDir, 120);
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

        const ctx = this.gridBuff.getContext('2d') as CanvasRenderingContext2D;
        const maxDim = Math.max(this.gridBuff.width, this.gridBuff.height);
        const origin = new Vector(0, 0);
        const bgCol = this.roomRef?.bgColor ?? new Draw.Color(6, 95, 233);
        const luma = Math.max(bgCol.r, bgCol.g, bgCol.b);
        const gridShiftAmt = (luma > 127) ? -GRID_SHIFT * 0.4 : GRID_SHIFT;
        const gridCol = Draw.RGBAToHex(bgCol.r + gridShiftAmt, bgCol.g + gridShiftAmt, bgCol.b + gridShiftAmt);
        const xAxisCol = Draw.RGBAToHex(bgCol.r + AXIS_SHIFT, bgCol.g - AXIS_SHIFT, bgCol.b - AXIS_SHIFT);
        const yAxisCol = Draw.RGBAToHex(bgCol.r - AXIS_SHIFT, bgCol.g + AXIS_SHIFT, bgCol.b - AXIS_SHIFT);
        let lineCount = Math.ceil(maxDim / this.scaledCellWidth);

        lineCount += +(lineCount % 2 == 0);
        this.worldToScreenPos(origin);

        ctx.clearRect(0, 0, this.gridBuff.width, this.gridBuff.height);

        if (this.showGrid){
            //draw lines
            ctx.strokeStyle = gridCol;
            ctx.lineWidth = 2;
            ctx.beginPath();
            for (let i = 1; i <= lineCount; i++){
                let offset = i * 16;
                let pos = new Vector(offset, offset);

                this.worldToScreenPos(pos);

                //wrap lines around canvas
                pos.x = Core.Util.mod(pos.x, this.roundedCanvas.x);
                pos.y = Core.Util.mod(pos.y, this.roundedCanvas.y);

                //draw lines
                pos.round();
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

    screenToWorldPos(pt: Core.Vector){
        pt.multiplyScalar(devicePixelRatio)
        pt.subtract(this.halfCanvas);
        pt.divideScalar(this.navState.zoomFac);
        pt.subtract(this.navState.offset);
        pt.divideScalar(this.UNIT_WIDTH);

        return pt;
    }

    worldToScreenPos(pt: Core.Vector){
        pt.multiplyScalar(this.UNIT_WIDTH);
        pt.add(this.navState.offset);
        pt.multiplyScalar(this.navState.zoomFac);
        pt.add(this.halfCanvas);

        return pt;
    }
}