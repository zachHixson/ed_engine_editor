import Tool_Base from './Tool_Base';
import Core from '@/core';

const { Vector } = Core;

export default class Ellipse_Brush extends Tool_Base {
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
            this.drawEllipse(this.startPos, this.mouseCell, this.brushPxSize);
        }

        if (
            !this._mouseDown &&
            Core.Util.isInBounds(this.mouseCell.x, this.mouseCell.y, 0, 0, this.cellWidth - 1, this.cellWidth -1)
        ){
            this.drawPixel(this.mouseCell.x, this.mouseCell.y, this.color);
        }
    }

    drawEllipse(vec1: Core.Vector, vec2: Core.Vector, thickness: number){
        let x1 = Math.min(vec1.x, vec2.x);
        let x2 = Math.max(vec1.x, vec2.x);
        let y1 = Math.min(vec1.y, vec2.y);
        let y2 = Math.max(vec1.y, vec2.y);
        let a = (x2 - x1) / 2;
        let b = (y2 - y1) / 2;
        let midPoint = new Vector(x1 + x2, y1 + y2).divideScalar(2);

        thickness += 1;

        for (let x = x1; x <= x2; x++){
            for (let y = y1; y <= y2; y++){
                if (Core.Util.isInBounds(x, y, 0, 0, this.cellWidth - 1, this.cellWidth - 1)){
                    let curPoint = this.isPointInEllipse(new Vector(x, y), midPoint, a, b);
                    let innerA = a - thickness;
                    let innerB = b - thickness;
                    let innerCheck = Math.ceil(this.isPointInEllipse(new Vector(x, y), midPoint, a - thickness, b - thickness));

                    innerCheck = (innerA > 1 && innerB > 1) ? innerCheck : 2;

                    if (curPoint <= 1 && this.isFilled){
                        this.drawPixel(x, y, this.color);
                    }
                    else if (curPoint <= 1 && innerCheck > 1){
                        this.drawPixel(x, y, this.color);
                    }
                }
            }
        }
    }

    isPointInEllipse(point: Core.Vector, center: Core.Vector, a: number, b: number){
        let lhs = Math.pow(point.x - center.x, 2) / Math.pow(a, 2);
        let rhs = Math.pow(point.y - center.y, 2) / Math.pow(b, 2);
        return (lhs + rhs);
    }
}