import Renderer from "@engine/Renderer";
import Font_Renderer from "./Font_Renderer";
import { Vector, WGL } from "@engine/core/core";
import Dialog_Base from "./Dialog_Base";

const MARGIN = 0.016;
const LINES = 4;
const LETTERS_PER_SEC = 20;
const BOX_WIDTH = 0.9;
const BOX_HEIGHT = 0.2;
const BORDER_WIDTH = 0.015;
const SEPARATOR_WIDTH = 0.005;

enum ALIGN {
    TOP,
    BOTTOM,
}

export default class Dialog_Box extends Dialog_Base {
    private static readonly _planeGeo = WGL.createPlaneGeo();
    private static readonly _planeUVs = WGL.createPlaneGeo().map(i => (i + 1) * 0.5);
    private static readonly _vertexSource  = `
        attribute vec2 a_geo;
        attribute vec2 a_uv;

        varying vec2 v_uv;

        void main(){
            v_uv = a_uv;
            v_uv.y = 1.0 - v_uv.y;
            gl_Position = vec4(a_geo, 0.0, 1.0);
        }
    `;
    private static readonly _fragmentSource = `
        precision mediump float;

        const vec2 DIMENSIONS = vec2(${BOX_WIDTH.toFixed(2)}, ${BOX_HEIGHT.toFixed(2)});
        const float PIXEL_SIZE = ${(1.0 / Renderer.SCREEN_RES).toFixed(7)};

        uniform float u_yOffset;
        uniform float u_arrowAnim;
        uniform sampler2D u_arrowTexture;

        varying vec2 v_uv;

        void main(){
            //Main box
            vec2 boxUv = v_uv - vec2(0.5, u_yOffset);
            boxUv = abs(boxUv) * 2.0;
            boxUv -= DIMENSIONS;

            float grad = max(boxUv.x, boxUv.y);

            float mask = smoothstep(${(BORDER_WIDTH + SEPARATOR_WIDTH).toFixed(3)}, ${(BORDER_WIDTH + SEPARATOR_WIDTH - 0.005).toFixed(3)}, grad);
            float border = step(grad, ${BORDER_WIDTH.toFixed(3)}) - step(grad, 0.001);

            //arrow
            float arrowDriver = floor(abs(mod(u_arrowAnim * 5.0, 6.0)-3.0)) * PIXEL_SIZE;
            vec2 arrowUv = v_uv + vec2(0.0, 0.5 - u_yOffset - ${(BOX_HEIGHT / 2).toFixed(2)} - arrowDriver);
            arrowUv = ((arrowUv - 0.5) * 30.0) + 0.5;
            vec4 arrowTex = texture2D(u_arrowTexture, arrowUv);
            vec2 arrowMaskUv = step(0.0, arrowUv) - step(1.0, arrowUv);
            float arrowMask = arrowMaskUv.x * arrowMaskUv.y;

            arrowTex.a *= arrowMask;

            vec4 outCol = vec4(vec3(border), mask);

            if (u_arrowAnim >= 0.0){
                outCol = mix(outCol, arrowTex, arrowTex.a);
            }

            gl_FragColor = outCol;
        }
    `;
    static get ALIGN(){return ALIGN}

    private _program: WebGLProgram;
    private _geoAttrib: WGL.Attribute;
    private _uvAttrib: WGL.Attribute;
    private _yOffsetUniform: WGL.Uniform;
    private _arrowAnimUniform: WGL.Uniform;
    private _arrowTexture: WGL.Texture_Uniform;
    private _vao: WebGLVertexArrayObject;

    private _alignment: ALIGN = ALIGN.TOP;
    
    fontRenderer: Font_Renderer;
    onCloseCallback: (tag: string | null)=>any = ()=>{};

    constructor(gl: WebGL2RenderingContext){
        super(gl);

        const textMargin = (1.0 - BOX_WIDTH + MARGIN) * Renderer.SCREEN_RES;
        const backMargin = Renderer.SCREEN_RES * (BOX_WIDTH - MARGIN) * 2;

        //setup webGL props
        this._program = WGL.createProgram(
            this._gl,
            WGL.createShader(this._gl, this._gl.VERTEX_SHADER, Dialog_Box._vertexSource)!,
            WGL.createShader(this._gl, this._gl.FRAGMENT_SHADER, Dialog_Box._fragmentSource)!
        )!;
        this._geoAttrib = new WGL.Attribute(this._gl, this._program, 'a_geo');
        this._uvAttrib = new WGL.Attribute(this._gl, this._program, 'a_uv');
        this._yOffsetUniform = new WGL.Uniform(this._gl, this._program, 'u_yOffset', WGL.Uniform_Types.FLOAT);
        this._arrowAnimUniform = new WGL.Uniform(this._gl, this._program, 'u_arrowAnim', WGL.Uniform_Types.FLOAT);
        this._arrowTexture = new WGL.Texture_Uniform(this._gl, this._program, 'u_arrowTexture', this._getArrowTexture());
        this._vao = this._gl.createVertexArray()!;

        this._gl.bindVertexArray(this._vao);
        this._gl.useProgram(this._program);

        this._geoAttrib.set(new Float32Array(Dialog_Box._planeGeo), 2, this._gl.FLOAT);
        this._uvAttrib.set(new Float32Array(Dialog_Box._planeUVs), 2, this._gl.FLOAT);

        this._yOffsetUniform.set(0.15);

        //setup font renderer
        this.fontRenderer = new Font_Renderer(
            this._gl,
            new Vector(textMargin, textMargin),
            backMargin
        );

        this.fontRenderer.fontSize = 2.4;
        this.fontRenderer.setHeightFromLineCount(LINES);
    }

    get alignment(){return this._alignment};
    set alignment(val: ALIGN){
        this._alignment;
        this._yOffsetUniform.set(0.15);
    }

    close(): void {
        this._active = false;
        this.onCloseCallback(this._asyncTag);
    }

    render(delta: number): void {
        if (!this._active){
            return;
        }

        if (this.fontRenderer.isLastPage){
            this._arrowAnim = -1;
        }
        else{
            this._arrowAnim += delta;
        }

        this._gl.bindVertexArray(this._vao);
        this._gl.useProgram(this._program);
        
        this._arrowAnimUniform.set(this._arrowAnim);

        this._geoAttrib.enable();
        this._uvAttrib.enable();
        this._arrowTexture.activate();

        this._gl.enable(this._gl.BLEND);
        this._gl.blendFunc(this._gl.SRC_ALPHA, this._gl.ONE_MINUS_SRC_ALPHA);
        this._gl.drawArrays(this._gl.TRIANGLES, 0, 6);
        this._gl.disable(this._gl.BLEND);

        this._geoAttrib.disable();
        this._uvAttrib.disable();
        this._arrowTexture.deactivate();

        this._setProgress(this._progress + (delta * LETTERS_PER_SEC));

        this.fontRenderer.render();
    }
}