import Tool from './Tool';

class Line_Brush extends Tool{
    constructor(){
        super();
        this.startPos = new Vector(0, 0);
    }

    mouseDown(event){
        super.mouseDown(event);
        this.startPos.copy(this.mouseCell);
    }

    mouseUp(event){
        super.mouseUp(event);
        this.commitResult();
    }

    updateCursorBuff(){
        this.clearPreviewBuff();

        if (
            this._mouseDown &&
            Shared.isInBounds(this.startPos.x, this.startPos.y, 0, 0, this.cellWidth - 1, this.cellWidth - 1)
        ){
            let dx = (this.mouseCell.x - this.startPos.x);
            let dy = (this.mouseCell.y - this.startPos.y);
            let slope = (dx != 0) ? (dy / dx) : null;
            let isVertical = (Math.abs(slope) >= 1) || (slope == null);
            let invSlope = (slope != null) ? (1 / slope) : 0;

            if (isVertical){
                this.drawLine(
                    this.startPos.y, this.mouseCell.y,
                    this.startPos.x, this.mouseCell.x,
                    slope,
                    (offset) => {return offset += invSlope},
                    (offset, p) => {return {x:offset, y:p}}
                );
            }
            else{
                this.drawLine(
                    this.startPos.x, this.mouseCell.x,
                    this.startPos.y, this.mouseCell.y,
                    slope,
                    (offset) => {return offset += slope},
                    (offset, p) => {return {x:p, y:offset}}
                );
            }
        }

        if (
            !this._mouseDown &&
            Shared.isInBounds(this.mouseCell.x, this.mouseCell.y, 0, 0, this.cellWidth - 1, this.cellWidth -1)
        ){
            const {x, y} = this.mouseCell;

            switch(this.brushSize){
                case Shared.ART_TOOL_SIZE.SMALL:
                    this.drawPixel(x, y, this.color);
                    break;
                case Shared.ART_TOOL_SIZE.MEDIUM:
                    this.fillRect(x, y, x + 1, y + 1);
                    break;
                case Shared.ART_TOOL_SIZE.LARGE:
                    this.fillRect(x - 1, y - 1, x + 1, y + 1);
                    break;
            }
        }
    }

    drawLine(a, b, offset1, offset2, slope, offsetFunc, pOrderFunc){
        let start = Math.min(a, b);
        let end = Math.max(a, b);
        let offset = (slope >= 0) ? Math.min(offset1, offset2) : Math.max(offset1, offset2);

        for (let p = start; p <= end; p++){
            let intOffset = Math.round(offset);
            let pOrder = pOrderFunc(intOffset, p);

            this.drawPoint(pOrder.x, pOrder.y);
            offset = offsetFunc(offset);
        }
    }

    drawPoint(x, y){
        if (Shared.isInBounds(x, y, 0, 0, this.cellWidth - 1, this.cellWidth - 1)){
            switch(this.brushSize){
                case Shared.ART_TOOL_SIZE.SMALL:
                    this.drawPixel(x, y, this.color);
                    break;
                case Shared.ART_TOOL_SIZE.MEDIUM:
                    this.fillRect(x, y, x + 1, y + 1);
                    break;
                case Shared.ART_TOOL_SIZE.LARGE:
                    this.fillRect(x - 1, y - 1, x + 1, y + 1);
                    break;
            }
        }
    }
}

export default Line_Brush;