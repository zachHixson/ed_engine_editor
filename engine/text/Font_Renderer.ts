import Renderer from '@engine/rendering/Renderer';
import font from './Font';
import { Vector } from '@engine/core/core';

export default class Font_Renderer{
    private _text: string = '';
    private _brokenText: string = this._text;
    private _pages: string[] = [];
    private _page: number = 0;
    private _fontSize: number = 1;
    private _canvas: HTMLCanvasElement;
    private _width: number;
    private _height: number;

    pos: Vector;
    reveal: number = 0;
    splitPages: boolean = true;

    constructor(canvas: HTMLCanvasElement, pos?: Vector, width?: number, height?: number){
        this._canvas = canvas;
        this._width = width ?? Renderer.SCREEN_RES;
        this._height = height ?? Renderer.SCREEN_RES;
        this.pos = pos?.clone() ?? new Vector(0, 0);
    }

    get text(){return this._text}
    set text(text: string){
        this._text = text;
        this._page = 0;
        this._breakText();
    }

    get page(){return this._page}
    set page(val: number){
        this._page = Math.max(Math.min(this._pages.length - 1, val), 0);
    }

    get brokenText(): string {return this._brokenText}
    get pageText(): string {return this._pages ? this._pages[this._page] : ''}
    get isLastPage(): boolean {return this._page >= this._pages.length - 1};

    get fontSize(){return this._fontSize}
    set fontSize(size: number){
        this._fontSize = size;
        this._breakText();
    }

    get width(){return this._width}
    get height(){return this._height}

    get fontDim(){
        const {width, height} = font['0'];
        return new Vector(
            width * this._fontSize,
            height * this._fontSize
        );
    }

    _breakText(): void {
        const charWidth = this._fontSize * font['0'].width;
        const words = this._text.split(' ');
        const output = [];
        let cursor = 0;

        for (let i = 0; i < words.length; i++){
            const word = words[i];
            const wordWidth = charWidth * word.length;
            const needsLine = cursor + wordWidth > this._width;
            const needsBreak = wordWidth > this._width;
            const pushWord = !(needsLine && needsBreak);

            if (needsLine){
                if (cursor > 0){
                    output.push('\n');
                    cursor = 0;
                }

                if (needsBreak){
                    const availableSpace = Math.floor(this._width / charWidth);
                    const beginning = word.substring(0, availableSpace);
                    const end = word.substring(availableSpace);
                    output.push(beginning, '\n');
                    words.splice(i + 1, 0, end);
                    cursor = 0;
                }
            }

            if (pushWord){
                output.push(word, ' ');
                cursor += wordWidth + charWidth;
            }
        }

        this._brokenText = output.join('');

        if (this.splitPages){
            const lines = this._brokenText.split('\n');
            const charHeight = this.fontSize * font['0'].height;
            const linesPerPage = Math.floor(this.height / charHeight);
            const pages = new Array(Math.ceil(lines.length / linesPerPage)).fill('');
            
            for (let i = 0; i < lines.length; i++){
                const idx = Math.floor(i / linesPerPage);
                pages[idx] += lines[i] + '\n';
            }

            this._pages = pages;
        }
    }

    setDimensions(width: number, height: number): void {
        this._width = width;
        this._height = height;
        this._breakText();
    }

    setHeightFromLineCount(lineCount: number): void {
        this._height = font['0'].height * lineCount;
    }

    render(): void {
        const ctx = this._canvas.getContext('2d')!;
        const drawText = this.splitPages ? this._pages[this._page] : this._brokenText;
        const charHeight = font['0'].height;
        const drawCount = Math.min(drawText.length, this.reveal);
        const scaleFac = this._canvas.width / Renderer.SCREEN_RES;
        let cursor = 0;
        let linePos = 0;

        ctx.translate(this.pos.x * scaleFac, this.pos.y * scaleFac);
        ctx.scale(this._fontSize * scaleFac, this._fontSize * scaleFac);

        for (let i = 0; i < drawCount; i++){
            const curChar = drawText[i];

            if (curChar != '\n'){
                const curStamp = font[curChar];
                ctx.drawImage(curStamp, curStamp.width * cursor, linePos);
                cursor += 1;
            }
            else{
                linePos += charHeight;
                cursor = 0;
            }
        }

        ctx.resetTransform();
    }
}