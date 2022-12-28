import Core from '@/core';

export default class Art_Canvas_Renderer{
    private readonly GRID_DIV = Core.Sprite.DIMENSIONS;
    private readonly CANVAS_WIDTH = this.GRID_DIV * 20;

    private canvas: HTMLCanvasElement;
    private checkerBGBuff: HTMLCanvasElement;
    private checkerStencilBuff: HTMLCanvasElement;
    private pixelBuff: HTMLCanvasElement;
    private gridBuff: HTMLCanvasElement;
    private previewBuff: HTMLCanvasElement;
    private spriteData: ImageData;
    private previewData: ImageData;
    private navState: Core.iNavState;

    constructor(element: HTMLCanvasElement, spriteData: ImageData, previewData: ImageData, navState: Core.iNavState){
        this.canvas = element;
        this.checkerBGBuff = Core.Draw.createHDPICanvas(this.canvas.width, this.canvas.height);
        this.checkerStencilBuff = Core.Draw.createHDPICanvas(this.canvas.width, this.canvas.height);
        this.pixelBuff = Core.Draw.createCanvas(this.GRID_DIV, this.GRID_DIV);
        this.gridBuff = Core.Draw.createHDPICanvas(this.canvas.width, this.canvas.height);
        this.previewBuff = Core.Draw.createCanvas(this.GRID_DIV, this.GRID_DIV);
        this.spriteData = spriteData;
        this.previewData = previewData;
        this.navState = navState;

        this.fullRedraw();
    }

    getTranslate(): Core.Vector {
        return new Core.Vector(
            (this.canvas.width / 2) + (this.navState.offset.x * this.navState.zoomFac),
            (this.canvas.height / 2) + (this.navState.offset.y * this.navState.zoomFac)
        );
    }

    fullRedraw(): void {
        const ctx = this.canvas.getContext("2d")!;

        this.drawCheckerBG();
        this.drawBGStencil();
        this.drawSpriteData();
        this.drawGrid();
        this.drawPreviewBuffer();

        this.composite(ctx);
    }

    composite(ctx = this.canvas.getContext("2d")!): void {
        const HALF_CANVAS = this.CANVAS_WIDTH / 2;

        const scaleFac = (this.CANVAS_WIDTH / this.GRID_DIV) * this.navState.zoomFac;
        const halfScale = -HALF_CANVAS * this.navState.zoomFac;
        const translate = this.getTranslate();

        ctx.drawImage(this.checkerBGBuff, 0, 0, this.checkerBGBuff.width, this.checkerBGBuff.height);

        //draw pixel and preview buffers (they require a transformation)
        ctx.imageSmoothingEnabled = false;

        ctx.translate(translate.x, translate.y);
        ctx.translate(halfScale, halfScale)
        ctx.scale(scaleFac, scaleFac);

        ctx.drawImage(this.pixelBuff, 0, 0, this.pixelBuff.width, this.pixelBuff.height);
        ctx.drawImage(this.previewBuff, 0, 0, this.previewBuff.width, this.previewBuff.height);

        ctx.resetTransform();

        //draw buffers that don't require a transformation
        ctx.drawImage(this.gridBuff, 0, 0, this.gridBuff.width, this.gridBuff.height);
        ctx.drawImage(this.checkerStencilBuff, 0, 0, this.checkerStencilBuff.width, this.checkerStencilBuff.height);
    }

    resize(width = this.canvas.clientWidth, height = this.canvas.clientHeight): void {
        Core.Draw.resizeHDPICanvas(this.checkerBGBuff, width, height);
        Core.Draw.resizeHDPICanvas(this.checkerStencilBuff, width, height);
        Core.Draw.resizeHDPICanvas(this.gridBuff, width, height);

        this.fullRedraw();
    }

    navChanged(): void {        
        this.drawBGStencil();
        this.drawSpriteData();
        this.drawGrid();
        this.drawPreviewBuffer();
        
        this.composite();
    }

    setSprite(newSprite: ImageData, navRef: Core.iNavState): void {
        this.spriteData = newSprite;
        this.navState = navRef;

        this.fullRedraw();
    }

    mouseDown(): void {
        this.drawSpriteData();
        this.drawPreviewBuffer();
        this.composite();
    }

    mouseUp(): void {
        this.drawSpriteData();
        this.drawPreviewBuffer();
        this.composite();
    }

    mouseMove(): void {
        this.drawSpriteData();
        this.drawPreviewBuffer();
        this.composite();
    }

    drawCheckerBG(canvas = this.checkerBGBuff): void {
        Core.Draw.drawCheckerBG(canvas, 10, "#B5B5B5", "#CCCCCC");
    }

    drawBGStencil(ctx = this.checkerStencilBuff.getContext('2d')!): void {
        const FULL_WIDTH = this.CANVAS_WIDTH * this.navState.zoomFac;
        const HALF_WIDTH = -FULL_WIDTH / 2;
        const canvas = ctx.canvas;

        const translate = this.getTranslate();

        ctx.fillStyle = "white";
        ctx.fillRect(0, 0, this.checkerStencilBuff.width, this.checkerStencilBuff.height);
        ctx.translate(translate.x, translate.y);
        ctx.clearRect(HALF_WIDTH, HALF_WIDTH, FULL_WIDTH, FULL_WIDTH);
        ctx.resetTransform();

        //remove after debugging
        ctx.fillStyle = "black";
        ctx.fillRect(0, 0, 10, 10);
        ctx.fillRect(canvas.width - 10, canvas.height - 10, 10, 10);
    }

    drawPixelData(canvas: HTMLCanvasElement, pixelData: ImageData): void {
        if (pixelData){
            canvas.getContext('2d')!.putImageData(pixelData, 0, 0);
        }
    }

    drawSpriteData(canvas = this.pixelBuff): void {
        this.drawPixelData(canvas, this.spriteData);
    }
 
    drawGrid(ctx = this.gridBuff.getContext("2d")!): void {
        const PIXEL_SIZE = Math.round(this.CANVAS_WIDTH / this.GRID_DIV);
        const HALF_CANVAS = this.CANVAS_WIDTH / 2;

        let translate = this.getTranslate();

        ctx.clearRect(0, 0, this.gridBuff.width, this.gridBuff.height);

        ctx.translate(translate.x, translate.y);
        ctx.scale(this.navState.zoomFac, this.navState.zoomFac);

        //draw grid
        ctx.strokeStyle = "black";
        ctx.lineWidth = 1;
        ctx.beginPath();
        for (let i = 1; i < this.GRID_DIV; i++) {
            let curLine = i * PIXEL_SIZE;
            let pos = new Core.Vector(curLine, curLine);

            pos.subtractScalar(HALF_CANVAS);

            ctx.moveTo(pos.x, -HALF_CANVAS);
            ctx.lineTo(pos.x, HALF_CANVAS);
            ctx.moveTo(-HALF_CANVAS, pos.y);
            ctx.lineTo(HALF_CANVAS, pos.y);
        }

        ctx.resetTransform();
        ctx.stroke();
    }

    drawPreviewBuffer(canvas = this.previewBuff): void {
        this.drawPixelData(canvas, this.previewData);
    }
}