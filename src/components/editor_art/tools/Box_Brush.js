import Tool from './Tool';
import {ART_TOOL_SIZE} from '@/common/Enums';
import Victor from 'victor';
import {isInBounds, get2DIdx} from '@/common/Util_2D';

class Box_Brush extends Tool{
    constructor(isFilled = false){
        super();
        this.isFilled = isFilled;
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
            this._mouseDown &&
            isInBounds(this.startPos.x, this.startPos.y, 0, 0, this.cellWidth - 1, this.cellWidth -1)
        ){
            this.drawBox(this.startPos, this.mouseCell, this.brushPxSize);
        }

        if (
            !this._mouseDown &&
            isInBounds(this.mouseCell.x, this.mouseCell.y, 0, 0, this.cellWidth - 1, this.cellWidth -1)
        ){
            switch(this.brushSize){
                case ART_TOOL_SIZE.SMALL:
                    this.previewBuff[get2DIdx(this.mouseCell.x, this.mouseCell.y, this.cellWidth)] = this.color;
                    break;
                case ART_TOOL_SIZE.MEDIUM:
                    this.fillRect(this.mouseCell.x, this.mouseCell.y, this.mouseCell.x + 1, this.mouseCell.y + 1);
                    break;
                case ART_TOOL_SIZE.LARGE:
                    this.fillRect(this.mouseCell.x, this.mouseCell.y, this.mouseCell.x + 2, this.mouseCell.y + 2);
                    break;
            }
        }
    }

    drawBox(vec1, vec2, thickness){
        let x1 = Math.min(vec1.x, vec2.x);
        let x2 = Math.max(vec1.x, vec2.x);
        let y1 = Math.min(vec1.y, vec2.y);
        let y2 = Math.max(vec1.y, vec2.y);

        for (let x = x1; x <= x2; x++){
            for (let y = y1; y <= y2; y++){
                let xyIdx = get2DIdx(x, y, this.cellWidth);
                
                if (isInBounds(x, y, 0, 0, this.cellWidth - 1, this.cellWidth - 1)){
                    if (this.isFilled){
                        this.previewBuff[xyIdx] = this.color;
                    }
                    else if (
                        (x <= x1 + thickness) ||
                        (x >= x2 - thickness) ||
                        (y <= y1 + thickness) ||
                        (y >= y2 - thickness)
                    ){
                        this.previewBuff[xyIdx] = this.color;
                    }
                }
            }
        }
    }
}

export default Box_Brush;