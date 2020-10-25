import Victor from 'victor';

export default class Room_Edit_Renderer{
    constructor(element){
        this.cell_px_width = 50;
        this.canvas = element;
        this.objBuff = document.createElement('canvas');
        this.cursorBuff = document.createElement('canvas');
        this.gridBuff = document.createElement('canvas');
        this.mouse = {
            down: false,
            cell: new Victor(0, 0)
        }
        this.navData = {
            rawOffset: new Victor(0, 0),
            zoomFac: 1
        };

        //cached data
        this.roundedCanvas = new Victor(0, 0);
        this.scaledCellWidth = this.cell_px_width * this.navData.zoomFac;
        this.halfCanvas = new Victor(0, 0);
        this.vpCenterWorld = new Victor(0, 0);
        this.vpCenterWorldScaled = new Victor(0, 0);
        this.recalcRoundedCanvas();
        this.recalcHalfCanvas();
        this.recalcVpCenterWorld();
    }

    recalcHalfCanvas(){
        this.halfCanvas.x = this.canvas.width / 2;
        this.halfCanvas.y = this.canvas.height / 2;
    }

    recalcRoundedCanvas(){
        this.roundedCanvas.x = Math.ceil(this.canvas.width / this.scaledCellWidth) * this.scaledCellWidth;
        this.roundedCanvas.y = Math.ceil(this.canvas.height / this.scaledCellWidth) * this.scaledCellWidth;
    }

    recalcVpCenterWorld(){
        this.vpCenterWorld.copy(this.navData.rawOffset.clone().add(this.halfCanvas));
        this.vpCenterWorldScaled.copy(this.vpCenterWorld.clone().multiplyScalar(this.navData.zoomFac).add(this.halfCanvas));
    }

    mouseDown(event){
        this.mouse.down = true;
    }

    mouseUp(event){
        this.mouse.down = false;
    }

    mouseMove(event){
        //
    }

    navChange(navEventData){
        this.navData.rawOffset.copy(navEventData.rawOffset);
        this.navData.zoomFac = navEventData.zoomFac;
        this.scaledCellWidth = this.cell_px_width * this.navData.zoomFac;
        this.recalcRoundedCanvas();
        this.recalcVpCenterWorld()
        this.fullRedraw();
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

        ctx.drawImage(this.objBuff, 0, 0, this.objBuff.width, this.objBuff.height);
        ctx.drawImage(this.cursorBuff, 0, 0, this.cursorBuff.width, this.cursorBuff.height);
        ctx.drawImage(this.gridBuff, 0, 0, this.gridBuff.width, this.gridBuff.height);
    }

    fullRedraw(){
        this.drawBackground();
        this.drawObjects();
        this.drawCursor();
        this.drawGrid();
        this.composite();
    }

    drawBackground(){
        let ctx = this.canvas.getContext('2d');
        ctx.fillStyle = 'white';
        ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    }

    drawObjects(){
        //
    }

    drawCursor(){
        //
    }

    drawGrid(){
        let ctx = this.gridBuff.getContext('2d');
        let maxDim = Math.max(this.gridBuff.width, this.gridBuff.height);
        let lineCount = Math.ceil(maxDim / this.scaledCellWidth);

        lineCount += (lineCount % 2 == 0) ? 1 : 0;

        ctx.clearRect(0, 0, this.gridBuff.width, this.gridBuff.height);

        //draw lines
        ctx.strokeStyle = "#777";
        ctx.lineWidth = 2;
        ctx.beginPath();
        for (let i = 0; i < lineCount; i++){
            let offset = i * this.cell_px_width;
            let pos = new Victor(offset, offset);

            this.viewTransformPoint(pos);

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

        //draw test points
        ctx.fillStyle = 'black';
        ctx.fillRect(0, 0, 10, 10);
        ctx.fillRect(this.gridBuff.width - 10, this.gridBuff.height - 10, this.gridBuff.width, this.gridBuff.height);
    }

    viewTransformPoint(pt){
        pt.add(this.navData.rawOffset);
        pt.subtract(this.vpCenterWorld);
        pt.multiplyScalar(this.navData.zoomFac);
        pt.add(this.vpCenterWorldScaled);
    }
}

function mod(n, m){
    return ((n%m)+m)%m;
}