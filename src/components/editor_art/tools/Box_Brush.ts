import Tool_Base  from './Tool_Base';
import Core from '@/core';

export default class Box_Brush extends Tool_Base {
    private isFilled: boolean;
    private startPos: Core.Vector = new Core.Vector();

    constructor(isFilled = false){
        super();
        this.isFilled = isFilled;
    }

    mouseDown(event: MouseEvent): void {
        super.mouseDown(event);
        this.startPos.copy(this.mouseCell);
    }

    mouseUp(event: MouseEvent): void {
        super.mouseUp(event);
        this.commitResult();
    }

    updateCursorBuff(): void {
        this.clearPreviewBuff();

        if (
            this._mouseDown &&
            Core.Util.isInBounds(this.startPos.x, this.startPos.y, 0, 0, this.cellWidth - 1, this.cellWidth -1)
        ){
            this.drawBox(this.startPos, this.mouseCell, this.brushPxSize);
        }

        if (
            !this._mouseDown &&
            Core.Util.isInBounds(this.mouseCell.x, this.mouseCell.y, 0, 0, this.cellWidth - 1, this.cellWidth -1)
        ){
            const {x, y} = this.mouseCell;

            switch(this.brushSize){
                case Core.ART_TOOL_SIZE.SMALL:
                    this.drawPixel(x, y, this.color);
                    break;
                case Core.ART_TOOL_SIZE.MEDIUM:
                    this.fillRect(x, y, x + 1, y + 1);
                    break;
                case Core.ART_TOOL_SIZE.LARGE:
                    this.fillRect(x, y, x + 2, y + 2);
                    break;
            }
        }
    }

    drawBox(vec1: Core.Vector, vec2: Core.Vector, thickness: number): void {
        const x1 = Math.min(vec1.x, vec2.x);
        const x2 = Math.max(vec1.x, vec2.x);
        const y1 = Math.min(vec1.y, vec2.y);
        const y2 = Math.max(vec1.y, vec2.y);

        for (let x = x1; x <= x2; x++){
            for (let y = y1; y <= y2; y++){
                if (Core.Util.isInBounds(x, y, 0, 0, this.cellWidth - 1, this.cellWidth - 1)){
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