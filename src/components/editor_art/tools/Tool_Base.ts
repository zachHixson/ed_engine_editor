import Core from '@/core';

export default abstract class Tool_Base {
    protected previewBuff: ImageData = new ImageData(16, 16);
    protected pixelBuff: ImageData = new ImageData(16, 16);
    protected cellWidth = 16;
    protected mouseCell: Core.Vector = new Core.Vector();
    protected color: Core.Draw.Color = new Core.Draw.Color(255, 255, 255, 255);
    protected _mouseDown: boolean = false;
    protected brushSize : Core.ART_TOOL_SIZE = Core.ART_TOOL_SIZE.SMALL;
    protected commitCallback: ()=>void = ()=>{};
    protected renderCallback: ()=>void = ()=>{};

    canDraw: boolean = true;

    get brushPxSize(){
        switch(this.brushSize){
            case Core.ART_TOOL_SIZE.SMALL:
                return 0
            case Core.ART_TOOL_SIZE.MEDIUM:
                return 1
            case Core.ART_TOOL_SIZE.LARGE:
                return 2
            default:
                return 0
        }
    }

    protected _sampleColor(buffer: ImageData, x: number, y: number): Core.Draw.Color {
        const idx = (y * buffer.width + x) * 4;
        return new Core.Draw.Color(
            buffer.data[idx + 0],
            buffer.data[idx + 1],
            buffer.data[idx + 2],
            buffer.data[idx + 3],
        );
    }

    mouseDown(event: MouseEvent): void {
        if (this.canDraw){
            this._mouseDown = true;
        }
    }

    mouseUp(event: MouseEvent): void {
        if (this.canDraw){
            this._mouseDown = false;
        }
    }

    mouseMove(event: MouseEvent): void {
        if (this.canDraw){
            this.updateCursorBuff();
        }
    }

    mouseLeave(event: MouseEvent): void {
        if (this.canDraw && this._mouseDown){
            this.mouseUp(event);
        }

        this._mouseDown = false;
    }

    setMouseCell(vec: Core.Vector): void {
        this.mouseCell = vec;
    }

    setPreviewBuff(previewBuff: ImageData): void {
        this.previewBuff = previewBuff;
    }

    setPixelBuff(pixelBuff: ImageData): void {
        this.pixelBuff = pixelBuff;
    }

    setCommitCallback(callback: ()=>void): void {
        this.commitCallback = callback;
    }

    setRenderCallback(callback: ()=>void): void {
        this.renderCallback = callback;
    }

    setToolColor(color: Core.Draw.Color): void {
        this.color = color;
    }

    setToolSize(val: Core.ART_TOOL_SIZE): void {
        this.brushSize = val;
    }

    enableDrawing(): void {
        this.canDraw = true;
    }

    disableDrawing(): void {
        this.canDraw = false;
    }

    beforeDestroy(): void {}

    clearPreviewBuff(){
        for (let i = 0; i < this.previewBuff.data.length; i++){
            this.previewBuff.data[i] = 0;
        }
    }

    abstract updateCursorBuff(): void;

    drawPixel(x: number, y: number, color: Core.Draw.Color): void {
        const idx = ((y * this.cellWidth) + x) * 4;
        this.previewBuff.data[idx + 0] = color.r;
        this.previewBuff.data[idx + 1] = color.g;
        this.previewBuff.data[idx + 2] = color.b;
        this.previewBuff.data[idx + 3] = color.a;
    }

    commitResult(): void {
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

    fillRect(x1: number, y1: number, x2: number, y2: number, color: Core.Draw.Color = this.color): void {
        const startX = Core.Util.clamp(x1, 0, this.cellWidth - 1);
        const startY = Core.Util.clamp(y1, 0, this.cellWidth - 1);
        const endX = Core.Util.clamp(x2, 0, this.cellWidth - 1);
        const endY = Core.Util.clamp(y2, 0, this.cellWidth - 1);

        for (let x = startX; x <= endX; x++){
            for (let y = startY; y <= endY; y++){
                this.drawPixel(x, y, color);
            }
        }
    }
}