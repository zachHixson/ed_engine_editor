import Font_Renderer from "./Font_Renderer";
import { Event_Emitter } from "@engine/core/Event_Emitter";

export default abstract class Dialog_Base {

    static get DIALOG_ARROW_BITMAP(){return [
        0,0,0,0,0,0,0,0,
        0,0,0,0,0,0,0,0,
        1,1,1,1,1,1,1,1,
        1,2,2,2,2,2,2,1,
        0,1,2,2,2,2,1,0,
        0,0,1,2,2,1,0,0,
        0,0,0,1,1,0,0,0,
        0,0,0,0,0,0,0,0,
    ];}

    protected _gl: WebGL2RenderingContext;
    protected _progress: number = 0;
    protected _arrowAnim: number = 0;
    protected _active: boolean = false;
    protected _interactKey: string = 'Space';
    protected _onOpen = new Event_Emitter<()=>void>();
    protected _onClose = new Event_Emitter<(userClosed: boolean)=>void>();

    private _previousText: String | null = null;
    
    abstract fontRenderer: Font_Renderer;

    constructor(gl: WebGL2RenderingContext){
        this._gl = gl;

        this._progress = 0;
        this._arrowAnim = 0;
    }

    get onOpen() {return this._onOpen}
    get onClose() {return this._onClose}

    get text() {return this.fontRenderer.text}
    set text(txt: string){
        this.fontRenderer.text = txt
        this._progress = 0;
    }

    protected _setProgress(val: number): void {
        const pageLength = this.fontRenderer.pageLength;
        this._progress = Math.max(Math.min(val, pageLength), 0);
        this.fontRenderer.reveal = Math.floor(this._progress);
    }

    protected _getArrowTexture(): WebGLTexture {
        const texture = this._gl.createTexture()!;
        const bitmap = Dialog_Base.DIALOG_ARROW_BITMAP;
        const dataBuffer = new Uint8ClampedArray(bitmap.length * 2);

        for (let i = 0; i < bitmap.length; i++){
            const bufferIdx = i * 2;
            const color = bitmap[i] - 1;
            dataBuffer[bufferIdx + 0] = color * 255;
            dataBuffer[bufferIdx + 1] = bitmap[i] * 255;
        }

        this._gl.bindTexture(this._gl.TEXTURE_2D, texture);
        this._gl.texImage2D(
            this._gl.TEXTURE_2D,
            0,
            this._gl.LUMINANCE_ALPHA,
            8,
            8,
            0,
            this._gl.LUMINANCE_ALPHA,
            this._gl.UNSIGNED_BYTE,
            dataBuffer
        );
        this._gl.texParameteri(this._gl.TEXTURE_2D, this._gl.TEXTURE_MIN_FILTER, this._gl.NEAREST);
        this._gl.texParameteri(this._gl.TEXTURE_2D, this._gl.TEXTURE_MAG_FILTER, this._gl.NEAREST);
        this._gl.texParameteri(this._gl.TEXTURE_2D, this._gl.TEXTURE_WRAP_S, this._gl.CLAMP_TO_EDGE);
        this._gl.texParameteri(this._gl.TEXTURE_2D, this._gl.TEXTURE_WRAP_T, this._gl.CLAMP_TO_EDGE);

        return texture;
    }

    open(text: string, interactKey: string): void {
        //close previous dialog box to prevent overlap
        if (this._active){
            const userClosed = text != this._previousText; //prevent edge case where two of the same dialog boxes get triggered on same frame
            this.close(userClosed);
        }

        this.text = text;
        this._interactKey = interactKey;
        this._active = true;
        this._setProgress(0);
        this._previousText = this.text;

        this.onOpen.emit();

        setTimeout(()=>{
            this._previousText = null;
        });
    }

    abstract close(userClosed: boolean): void;

    checkInteractKey(key: string): boolean {
        if (this._active && key == this._interactKey){
            this.nextPage();
            return true;
        }

        return false;
    }

    nextPage(): void {
        if (!(this._active && this.fontRenderer.pageText)){
            return;
        }

        const pageLength = this.fontRenderer.pageLength;
        const pageFinished = this._progress >= pageLength;
        const lastPage = this.fontRenderer.isLastPage;

        if (pageFinished){
            if (lastPage){
                this.close(true);
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

    abstract render(delta: number): void;
}