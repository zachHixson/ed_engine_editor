import Renderer from './Renderer';
import font from './Font';

export default class Font_Renderer{
    constructor(canvas, pos, width, height){
        this._text = '';
        this._brokenText = this._text;
        this._fontSize = 1;
        this._canvas = canvas;
        this._width = width ?? Renderer.SCREEN_RES;
        this._height = height ?? Renderer.SCREEN_RES;
        this.pos = pos?.clone() ?? new Victor(0, 0);
        this.reveal = 0;
    }

    get text(){return this._text};
    set text(text){
        this._text = text;
        this._breakText();
    }

    get fontSize(){return this._fontSize};
    set fontSize(size){
        this._fontSize = size;
        this._breakText();
    }

    get width(){return this._width};
    get height(){return this._height};
    
    get fontDim(){
        const {width, height} = font['0'];
        return new Victor(
            width * this._fontSize,
            height * this._fontSize
        );
    }

    _breakText(){
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
    }

    setDimensions(width, height){
        this._width = width;
        this._height = height;
        this._breakText();
    }

    setHeightFromLineCount(lineCount){
        this._height = font['0'].height * lineCount;
    }

    render(){
        const ctx = this._canvas.getContext('2d');
        const charHeight = font['0'].height;
        const drawCount = this._brokenText.length; //Math.min(this._brokenText.length, this.reveal);
        const scaleFac = this._canvas.width / Renderer.SCREEN_RES;
        let cursor = 0;
        let linePos = 0;

        ctx.translate(this.pos.x * scaleFac, this.pos.y * scaleFac);
        ctx.scale(this._fontSize * scaleFac, this._fontSize * scaleFac);

        for (let i = 0; i < drawCount; i++){
            const curChar = this._brokenText[i];

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

        ctx.strokeStyle = "#00FFFF";
        ctx.lineWidth = 1;
        ctx.strokeRect(this.pos.x * scaleFac, this.pos.y * scaleFac, this._width * scaleFac, this._height * scaleFac);
    }
}