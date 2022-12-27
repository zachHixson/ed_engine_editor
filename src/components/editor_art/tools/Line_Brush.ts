import Tool_Base from './Tool_Base';
import Core from '@/core';

type OffsetFunc = (offset: number)=>number;
type POrderFunc = (offset: number, p: number)=>{x:number, y:number};

export default class Line_Brush extends Tool_Base {
    private startPos: Core.Vector = new Core.Vector();

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
            Core.Util.isInBounds(this.startPos.x, this.startPos.y, 0, 0, this.cellWidth - 1, this.cellWidth - 1)
        ){
            const dx = (this.mouseCell.x - this.startPos.x);
            const dy = (this.mouseCell.y - this.startPos.y);
            const slope = (dx != 0) ? (dy / dx) : null;
            const isVertical = (Math.abs(slope!) >= 1) || (slope == null);
            const invSlope = (slope != null) ? (1 / slope) : 0;

            if (isVertical){
                this.drawLine(
                    this.startPos.y, this.mouseCell.y,
                    this.startPos.x, this.mouseCell.x,
                    slope!,
                    (offset) => {return offset += invSlope},
                    (offset, p) => {return {x:offset, y:p}}
                );
            }
            else{
                this.drawLine(
                    this.startPos.x, this.mouseCell.x,
                    this.startPos.y, this.mouseCell.y,
                    slope,
                    (offset) => {return offset += slope},
                    (offset, p) => {return {x:p, y:offset}}
                );
            }
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
                    this.fillRect(x - 1, y - 1, x + 1, y + 1);
                    break;
            }
        }
    }

    drawLine(a: number, b: number, offset1: number, offset2: number, slope: number, offsetFunc: OffsetFunc, pOrderFunc: POrderFunc): void {
        const start = Math.min(a, b);
        const end = Math.max(a, b);
        let offset = (slope >= 0) ? Math.min(offset1, offset2) : Math.max(offset1, offset2);

        for (let p = start; p <= end; p++){
            let intOffset = Math.round(offset);
            let pOrder = pOrderFunc(intOffset, p);

            this.drawPoint(pOrder.x, pOrder.y);
            offset = offsetFunc(offset);
        }
    }

    drawPoint(x: number, y: number): void {
        if (Core.Util.isInBounds(x, y, 0, 0, this.cellWidth - 1, this.cellWidth - 1)){
            switch(this.brushSize){
                case Core.ART_TOOL_SIZE.SMALL:
                    this.drawPixel(x, y, this.color);
                    break;
                case Core.ART_TOOL_SIZE.MEDIUM:
                    this.fillRect(x, y, x + 1, y + 1);
                    break;
                case Core.ART_TOOL_SIZE.LARGE:
                    this.fillRect(x - 1, y - 1, x + 1, y + 1);
                    break;
            }
        }
    }
}