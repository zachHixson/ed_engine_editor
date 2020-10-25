import {ART_TOOL_SIZE} from '@/common/Enums';
import Util_2D from '@/common/Util_2D';

class Tool{
    constructor(){
        this.previewBuff = null;
        this.pixelBuff = null;
        this.cellWidth = 16;
        this.mouseCell = null;
        this.color = "#FFFFFF";
        this.size = null;
        this.isMouseDown = false;
        this.brushSize = 0;
        this.canDraw = true;
        this.commitCallback;
    }

    get brushPxSize(){
        switch(this.brushSize){
            case ART_TOOL_SIZE.SMALL:
                return 0
            case ART_TOOL_SIZE.MEDIUM:
                return 1
            case ART_TOOL_SIZE.LARGE:
                return 2
            default:
                return 0
        }
    }

    mouseDown(event){
        if (!this.canDraw){
            return
        }
        
        this.isMouseDown = true;
    }

    mouseUp(event){
        if (!this.canDraw){
            return
        }
        
        this.isMouseDown = false;
    }

    mouseMove(event){
        this.updateCursorBuff();
    }

    setMouseCell(vec){
        this.mouseCell = vec;
    }

    setPreviewBuff(previewBuff){
        this.previewBuff = previewBuff;
    }

    setPixelBuff(pixelBuff){
        this.pixelBuff = pixelBuff;
    }

    setCommitCallback(callback){
        this.commitCallback = callback;
    }

    setToolColor(color){
        this.color = color;
    }

    setToolSize(num){
        this.brushSize = num;
    }

    beforeDestroy(){}

    clearPreviewBuff(){
        for (let i = 0; i < this.previewBuff.length; i++){
            this.previewBuff[i] = '';
        }
    }

    updateCursorBuff(){}

    commitResult(){
        let canCommit = false;

        for (let i = 0; i < this.previewBuff.length; i++){
            if (this.previewBuff[i].length > 0){
                this.pixelBuff[i] = this.previewBuff[i];
                canCommit = true;
            }
        }

        this.clearPreviewBuff();

        if (canCommit && this.commitCallback != null){
            this.commitCallback();
        }
    }

    fillRect(x1, y1, x2, y2, color = this.color){
        let startX = Util_2D.clamp(x1, 0, this.cellWidth - 1);
        let startY = Util_2D.clamp(y1, 0, this.cellWidth - 1);
        let endX = Util_2D.clamp(x2, 0, this.cellWidth - 1);
        let endY = Util_2D.clamp(y2, 0, this.cellWidth - 1);

        for (let x = startX; x <= endX; x++){
            for (let y = startY; y <= endY; y++){
                this.previewBuff[Util_2D.get2DIdx(x, y, this.cellWidth)] = color;
            }
        }
    }
}

export default Tool;