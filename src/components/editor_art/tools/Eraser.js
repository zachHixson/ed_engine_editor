import Tool from './Tool';
import Util_2D from '@/common/Util_2D';

class Eraser extends Tool{
    constructor(){
        super();
        this.pixelBuffCopy = [];
    }

    setPixelBuff(pixelBuff){
        super.setPixelBuff(pixelBuff);

        for (let i = 0; i < this.pixelBuff.length; i++){
            this.pixelBuffCopy.push('');
        }
        this.transferPixelBuff();
    }

    mouseDown(event){
        super.mouseDown(event);
    }

    mouseUp(event){
        super.mouseUp(event);
        this.commitResult();
        this.transferPixelBuff();
    }

    updateCursorBuff(){
        if (!this.isMouseDown){
            this.resetPreviewBuff();
        }

        if (Util_2D.isInBounds(this.mouseCell.x, this.mouseCell.y, 0, 0, this.cellWidth - 1, this.cellWidth - 1)){
            switch(this.brushSize){
                case 0:
                    this.previewBuff[Util_2D.get2DIdx(this.mouseCell.x, this.mouseCell.y, this.cellWidth)] = '';
                    break;
                case 1:
                    this.fillRect(this.mouseCell.x - 1, this.mouseCell.y - 1, this.mouseCell.x, this.mouseCell.y, '');
                    break;
                case 2:
                    this.fillRect(this.mouseCell.x - 1, this.mouseCell.y - 1, this.mouseCell.x + 1, this.mouseCell.y + 1, '');
                    break;
            }
        }
    }

    beforeDestroy(){
        super.beforeDestroy();

        for (let i = 0; i < this.pixelBuff.length; i++){
            this.pixelBuff[i] = this.previewBuff[i];
        }
    }

    transferPixelBuff(){
        for (let i = 0; i < this.pixelBuff.length; i++){
            this.pixelBuffCopy[i] = this.pixelBuff[i];
            this.previewBuff[i] = this.pixelBuff[i];
            this.pixelBuff[i] = '';
        }
    }

    resetPreviewBuff(){
        for (let i = 0; i < this.pixelBuffCopy.length; i++){
            this.previewBuff[i] = this.pixelBuffCopy[i];
        }
    }
}

export default Eraser;