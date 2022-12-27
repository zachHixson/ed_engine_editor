import Tool from './Tool';

class Box_Brush extends Tool{
    constructor(isFilled = false){
        super();
        this.isFilled = isFilled;
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
            Shared.isInBounds(this.startPos.x, this.startPos.y, 0, 0, this.cellWidth - 1, this.cellWidth -1)
        ){
            this.drawBox(this.startPos, this.mouseCell, this.brushPxSize);
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
                    this.fillRect(x, y, x + 2, y + 2);
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
                if (Shared.isInBounds(x, y, 0, 0, this.cellWidth - 1, this.cellWidth - 1)){
                    if (this.isFilled){
                        this.drawPixel(x, y, this.color);
                    }
                    else if (
                        (x <= x1 + thickness) ||
                        (x >= x2 - thickness) ||
                        (y <= y1 + thickness) ||
                        (y >= y2 - thickness)
                    ){
                        this.drawPixel(x, y, this.color);
                    }
                }
            }
        }
    }
}

export default Box_Brush;