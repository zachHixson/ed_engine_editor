import store from '@/store/index';

const GRID_DIV = 16;
const CANVAS_OFFSET = 10;
const CANVAS_WIDTH = GRID_DIV * 20;

class Art_Canvas{
    constructor(element){
        this.canvas = element;
        this.checkerBGBuff = document.createElement("canvas");
        this.checkerStencilBuff = document.createElement("canvas");
        this.pixelBuff = document.createElement("canvas");
        this.overlayBuff = document.createElement("canvas");
        this.pixelData = store.getters['GameData/getRandomSprite'];
    }

    setup(){
        this.resize();
        this.update();
    }

    update(){
        let ctx = this.canvas.getContext("2d");

        this.drawBGStencil();
        this.drawSpriteData();
        this.drawGrid();
        //draw preview buffer

        ctx.drawImage(this.checkerBGBuff, 0, 0, this.checkerBGBuff.width, this.checkerBGBuff.height);
        ctx.drawImage(this.checkerStencilBuff, 0, 0, this.checkerStencilBuff.width, this.checkerStencilBuff.height);
        ctx.drawImage(this.pixelBuff, 0, 0, this.pixelBuff.width, this.pixelBuff.height);
        ctx.drawImage(this.overlayBuff, 0, 0, this.overlayBuff.width, this.overlayBuff.height);

    }

    resize(width = this.canvas.width, height = this.canvas.height){
        this.checkerBGBuff.width = width;
        this.checkerBGBuff.height = height;
        this.checkerStencilBuff.width = width;
        this.checkerStencilBuff.height = height;
        this.pixelBuff.width = width;
        this.pixelBuff.height = height;
        this.overlayBuff.width = width;
        this.overlayBuff.height = height;

        this.drawCheckerBG();
    }

    drawCheckerBG(ctx = this.checkerBGBuff.getContext('2d')){
        const CHECKER_SIZE = 10;
        const LIGHT = "#AAA";
        const DARK = "#CCC";

        let xCount = Math.ceil(this.checkerBGBuff.width / CHECKER_SIZE);
        let yCount = Math.ceil(this.checkerBGBuff.height / CHECKER_SIZE);

        if (xCount % 2 == 0){
            xCount += 1;
        }

        for (let x = 0; x < xCount; x++){
            for (let y = 0; y < yCount; y++){
                let curIdx = this.get2DIdx(x, y, xCount);
                ctx.fillStyle = (curIdx % 2) ? LIGHT : DARK;
                ctx.fillRect(
                    x * CHECKER_SIZE,
                    y * CHECKER_SIZE,
                    CHECKER_SIZE,
                    CHECKER_SIZE
                );
            }
        }
    }

    drawBGStencil(ctx = this.checkerStencilBuff.getContext('2d')){
        ctx.fillStyle = "white";
        ctx.fillRect(0, 0, this.checkerStencilBuff.width, this.checkerStencilBuff.height);
        ctx.clearRect(CANVAS_OFFSET, CANVAS_OFFSET, CANVAS_WIDTH, CANVAS_WIDTH);
    }

    drawSpriteData(ctx = this.pixelBuff.getContext("2d")){
        let pixelWidth = Math.round(CANVAS_WIDTH / GRID_DIV);

        for (let x = 0; x < GRID_DIV; x++){
            for (let y = 0; y < GRID_DIV; y++){
                let curPixel = this.pixelData[this.get2DIdx(x, y, GRID_DIV)];

                if (curPixel.length > 0){
                    ctx.fillStyle = curPixel;
                    ctx.fillRect(
                        (x * pixelWidth) + CANVAS_OFFSET,
                        (y * pixelWidth) + CANVAS_OFFSET,
                        pixelWidth,
                        pixelWidth
                    );
                }
            }
        }
    }

    drawGrid(ctx = this.overlayBuff.getContext("2d")){
        let pixelSize = Math.round(CANVAS_WIDTH / GRID_DIV);

        ctx.strokeStyle = "black";
        ctx.lineWidth = 2;
        ctx.beginPath();
        for (let i = 1; i < GRID_DIV; i++){
            let xPos = Math.round((i * pixelSize) + CANVAS_OFFSET);
            let yPos = Math.round((i * pixelSize) + CANVAS_OFFSET);

            ctx.moveTo(xPos, CANVAS_OFFSET);
            ctx.lineTo(xPos, CANVAS_OFFSET + CANVAS_WIDTH);
            ctx.moveTo(CANVAS_OFFSET, yPos);
            ctx.lineTo(CANVAS_OFFSET + CANVAS_WIDTH, yPos);
        }
        ctx.stroke();
    }

    get2DIdx(x, y, width){
        return (y * width) + x;
    }
}

export default Art_Canvas;