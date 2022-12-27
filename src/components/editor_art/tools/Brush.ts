import Tool from './Tool';

class Brush extends Tool{
    constructor(){
        super();
    }

    mouseUp(event){
        super.mouseUp(event);
        this.commitResult();
    }

    updateCursorBuff(){
        if (!this._mouseDown){
            this.clearPreviewBuff();
        }

        if (Shared.isInBounds(this.mouseCell.x, this.mouseCell.y, 0, 0, this.cellWidth - 1, this.cellWidth - 1)){
            switch(this.brushSize){
                case Shared.ART_TOOL_SIZE.SMALL:
                    this.drawPixel(this.mouseCell.x, this.mouseCell.y, this.color);
                    break;
                case Shared.ART_TOOL_SIZE.MEDIUM:
                    this.fillRect(this.mouseCell.x - 1, this.mouseCell.y - 1, this.mouseCell.x, this.mouseCell.y);
                    break;
                case Shared.ART_TOOL_SIZE.LARGE:
                    this.fillRect(this.mouseCell.x - 1, this.mouseCell.y - 1, this.mouseCell.x + 1, this.mouseCell.y + 1);
                    break;
            }
        }
    }
}

export default Brush;