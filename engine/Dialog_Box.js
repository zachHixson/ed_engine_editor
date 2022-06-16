import Renderer from "./Renderer";
import Font_Renderer from "./Font_Renderer";

const MARGIN = 5;
const LINES = 4;
const LETTERS_PER_SEC = 20;
const BORDER_WIDTH = 2;

const ALIGN = {
    TOP: Symbol('TOP'),
    BOTTOM: Symbol('BOTTOM'),
};
Object.freeze(ALIGN);

const ARROW_CANVAS = (()=>{
    const canvas = Shared.createCanvas(8, 8);
    const ctx = canvas.getContext('2d');
    const imgData = ctx.createImageData(canvas.width, canvas.height);
    const bitmap = [
        -1, -1, -1, -1, -1, -1, -1, -1,
        -1, 1, 1, 1, 1, 1, 1, -1,
        0, -1, 1, 1, 1, 1, -1, 0,
        0, 0, -1, 1, 1, -1, 0, 0,
        0, 0, 0, -1, -1, 0, 0, 0,
        0, 0, 0, 0, 0, 0, 0, 0,
        0, 0, 0, 0, 0, 0, 0, 0,
        0, 0, 0, 0, 0, 0, 0, 0
    ];

    for (let i = 0; i < bitmap.length; i++){
        const idx = i * 4;
        const white = bitmap[i] > 0;
        const filled = bitmap[i] != 0;
        imgData.data[idx + 0] = white * 255;
        imgData.data[idx + 1] = white * 255;
        imgData.data[idx + 2] = white * 255;
        imgData.data[idx + 3] = filled * 255;
    }

    ctx.putImageData(imgData, 0, 0);

    return canvas;
})();

export default class Dialog_Box{
    static get ALIGN(){return ALIGN}
    static get DIALOG_ARROW_CANVAS(){return ARROW_CANVAS}

    constructor(canvas){
        const textMargin = MARGIN + 2;
        const backMargin = Renderer.SCREEN_RES - MARGIN * 2 - 4;

        this._canvas = canvas;
        this._arrowBuff = Dialog_Box.DIALOG_ARROW_CANVAS;
        this._progress = 0;
        this._arrowAnim = 0;
        this._asyncTag = null;
        this.align = Dialog_Box.ALIGN.TOP;
        this.fontRenderer = new Font_Renderer(
            this._canvas,
            new Victor(textMargin, textMargin),
            backMargin
        );
        this.onCloseCallback = ()=>{};
        this.active = false;

        this.fontRenderer.setHeightFromLineCount(LINES);
    }

    get text(){return this.fontRenderer.text}
    set text(txt){
        this.fontRenderer.text = txt
        this._progress = 0;
    }

    _setProgress(val){
        const pageLength = this.fontRenderer.pageText.length;
        this._progress = Math.max(Math.min(val, pageLength), 0);
        this.fontRenderer.reveal = Math.floor(this._progress);
    }

    open(text, asyncTag){
        if (this.active){
            this.close();
        }

        this.text = text;
        this._asyncTag = asyncTag;
        this.active = true;
    }

    close(){
        this.active = false;
        this.onCloseCallback(this._asyncTag);
    }

    nextPage(){
        if (!this.fontRenderer.pageText){
            return;
        }

        const pageLength = this.fontRenderer.pageText.length;
        const pageFinished = this._progress >= pageLength;
        const lastPage = this.fontRenderer.isLastPage;

        if (pageFinished){
            if (lastPage){
                this.close();
            }
            else{
                this._setProgress(0);
                this.fontRenderer.page++;
            }
        }
        else{
            this._setProgress(pageLength);
        }
    }

    render(delta){
        if (!this.active){
            return;
        }

        const ctx = this._canvas.getContext('2d');
        const scaleFac = this._canvas.width / Renderer.SCREEN_RES;
        const lineWidth = scaleFac * BORDER_WIDTH;
        const arrowX = Math.floor((Renderer.SCREEN_RES / 2) - (this._arrowBuff.width / 2));
        const bottomEdge = this.fontRenderer.height + lineWidth * 2;
        const p1 = new Victor(scaleFac * MARGIN, 0);
        const p2 = new Victor(scaleFac * (Renderer.SCREEN_RES - MARGIN * 2), scaleFac * bottomEdge);

        if (this.align == Dialog_Box.ALIGN.TOP){
            this.fontRenderer.pos.y = MARGIN + 2;
            p1.y = scaleFac * MARGIN;
        }
        else{
            const bottom = this._canvas.height - lineWidth - scaleFac * MARGIN;
            this.fontRenderer.pos.y = Renderer.SCREEN_RES - 4 * 9 - lineWidth;
            p1.y = bottom - scaleFac * this.fontRenderer.height;
        }

        ctx.imageSmoothingEnabled = false;
        ctx.webkitImageSmoothingEnabled = false;

        ctx.fillStyle = "black";
        ctx.fillRect(p1.x, p1.y, p2.x, p2.y);

        ctx.strokeStyle = "black";
        ctx.lineWidth = lineWidth + 1;
        ctx.strokeRect(p1.x, p1.y, p2.x, p2.y);
        ctx.strokeStyle = "white";
        ctx.lineWidth = lineWidth;
        ctx.strokeRect(p1.x, p1.y, p2.x, p2.y);

        this.fontRenderer.render();

        //draw arrow
        if (!this.fontRenderer.isLastPage){
            const yMod = Math.sin(this._arrowAnim * 5);

            ctx.scale(scaleFac, scaleFac)
            ctx.drawImage(
                this._arrowBuff,
                arrowX,
                Math.floor(bottomEdge + yMod) + 2
            );
            ctx.resetTransform();
        }

        this._setProgress(this._progress + (delta * LETTERS_PER_SEC));
        this._arrowAnim += delta;
    }
}