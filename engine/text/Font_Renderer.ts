import Renderer from '@engine/Renderer';
import font from './Font';
import { ConstVector, Vector } from '@engine/core/core';
import { WGL } from '@engine/core/core';

export default class Font_Renderer{
    private static readonly _planeGeo = WGL.createPlaneGeo().map(i => (i + 1) * 0.5);
    private static readonly _characterPositions = (()=>{
        const charHCount = font.width / font.charWidth;
        const positionMap = new Map<string, Vector>();

        for (let i = 0; i < font.charKey.length; i++){
            const x = (font.charWidth * i) % font.width;
            const y = Math.floor(i / charHCount) * font.charHeight;
            positionMap.set(font.charKey[i], new Vector(x, y));
        }

        return positionMap;
    })();
    private static readonly _vertexSource = `
        const vec2 CHAR_DIM = vec2(${font.charWidth.toFixed(1)}, ${font.charHeight.toFixed(1)});
        const vec2 SCALE_FAC = vec2(${(font.width / font.charWidth).toFixed(2)}, ${(font.height / font.charHeight).toFixed(2)});

        uniform vec2 u_dimensions;
        uniform float u_fontSize;

        attribute vec2 a_planeGeo;
        attribute vec2 a_position;
        attribute vec2 a_charOffset;

        varying vec2 v_uv;

        void main(){
            vec2 planeGeo = a_planeGeo - vec2(0.0, 1.0);
            planeGeo = (planeGeo * CHAR_DIM * u_fontSize) - vec2(u_dimensions.x, -u_dimensions.y);
            vec2 screenPos = ((planeGeo + a_position) / u_dimensions);

            v_uv = vec2(a_planeGeo.x, 1.0 - a_planeGeo.y);
            v_uv += a_charOffset / CHAR_DIM;
            v_uv /= SCALE_FAC;

            gl_Position = vec4(screenPos, 0.0, 1.0);
        }
    `;
    private static readonly _fragmentSource = `
        precision mediump float;

        uniform sampler2D u_atlas;

        varying vec2 v_uv;

        void main(){
            float char = texture2D(u_atlas, v_uv).r;
            gl_FragColor = vec4(char);

            if (char <= 0.0){
                discard;
            }
        }
    `;

    //webGL props
    private _gl: WebGL2RenderingContext;
    private _program: WebGLProgram;
    private _planeGeoAttrib: WGL.Attribute;
    private _positionAttrib: WGL.Attribute;
    private _charOffsetAttrib: WGL.Attribute;
    private _dimensionUniform: WGL.Uniform;
    private _fontSizeUniform: WGL.Uniform;
    private _atlasUniform: WGL.Texture_Uniform;
    private _vao: WebGLVertexArrayObject;

    //Renderer props
    private _width: number;
    private _height: number;
    private _text: string = '';
    private _brokenText: string = this._text;
    private _pages = new Array<string[]>();
    private _page: number = 0;
    private _fontSize: number = 1;

    pos: Vector;
    reveal: number = 0;
    splitPages: boolean = true;

    constructor(gl: WebGL2RenderingContext, pos?: ConstVector, width?: number, height?: number){
        this._gl = gl;
        this._program = WGL.compileProgram(
            this._gl,
            Font_Renderer._vertexSource,
            Font_Renderer._fragmentSource,
        );
        this._planeGeoAttrib = new WGL.Attribute(this._gl, this._program, 'a_planeGeo');
        this._positionAttrib = new WGL.Attribute(this._gl, this._program, 'a_position');
        this._charOffsetAttrib = new WGL.Attribute(this._gl, this._program, 'a_charOffset');
        this._dimensionUniform = new WGL.Uniform(this._gl, this._program, 'u_dimensions', WGL.Uniform_Types.VEC2);
        this._fontSizeUniform = new WGL.Uniform(this._gl, this._program, 'u_fontSize', WGL.Uniform_Types.FLOAT);
        this._atlasUniform = new WGL.Texture_Uniform(this._gl, this._program, 'u_atlas');
        this._vao = this._gl.createVertexArray()!;

        this._gl.bindVertexArray(this._vao);

        this._planeGeoAttrib.set(new Float32Array(Font_Renderer._planeGeo), 2, this._gl.FLOAT);
        this._dimensionUniform.set(Renderer.SCREEN_RES, Renderer.SCREEN_RES);
        this._fontSizeUniform.set(this._fontSize);

        this._initFontAtlas();

        this._width = width ?? Renderer.SCREEN_RES;
        this._height = height ?? Renderer.SCREEN_RES;
        this.pos = pos?.clone() ?? new Vector(0, 0);
    }

    get text(){return this._text}
    set text(text: string){
        this._text = text;
        this._page = 0;
        this._breakText();
        this._updateBuffers();
    }

    get page(){return this._page}
    set page(val: number){
        this._page = Math.max(Math.min(this._pages.length - 1, val), 0);
        this._updateBuffers();
    }

    get brokenText(): string {return this._brokenText}
    get pageText() {
        let outText = '';

        if (this._pages){
            const page = this._pages[this._page];

            page.forEach(line => {
                outText += line;
            });
        }
        else{
            outText = this._brokenText;
        }

        return outText;
    }
    get pageLength(){
        let outLength = 0;

        if (this._pages){
            const page = this._pages[this._page];

            page.forEach(line => {
                outLength += line.length;
            });
        }
        else{
            outLength = this._brokenText.length;
        }

        return outLength;
    }
    get isLastPage(): boolean {return this._page >= this._pages.length - 1};

    get fontSize(){return this._fontSize}
    set fontSize(size: number){
        this._fontSize = size;
        this._fontSizeUniform.set(size);
        this._breakText();
        this._updateBuffers();
    }

    get width(){return this._width}
    get height(){return this._height}

    get fontDim(){
        const {charWidth, charHeight} = font;
        return new Vector(
            charWidth * this._fontSize,
            charHeight * this._fontSize
        );
    }

    private _initFontAtlas(): void {
        this._gl.pixelStorei(this._gl.UNPACK_ALIGNMENT, 1);
        this._gl.bindTexture(this._gl.TEXTURE_2D, this._atlasUniform.texture);
        this._gl.texImage2D(
            this._gl.TEXTURE_2D,
            0,
            this._gl.LUMINANCE,
            font.width,
            font.height,
            0,
            this._gl.LUMINANCE,
            this._gl.UNSIGNED_BYTE,
            new Uint8Array(font.data),
        );

        this._gl.texParameteri(this._gl.TEXTURE_2D, this._gl.TEXTURE_MIN_FILTER, this._gl.NEAREST);
        this._gl.texParameteri(this._gl.TEXTURE_2D, this._gl.TEXTURE_MAG_FILTER, this._gl.NEAREST);
    }

    private _breakText(): void {
        const charWidth = this._fontSize * font.charWidth;
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
            const charHeight = this.fontSize * font.charHeight;
            const linesPerPage = Math.floor(this.height / charHeight);
            const pages = new Array<string[]>(Math.ceil(lines.length / linesPerPage));

            //fill empty pages
            for (let i = 0; i < pages.length; i++){
                pages[i] = [];
            }
            
            for (let i = 0; i < lines.length; i++){
                const pageIdx = Math.floor(i / linesPerPage);
                pages[pageIdx].push(lines[i]);
            }

            this._pages = pages;
        }
    }

    private _updateBuffers(): void {
        const page = this._pages[this._page];
        const bufferSize = this.pageText.length * 2;
        const positionBuffer = new Float32Array(bufferSize);
        const offsetBuffer = new Uint8Array(bufferSize);
        let bufferIdx = 0;

        for (let l = 0; l < page.length; l++){
            const curLine = page[l];
            
            for (let c = 0; c < curLine.length; c++){
                const x = c * font.charWidth * this._fontSize;
                const y = -l * font.charHeight * this._fontSize;
                const charOffset = Font_Renderer._characterPositions.get(curLine[c]) ?? new Vector(0, 0);

                positionBuffer[bufferIdx + 0] = x + this.pos.x;
                positionBuffer[bufferIdx + 1] = y - this.pos.y;
                offsetBuffer[bufferIdx + 0] = charOffset.x;
                offsetBuffer[bufferIdx + 1] = charOffset.y;
                
                bufferIdx += 2;
            }
        }

        this._gl.useProgram(this._program);
        this._gl.bindVertexArray(this._vao);
        this._positionAttrib.set(positionBuffer, 2, this._gl.FLOAT);
        this._charOffsetAttrib.set(offsetBuffer, 2, this._gl.UNSIGNED_BYTE);
        this._positionAttrib.setDivisor(1);
        this._charOffsetAttrib.setDivisor(1);
    }

    setDimensions(width: number, height: number): void {
        this._width = width;
        this._height = height;
        this._breakText();
    }

    setHeightFromLineCount(lineCount: number): void {
        this._height = font.charHeight * lineCount * this._fontSize;
    }

    render(): void {
        this._gl.useProgram(this._program);
        this._gl.bindVertexArray(this._vao);
        
        this._planeGeoAttrib.enable();
        this._positionAttrib.enable();
        this._charOffsetAttrib.enable();
        this._atlasUniform.activate();

        this._gl.drawArraysInstanced(
            this._gl.TRIANGLES,
            0,
            6,
            this.reveal
        );

        this._planeGeoAttrib.disable();
        this._positionAttrib.disable();
        this._charOffsetAttrib.disable();
        this._atlasUniform.deactivate();
    }
}