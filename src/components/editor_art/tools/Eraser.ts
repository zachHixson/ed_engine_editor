import Tool from './Tool';

class Eraser extends Tool{
    constructor(){
        super();
        this.canCommit = false;
        this.CURSOR_COLOR = new Shared.Color(255, 255, 255, 170);
    }

    mouseDown(event){
        super.mouseDown(event);
        this.updateCursorBuff();

        if (!Shared.isInBounds(this.mouseCell.x, this.mouseCell.y, 0, 0, this.cellWidth - 1, this.cellWidth - 1)){
            this.canCommit = false;
        }
    }

    mouseUp(event){
        super.mouseUp(event);
        this.commitResult();
    }

    updateCursorBuff(){
        const {x, y} = this.mouseCell;

        this.clearPreviewBuff();

        if (Shared.isInBounds(x, y, 0, 0, this.cellWidth - 1, this.cellWidth - 1)){
            this.canCommit = true;

            //erase sprite data
            if (this._mouseDown){
                switch(this.brushSize){
                    case Shared.ART_TOOL_SIZE.SMALL:
                        this.erasePixel(x, y);
                        break;
                    case Shared.ART_TOOL_SIZE.MEDIUM:
                        this.clearRect(x - 1, y - 1, x, y);
                        break;
                    case Shared.ART_TOOL_SIZE.LARGE:
                        this.clearRect(x - 1, y - 1, x + 1, y + 1);
                        break;
                }
            }

            //draw preview cursor
            switch(this.brushSize){
                case Shared.ART_TOOL_SIZE.SMALL:
                    this.drawPixel(x, y, this.CURSOR_COLOR);
                    break;
                case Shared.ART_TOOL_SIZE.MEDIUM:
                    this.fillRect(x - 1, y - 1, x, y, this.CURSOR_COLOR);
                    break;
                case Shared.ART_TOOL_SIZE.LARGE:
                    this.fillRect(x - 1, y - 1, x + 1, y + 1, this.CURSOR_COLOR);
                    break;
            }
        }
    }

    commitResult(){
        if (this.canCommit && this.commitCallback != null){
            this.commitCallback();
        }
    }

    erasePixel(x, y){
        const idx = ((y * this.cellWidth) + x) * 4;
        this.pixelBuff.data[idx + 0] = 0;
        this.pixelBuff.data[idx + 1] = 0;
        this.pixelBuff.data[idx + 2] = 0;
        this.pixelBuff.data[idx + 3] = 0;
    }

    clearRect(x1, y1, x2, y2){
        let startX = Shared.clamp(x1, 0, this.cellWidth - 1);
        let startY = Shared.clamp(y1, 0, this.cellWidth - 1);
        let endX = Shared.clamp(x2, 0, this.cellWidth - 1);
        let endY = Shared.clamp(y2, 0, this.cellWidth - 1);

        for (let x = startX; x <= endX; x++){
            for (let y = startY; y <= endY; y++){
                this.erasePixel(x, y);
            }
        }
    }
}

export default Eraser;