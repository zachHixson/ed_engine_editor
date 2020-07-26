import Tool from './Tool';
import Victor from 'victor';
import Util_2D from '@/common/Util_2D';

class Line_Brush extends Tool{
    constructor(){
        super();
        this.startPos = new Victor(0, 0);
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
            this.isMouseDown &&
            Util_2D.isInBounds(this.startPos.x, this.startPos.y, 0, 0, this.cellWidth - 1, this.cellWidth - 1)
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
    }

    drawLine(a, b, offset1, offset2, slope, offsetFunc, pOrderFunc){
        let start = Math.min(a, b);
        let end = Math.max(a, b);
        let offset = (slope >= 0) ? Math.min(offset1, offset2) : Math.max(offset1, offset2);

        for (let p = start; p <= end; p++){
            let intOffset = Math.round(offset);
            let pOrder = pOrderFunc(intOffset, p);

            this.drawPixel(pOrder.x, pOrder.y);
            offset = offsetFunc(offset);
        }
    }

    drawPixel(x, y){
        if (Util_2D.isInBounds(x, y, 0, 0, this.cellWidth - 1, this.cellWidth - 1)){
            switch(this.brushSize){
                case 0:
                    let xyIdx = Util_2D.get2DIdx(x, y, this.cellWidth);
                    this.previewBuff[xyIdx] = this.color;
                    break;
                case 1:
                    this.fillRect(x, y, x + 1, y + 1);
                    break;
                case 2:
                    this.fillRect(x - 1, y - 1, x + 1, y + 1);
                    break;
            }
        }
    }
}

export default Line_Brush;