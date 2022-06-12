import Renderer from "./Renderer";
import Font_Renderer from "./Font_Renderer";

const MARGIN = 5;
const LINES = 4;

const ALIGN = {
    TOP: Symbol('TOP'),
    BOTTOM: Symbol('BOTTOM'),
};
Object.freeze(ALIGN);

export default class Dialog_Box{
    static get ALIGN(){return ALIGN}

    constructor(canvas, text = '', align = Dialog_Box.ALIGN.BOTTOM){
        const textMargin = MARGIN + 2;
        const backMargin = Renderer.SCREEN_RES - MARGIN * 2 - 4;

        this._canvas = canvas;
        this.align = align;
        this.fontRenderer = new Font_Renderer(
            this._canvas,
            new Victor(textMargin, textMargin),
            backMargin
        );
        this.page = 0;

        this.fontRenderer.setHeightFromLineCount(LINES);
    }

    get text(){return this.fontRenderer.text};
    set text(txt){return this.fontRenderer.text = txt};

    render(){
        const ctx = this._canvas.getContext('2d');
        const scaleFac = this._canvas.width / Renderer.SCREEN_RES;
        const lineWidth = scaleFac * 3;
        const p1 = new Victor(scaleFac * MARGIN, 0);
        const p2 = new Victor(scaleFac * (Renderer.SCREEN_RES - MARGIN * 2), 0);

        if (this.align == Dialog_Box.ALIGN.TOP){
            this.fontRenderer.pos.y = MARGIN + 2;
            p1.y = scaleFac * MARGIN;
            p2.y = scaleFac * this.fontRenderer.height + lineWidth;
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
    }
}