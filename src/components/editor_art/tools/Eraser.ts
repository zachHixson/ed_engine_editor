import Tool_Base from './Tool_Base';
import Core from '@/core';

export default class Eraser extends Tool_Base {
    private CURSOR_COLOR = new Core.Draw.Color(255, 255, 255, 170);

    canCommit: boolean = false;

    mouseDown(event: MouseEvent): void {
        super.mouseDown(event);
        this.updateCursorBuff();

        if (!Core.Util.isInBounds(this.mouseCell.x, this.mouseCell.y, 0, 0, this.cellWidth - 1, this.cellWidth - 1)){
            this.canCommit = false;
        }
    }

    mouseUp(event: MouseEvent): void {
        super.mouseUp(event);
        this.commitResult();
    }

    updateCursorBuff(): void {
        const {x, y} = this.mouseCell;

        this.clearPreviewBuff();

        if (Core.Util.isInBounds(x, y, 0, 0, this.cellWidth - 1, this.cellWidth - 1)){
            this.canCommit = true;

            //erase sprite data
            if (this._mouseDown){
                switch(this.brushSize){
                    case Core.ART_TOOL_SIZE.SMALL:
                        this.erasePixel(x, y);
                        break;
                    case Core.ART_TOOL_SIZE.MEDIUM:
                        this.clearRect(x - 1, y - 1, x, y);
                        break;
                    case Core.ART_TOOL_SIZE.LARGE:
                        this.clearRect(x - 1, y - 1, x + 1, y + 1);
                        break;
                }
            }

            //draw preview cursor
            switch(this.brushSize){
                case Core.ART_TOOL_SIZE.SMALL:
                    this.drawPixel(x, y, this.CURSOR_COLOR);
                    break;
                case Core.ART_TOOL_SIZE.MEDIUM:
                    this.fillRect(x - 1, y - 1, x, y, this.CURSOR_COLOR);
                    break;
                case Core.ART_TOOL_SIZE.LARGE:
                    this.fillRect(x - 1, y - 1, x + 1, y + 1, this.CURSOR_COLOR);
                    break;
            }
        }

        this.renderCallback();
    }

    commitResult(): void {
        if (this.canCommit && this.commitCallback != null){
            this.commitCallback();
        }
    }

    erasePixel(x: number, y: number): void {
        const idx = ((y * this.cellWidth) + x) * 4;
        this.pixelBuff.data[idx + 0] = 0;
        this.pixelBuff.data[idx + 1] = 0;
        this.pixelBuff.data[idx + 2] = 0;
        this.pixelBuff.data[idx + 3] = 0;
    }

    clearRect(x1: number, y1: number, x2: number, y2: number): void {
        const startX = Core.Util.clamp(x1, 0, this.cellWidth - 1);
        const startY = Core.Util.clamp(y1, 0, this.cellWidth - 1);
        const endX = Core.Util.clamp(x2, 0, this.cellWidth - 1);
        const endY = Core.Util.clamp(y2, 0, this.cellWidth - 1);

        for (let x = startX; x <= endX; x++){
            for (let y = startY; y <= endY; y++){
                this.erasePixel(x, y);
            }
        }
    }
}