import Tool from './Tool';
import {ART_TOOL_SIZE} from '@/common/Enums';
import Util_2D from '@/common/Util_2D';

class Brush extends Tool{
    constructor(){
        super();
    }

    mouseUp(event){
        super.mouseUp(event);
        this.commitResult();
    }

    updateCursorBuff(){
        if (!this.isMouseDown){
            this.clearPreviewBuff();
        }

        if (Util_2D.isInBounds(this.mouseCell.x, this.mouseCell.y, 0, 0, this.cellWidth - 1, this.cellWidth - 1)){
            switch(this.brushSize){
                case ART_TOOL_SIZE.SMALL:
                    this.previewBuff[Util_2D.get2DIdx(this.mouseCell.x, this.mouseCell.y, this.cellWidth)] = this.color;
                    break;
                case ART_TOOL_SIZE.MEDIUM:
                    this.fillRect(this.mouseCell.x - 1, this.mouseCell.y - 1, this.mouseCell.x, this.mouseCell.y);
                    break;
                case ART_TOOL_SIZE.LARGE:
                    this.fillRect(this.mouseCell.x - 1, this.mouseCell.y - 1, this.mouseCell.x + 1, this.mouseCell.y + 1);
                    break;
            }
        }
    }
}

export default Brush;