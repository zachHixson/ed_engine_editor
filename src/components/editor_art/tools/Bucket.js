import Tool from './Tool';
import Util_2D from '@/common/Util_2D';

class Bucket extends Tool{
    constructor(){
        super();
        this.sampledColor = null;
    }

    mouseDown(event){
        this.sampledColor = this.pixelBuff[Util_2D.get2DIdx(this.mouseCell.x, this.mouseCell.y, this.cellWidth)];

        if (Util_2D.isInBounds(this.mouseCell.x, this.mouseCell.y, 0, 0, this.cellWidth - 1, this.cellWidth - 1)){
            this.fill(this.mouseCell.x, this.mouseCell.y);
            this.commitResult();
        }
    }

    updateCursorBuff(){
        this.clearPreviewBuff();

        if (Util_2D.isInBounds(this.mouseCell.x, this.mouseCell.y, 0, 0, this.cellWidth - 1, this.cellWidth - 1)){
            this.sampledColor = this.pixelBuff[Util_2D.get2DIdx(this.mouseCell.x, this.mouseCell.y, this.cellWidth)];
            this.fill(this.mouseCell.x, this.mouseCell.y);
        }
    }

    fill(x, y){
        x = Util_2D.clamp(x, 0, this.cellWidth - 1);
        y = Util_2D.clamp(y, 0, this.cellWidth - 1);

        let xyIdx = Util_2D.get2DIdx(x, y, this.cellWidth);
        let spriteColor = this.pixelBuff[xyIdx];
        let previewColor = this.previewBuff[xyIdx];

        if (spriteColor == this.sampledColor && previewColor != this.color){
            this.previewBuff[xyIdx] = this.color;

            this.fill(x - 1, y);
            this.fill(x + 1, y);
            this.fill(x, y - 1);
            this.fill(x, y + 1);
        }
    }
}

export default Bucket;