class Tool{
    constructor(){
        this.previewBuff = null;
        this.pixelBuff = null;
        this.cellWidth = 16;
        this.mouseCell = null;
        this.color = new Shared.Color(255, 255, 255, 255);
        this.size = null;
        this._mouseDown = false;
        this.brushSize = Shared.ART_TOOL_SIZE.SMALL;
        this.canDraw = true;
        this.commitCallback;
    }

    get brushPxSize(){
        switch(this.brushSize){
            case Shared.ART_TOOL_SIZE.SMALL:
                return 0
            case Shared.ART_TOOL_SIZE.MEDIUM:
                return 1
            case Shared.ART_TOOL_SIZE.LARGE:
                return 2
            default:
                return 0
        }
    }

    _sampleColor(buffer, x, y){
        const idx = (y * buffer.width + x) * 4;
        return new Shared.Color(
            buffer.data[idx + 0],
            buffer.data[idx + 1],
            buffer.data[idx + 2],
            buffer.data[idx + 3],
        );
    }

    mouseDown(){
        if (this.canDraw){
            this._mouseDown = true;
        }
    }

    mouseUp(){
        if (this.canDraw){
            this._mouseDown = false;
        }
    }

    mouseMove(){
        if (this.canDraw){
            this.updateCursorBuff();
        }
    }

    mouseLeave(){
        if (this.canDraw && this._mouseDown){
            this.mouseUp();
        }

        this._mouseDown = false;
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

    enableDrawing(){
        this.canDraw = true;
    }

    disableDrawing(){
        this.canDraw = false;
    }

    beforeDestroy(){}

    clearPreviewBuff(){
        for (let i = 0; i < this.previewBuff.data.length; i++){
            this.previewBuff.data[i] = 0;
        }
    }

    updateCursorBuff(){}

    drawPixel(x, y, color){
        const idx = ((y * this.cellWidth) + x) * 4;
        this.previewBuff.data[idx + 0] = color.r;
        this.previewBuff.data[idx + 1] = color.g;
        this.previewBuff.data[idx + 2] = color.b;
        this.previewBuff.data[idx + 3] = color.a;
    }

    commitResult(){
        let canCommit = false;

        for (let i = 0; i < this.previewBuff.data.length; i += 4){
            if (this.previewBuff.data[i + 3] > 0){
                this.pixelBuff.data[i + 0] = this.previewBuff.data[i + 0];
                this.pixelBuff.data[i + 1] = this.previewBuff.data[i + 1];
                this.pixelBuff.data[i + 2] = this.previewBuff.data[i + 2];
                this.pixelBuff.data[i + 3] = this.previewBuff.data[i + 3];
                canCommit = true;
            }
        }

        this.clearPreviewBuff();

        if (canCommit && this.commitCallback != null){
            this.commitCallback();
        }
    }

    fillRect(x1, y1, x2, y2, color = this.color){
        let startX = Shared.clamp(x1, 0, this.cellWidth - 1);
        let startY = Shared.clamp(y1, 0, this.cellWidth - 1);
        let endX = Shared.clamp(x2, 0, this.cellWidth - 1);
        let endY = Shared.clamp(y2, 0, this.cellWidth - 1);

        for (let x = startX; x <= endX; x++){
            for (let y = startY; y <= endY; y++){
                this.drawPixel(x, y, color);
            }
        }
    }
}

export default Tool;