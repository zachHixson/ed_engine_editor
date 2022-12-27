import Tool_Base from './Tool_Base';
import Core from '@/core';

export default class Brush extends Tool_Base {
    constructor(){
        super();
    }

    mouseUp(event: MouseEvent): void {
        super.mouseUp(event);
        this.commitResult();
    }

    updateCursorBuff(){
        if (!this._mouseDown){
            this.clearPreviewBuff();
        }

        if (Core.Util.isInBounds(this.mouseCell.x, this.mouseCell.y, 0, 0, this.cellWidth - 1, this.cellWidth - 1)){
            switch(this.brushSize){
                case Core.ART_TOOL_SIZE.SMALL:
                    this.drawPixel(this.mouseCell.x, this.mouseCell.y, this.color);
                    break;
                case Core.ART_TOOL_SIZE.MEDIUM:
                    this.fillRect(this.mouseCell.x - 1, this.mouseCell.y - 1, this.mouseCell.x, this.mouseCell.y);
                    break;
                case Core.ART_TOOL_SIZE.LARGE:
                    this.fillRect(this.mouseCell.x - 1, this.mouseCell.y - 1, this.mouseCell.x + 1, this.mouseCell.y + 1);
                    break;
            }
        }
    }
}