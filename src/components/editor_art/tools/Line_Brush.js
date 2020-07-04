import Tool from './Tool';
import Victor from 'victor';
import Util_2D from '@/common/Util_2D';

class Line_Brush extends Tool{
    constructor(){
        super();
        this.startPos = new Victor(0, 0);
        this.slope;
        this.isVertical;
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
            this.slope = (dx != 0) ? (dy / dx) : null;
            this.isVertical = (Math.abs(this.slope) >= 1) || (this.slope == null);

            if (this.isVertical){
                this.drawLine(this.startPos.y, this.mouseCell.y, this.startPos.x, this.mouseCell.x);
            }
            else{
                this.drawLine(this.startPos.x, this.mouseCell.x, this.startPos.y, this.mouseCell.y);
            }
        }
    }

    drawLine(a, b, offset1, offset2){
        let start = Math.min(a, b);
        let end = Math.max(a, b);
        let offset = (this.slope >= 0) ? Math.min(offset1, offset2) : Math.max(offset1, offset2);
        let invSlope = (this.slope != null) ? (1 / this.slope) : 0;

        for (let p = start; p <= end; p++){
            let intOffset = Math.round(offset);

            if (this.isVertical){
                this.drawPixel(intOffset, p);
                offset += invSlope;
            }
            else{
                this.drawPixel(p, intOffset);
                offset += this.slope;
            }
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