import Tool from './Tool';

class Eraser extends Tool{
    constructor(){
        super();
        this.canCommit = false;
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
        const CURSOR_COLOR = '#FFFFFFAA';

        this.clearPreviewBuff();

        if (Shared.isInBounds(this.mouseCell.x, this.mouseCell.y, 0, 0, this.cellWidth - 1, this.cellWidth - 1)){
            this.canCommit = true;

            //erase sprite data
            if (this._mouseDown){
                switch(this.brushSize){
                    case Shared.ART_TOOL_SIZE.SMALL:
                        this.pixelBuff[Shared.get2DIdx(this.mouseCell.x, this.mouseCell.y, this.cellWidth)] = '';
                        break;
                    case Shared.ART_TOOL_SIZE.MEDIUM:
                        this.clearRect(this.mouseCell.x - 1, this.mouseCell.y - 1, this.mouseCell.x, this.mouseCell.y);
                        break;
                    case Shared.ART_TOOL_SIZE.LARGE:
                        this.clearRect(this.mouseCell.x - 1, this.mouseCell.y - 1, this.mouseCell.x + 1, this.mouseCell.y + 1);
                        break;
                }
            }

            //draw preview cursor
            switch(this.brushSize){
                case Shared.ART_TOOL_SIZE.SMALL:
                    this.previewBuff[Shared.get2DIdx(this.mouseCell.x, this.mouseCell.y, this.cellWidth)] = CURSOR_COLOR;
                    break;
                case Shared.ART_TOOL_SIZE.MEDIUM:
                    this.fillRect(this.mouseCell.x - 1, this.mouseCell.y - 1, this.mouseCell.x, this.mouseCell.y, CURSOR_COLOR);
                    break;
                case Shared.ART_TOOL_SIZE.LARGE:
                    this.fillRect(this.mouseCell.x - 1, this.mouseCell.y - 1, this.mouseCell.x + 1, this.mouseCell.y + 1, CURSOR_COLOR);
                    break;
            }
        }
    }

    commitResult(){
        if (this.canCommit && this.commitCallback != null){
            this.commitCallback();
        }
    }

    clearRect(x1, y1, x2, y2){
        let startX = Shared.clamp(x1, 0, this.cellWidth - 1);
        let startY = Shared.clamp(y1, 0, this.cellWidth - 1);
        let endX = Shared.clamp(x2, 0, this.cellWidth - 1);
        let endY = Shared.clamp(y2, 0, this.cellWidth - 1);

        for (let x = startX; x <= endX; x++){
            for (let y = startY; y <= endY; y++){
                this.pixelBuff[Shared.get2DIdx(x, y, this.cellWidth)] = '';
            }
        }
    }
}

export default Eraser;