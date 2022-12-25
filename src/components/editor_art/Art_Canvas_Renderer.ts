export default class Art_Canvas_Renderer{
    constructor(element, spriteData, previewData, navState){
        this.GRID_DIV = Shared.Sprite.DIMENSIONS;
        this.CANVAS_WIDTH = this.GRID_DIV * 20;

        this.canvas = element;
        this.checkerBGBuff = Shared.createHDPICanvas(this.canvas.width, this.canvas.height);
        this.checkerStencilBuff = Shared.createHDPICanvas(this.canvas.width, this.canvas.height);
        this.pixelBuff = Shared.createCanvas(this.GRID_DIV, this.GRID_DIV);
        this.gridBuff = Shared.createHDPICanvas(this.canvas.width, this.canvas.height);
        this.previewBuff = Shared.createCanvas(this.GRID_DIV, this.GRID_DIV);
        this.spriteData = spriteData;
        this.previewData = previewData;
        this.navState = navState;

        this.fullRedraw();
    }

    getTranslate(){
        return new Vector(
            (this.canvas.width / 2) + (this.navState.offset.x * this.navState.zoomFac),
            (this.canvas.height / 2) + (this.navState.offset.y * this.navState.zoomFac)
        );
    }

    fullRedraw(){
        let ctx = this.canvas.getContext("2d");

        this.drawCheckerBG();
        this.drawBGStencil();
        this.drawSpriteData();
        this.drawGrid();
        this.drawPreviewBuffer();

        this.composite(ctx);
    }

    composite(ctx = this.canvas.getContext("2d")){
        const HALF_CANVAS = this.CANVAS_WIDTH / 2;

        let scaleFac = (this.CANVAS_WIDTH / this.GRID_DIV) * this.navState.zoomFac;
        let halfScale = -HALF_CANVAS * this.navState.zoomFac;
        let translate = this.getTranslate();

        ctx.drawImage(this.checkerBGBuff, 0, 0, this.checkerBGBuff.width, this.checkerBGBuff.height);

        //draw pixel and preview buffers (they require a transformation)
        ctx.imageSmoothingEnabled = false;
        ctx.webkitImageSmoothingEnabled = false;

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

    resize(width = this.canvas.clientWidth, height = this.canvas.clientHeight){
        Shared.resizeHDPICanvas(this.checkerBGBuff, width, height);
        Shared.resizeHDPICanvas(this.checkerStencilBuff, width, height);
        Shared.resizeHDPICanvas(this.gridBuff, width, height);

        this.fullRedraw();
    }

    navChanged(){        
        this.drawBGStencil();
        this.drawSpriteData();
        this.drawGrid();
        this.drawPreviewBuffer();
        
        this.composite();
    }

    setSprite(newSprite, navRef){
        this.spriteData = newSprite;
        this.navState = navRef;

        this.fullRedraw();
    }

    mouseDown(){
        this.drawSpriteData();
        this.drawPreviewBuffer();
        this.composite();
    }

    mouseUp(){
        this.drawSpriteData();
        this.drawPreviewBuffer();
        this.composite();
    }

    mouseMove(){
        this.drawSpriteData();
        this.drawPreviewBuffer();
        this.composite();
    }

    drawCheckerBG(canvas = this.checkerBGBuff){
        Shared.drawCheckerBG(canvas, 10, "#B5B5B5", "#CCCCCC");
    }

    drawBGStencil(ctx = this.checkerStencilBuff.getContext('2d')){
        const FULL_WIDTH = this.CANVAS_WIDTH * this.navState.zoomFac;
        const HALF_WIDTH = -FULL_WIDTH / 2;

        let translate = this.getTranslate();

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

    drawPixelData(canvas, pixelData){
        if (pixelData){
            canvas.getContext('2d').putImageData(pixelData, 0, 0);
        }
    }

    drawSpriteData(canvas = this.pixelBuff){
        this.drawPixelData(canvas, this.spriteData);
    }
 
    drawGrid(ctx = this.gridBuff.getContext("2d")){
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
            let pos = new Vector(curLine, curLine);

            pos.subtractScalar(HALF_CANVAS);

            ctx.moveTo(pos.x, -HALF_CANVAS);
            ctx.lineTo(pos.x, HALF_CANVAS);
            ctx.moveTo(-HALF_CANVAS, pos.y);
            ctx.lineTo(HALF_CANVAS, pos.y);
        }

        ctx.resetTransform();
        ctx.stroke();
    }

    drawPreviewBuffer(canvas = this.previewBuff){
        this.drawPixelData(canvas, this.previewData);
    }
}