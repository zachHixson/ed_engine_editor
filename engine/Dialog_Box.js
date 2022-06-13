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

export default class Dialog_Box{
    static get ALIGN(){return ALIGN}

    constructor(canvas){
        const textMargin = MARGIN + 2;
        const backMargin = Renderer.SCREEN_RES - MARGIN * 2 - 4;

        this._canvas = canvas;
        this.align = Dialog_Box.ALIGN.TOP;
        this.fontRenderer = new Font_Renderer(
            this._canvas,
            new Victor(textMargin, textMargin),
            backMargin
        );
        this._progress = 0;
        this.active = true;

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

    activate(text){
        this.text = text;
        this.active = true;
    }

    nextPage(){
        const pageLength = this.fontRenderer.pageText.length;
        const pageFinished = this._progress >= pageLength;
        const lastPage = this.fontRenderer.isLastPage;

        if (pageFinished){
            if (lastPage){
                this.active = false;
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
        const pageLength = this.fontRenderer.pageText.length;
        const p1 = new Victor(scaleFac * MARGIN, 0);
        const p2 = new Victor(scaleFac * (Renderer.SCREEN_RES - MARGIN * 2), 0);

        if (this.align == Dialog_Box.ALIGN.TOP){
            this.fontRenderer.pos.y = MARGIN + 2;
            p1.y = scaleFac * MARGIN;
            p2.y = scaleFac * this.fontRenderer.height + lineWidth * 2;
        }
        else{
            const bottom = this._canvas.height - lineWidth - scaleFac * MARGIN;
            this.fontRenderer.pos.y = Renderer.SCREEN_RES - 4 * 9 - lineWidth;
            p1.y = bottom - scaleFac * this.fontRenderer.height;
            p2.y = scaleFac * this.fontRenderer.height + lineWidth;
        }

        ctx.fillStyle = "black";
        ctx.fillRect(p1.x, p1.y, p2.x, p2.y);

        ctx.strokeStyle = "black";
        ctx.lineWidth = lineWidth + 1;
        ctx.strokeRect(p1.x, p1.y, p2.x, p2.y);
        ctx.strokeStyle = "white";
        ctx.lineWidth = lineWidth;
        ctx.strokeRect(p1.x, p1.y, p2.x, p2.y);

        this.fontRenderer.render();
        this._setProgress(this._progress + (delta * LETTERS_PER_SEC));
    }
}