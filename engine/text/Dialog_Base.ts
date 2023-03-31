import Font_Renderer from "./Font_Renderer";

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
    protected _asyncTag: string | null = null;
    protected _active: boolean = false;
    
    abstract fontRenderer: Font_Renderer;
    onCloseCallback: (tag: string | null)=>any = ()=>{};

    constructor(gl: WebGL2RenderingContext){
        this._gl = gl;

        this._progress = 0;
        this._arrowAnim = 0;
    }

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

        return texture;
    }

    open(text: string, asyncTag: string | null = null): void {
        if (this._active){
            this.close();
        }

        this.text = text;
        this._asyncTag = asyncTag;
        this._active = true;
        this._setProgress(0);
    }

    abstract close(): void;

    nextPage(): void {
        if (!(this._active && this.fontRenderer.pageText)){
            return;
        }

        const pageLength = this.fontRenderer.pageLength;
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

    abstract render(delta: number): void;
}