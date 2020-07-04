import Tool from './Tool';
import Victor from 'victor';
import Util_2D from '@/common/Util_2D';

class Ellipse_Brush extends Tool{
    constructor(isFilled = false){
        super();
        this.isFilled = isFilled;
        this.startPos = new Victor(0, 0);
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
            this.isMouseDown &&
            Util_2D.isInBounds(this.startPos.x, this.startPos.y, 0, 0, this.cellWidth - 1, this.cellWidth -1)
        ){
            this.drawEllipse(this.startPos, this.mouseCell, this.brushSize);
        }
    }

    drawEllipse(vec1, vec2, thickness){
        let x1 = Math.min(vec1.x, vec2.x);
        let x2 = Math.max(vec1.x, vec2.x);
        let y1 = Math.min(vec1.y, vec2.y);
        let y2 = Math.max(vec1.y, vec2.y);
        let a = (x2 - x1) / 2;
        let b = (y2 - y1) / 2;
        let midPoint = new Victor(x1 + x2, y1 + y2).divideScalar(2);

        thickness += 1;

        for (let x = x1; x <= x2; x++){
            for (let y = y1; y <= y2; y++){
                if (Util_2D.isInBounds(x, y, 0, 0, this.cellWidth - 1, this.cellWidth - 1)){
                    let xyIdx = Util_2D.get2DIdx(x, y, this.cellWidth);
                    let curPoint = this.isPointInEllipse(new Victor(x, y), midPoint, a, b);
                    let innerA = a - thickness;
                    let innerB = b - thickness;
                    let innerCheck = Math.ceil(this.isPointInEllipse(new Victor(x, y), midPoint, a - thickness, b - thickness));

                    innerCheck = (innerA > 1 && innerB > 1) ? innerCheck : 2;

                    if (curPoint <= 1 && this.isFilled){
                        this.previewBuff[xyIdx] = this.color;
                    }
                    else if (curPoint <= 1 && innerCheck > 1){
                        this.previewBuff[xyIdx] = this.color;
                    }
                }
            }
        }
    }

    isPointInEllipse(point, center, a, b){
        let lhs = Math.pow(point.x - center.x, 2) / Math.pow(a, 2);
        let rhs = Math.pow(point.y - center.y, 2) / Math.pow(b, 2);
        return (lhs + rhs);
    }
}

export default Ellipse_Brush;