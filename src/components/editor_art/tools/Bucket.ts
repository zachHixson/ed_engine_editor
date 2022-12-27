import Tool from './Tool';

class Bucket extends Tool{
    constructor(){
        super();
        this.sampledColor = null;
    }

    mouseDown(event){
        this.sampledColor = this._sampleColor(this.pixelBuff, this.mouseCell.x, this.mouseCell.y);

        if (Shared.isInBounds(this.mouseCell.x, this.mouseCell.y, 0, 0, this.cellWidth - 1, this.cellWidth - 1)){
            this.fill(this.mouseCell.x, this.mouseCell.y);
            this.commitResult();
        }
    }

    updateCursorBuff(){
        this.clearPreviewBuff();

        if (Shared.isInBounds(this.mouseCell.x, this.mouseCell.y, 0, 0, this.cellWidth - 1, this.cellWidth - 1)){
            this.sampledColor = this._sampleColor(this.pixelBuff, this.mouseCell.x, this.mouseCell.y);
            this.fill(this.mouseCell.x, this.mouseCell.y);
        }
    }

    fill(x, y){
        x = Shared.clamp(x, 0, this.cellWidth - 1);
        y = Shared.clamp(y, 0, this.cellWidth - 1);

        let spriteColor = this._sampleColor(this.pixelBuff, x, y);
        let previewColor = this._sampleColor(this.previewBuff, x, y);

        if (spriteColor.compare(this.sampledColor) && !previewColor.compare(this.color)){
            this.drawPixel(x, y, this.color);

            this.fill(x - 1, y);
            this.fill(x + 1, y);
            this.fill(x, y - 1);
            this.fill(x, y + 1);
        }
    }
}

export default Bucket;