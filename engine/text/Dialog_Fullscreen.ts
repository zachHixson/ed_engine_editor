import Renderer from "@engine/rendering/Renderer";
import Font_Renderer from "./Font_Renderer";
import Dialog_Box from "./Dialog_Box";
import { Vector } from '@engine/core/core';

const MARGIN = 5;
const LETTERS_PER_SEC = 20;

export default class Dialog_Fullscreen extends Dialog_Box{
    onCloseCallback: (tag: string | null, restart?: boolean) => any = ()=>{};

    constructor(canvas: HTMLCanvasElement){
        const backMargin = Renderer.SCREEN_RES - MARGIN * 2;

        super(canvas);

        this.fontRenderer = new Font_Renderer(
            this._canvas,
            new Vector(MARGIN, MARGIN),
            backMargin, backMargin
        );
    }

    close(): void {
        this.onCloseCallback(this._asyncTag, !this._asyncTag);
    }

    render(delta: number): void {
        if (!this.active){
            return;
        }

        const ctx = this._canvas.getContext('2d')!;
        const scaleFac = this._canvas.width / Renderer.SCREEN_RES;
        const arrowX = Math.floor((Renderer.SCREEN_RES / 2) - (this._arrowBuff.width / 2));

        //draw bg
        ctx.fillStyle = "black";
        ctx.fillRect(0, 0, this._canvas.width, this._canvas.height);

        this.fontRenderer.render();

        //draw arrow
        if (!this.fontRenderer.isLastPage){
            const yMod = Math.sin(this._arrowAnim * 5);

            ctx.scale(scaleFac, scaleFac)
            ctx.drawImage(
                this._arrowBuff,
                arrowX,
                Math.floor(Renderer.SCREEN_RES + yMod) - 8
            );
            ctx.resetTransform();
        }

        this._setProgress(this._progress + (delta * LETTERS_PER_SEC));
        this._arrowAnim += delta;
    }
}