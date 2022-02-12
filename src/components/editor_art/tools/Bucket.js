import Tool from './Tool';

class Bucket extends Tool{
    constructor(){
        super();
        this.sampledColor = null;
    }

    mouseDown(event){
        this.sampledColor = this.pixelBuff[Shared.get2DIdx(this.mouseCell.x, this.mouseCell.y, this.cellWidth)];

        if (Shared.isInBounds(this.mouseCell.x, this.mouseCell.y, 0, 0, this.cellWidth - 1, this.cellWidth - 1)){
            this.fill(this.mouseCell.x, this.mouseCell.y);
            this.commitResult();
        }
    }

    updateCursorBuff(){
        this.clearPreviewBuff();

        if (Shared.isInBounds(this.mouseCell.x, this.mouseCell.y, 0, 0, this.cellWidth - 1, this.cellWidth - 1)){
            this.sampledColor = this.pixelBuff[Shared.get2DIdx(this.mouseCell.x, this.mouseCell.y, this.cellWidth)];
            this.fill(this.mouseCell.x, this.mouseCell.y);
        }
    }

    fill(x, y){
        x = Shared.clamp(x, 0, this.cellWidth - 1);
        y = Shared.clamp(y, 0, this.cellWidth - 1);

        let xyIdx = Shared.get2DIdx(x, y, this.cellWidth);
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