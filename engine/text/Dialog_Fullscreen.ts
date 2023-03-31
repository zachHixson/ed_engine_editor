import Renderer from "@engine/Renderer";
import Font_Renderer from "./Font_Renderer";
import Dialog_Base from "./Dialog_Base";
import { Vector, WGL } from '@engine/core/core';

const MARGIN = 5;
const LETTERS_PER_SEC = 20;

export default class Dialog_Fullscreen extends Dialog_Base{
    private static readonly _planeGeo = WGL.createPlaneGeo();
    private static readonly _planeUVs = WGL.createPlaneGeo().map(i => (i + 1) * 0.5);
    private static readonly _vertexSource = `
        precision mediump float;

        const float PIXEL_SIZE = ${(1.0 / Renderer.SCREEN_RES).toFixed(7)};

        uniform float u_arrowAnim;

        attribute vec2 a_geo;
        attribute vec2 a_uv;

        varying vec2 v_uv;

        void main(){
            float arrowDriver = floor(abs(mod(u_arrowAnim * 5.0, 6.0)-3.0)) * PIXEL_SIZE;
            v_uv = (1.0 - a_uv) + vec2(0.0, -0.451 + arrowDriver);
            v_uv = ((v_uv - 0.5) * 30.0) + 0.5;

            gl_Position = vec4(a_geo, 0.0, 1.0);
        }
    `;
    private static readonly _fragmentSource = `
        precision mediump float;

        uniform float u_arrowAnim;
        uniform sampler2D u_arrowTexture;

        varying vec2 v_uv;

        void main(){
            vec4 arrowTexture = texture2D(u_arrowTexture, v_uv);
            vec2 arrowMaskUv = step(0.0, v_uv) - step(1.0, v_uv);
            float arrowMask = arrowMaskUv.x * arrowMaskUv.y;

            gl_FragColor = vec4(vec3(0.0), 1.0);

            if (u_arrowAnim >= 0.0){
                gl_FragColor = mix(gl_FragColor, arrowTexture, arrowTexture * arrowMask);
            }
        }
    `;

    onCloseCallback: (tag: string | null, restart?: boolean) => any = ()=>{};

    private _program: WebGLProgram;
    private _geoAttrib: WGL.Attribute_Object;
    private _uvAttrib: WGL.Attribute_Object;
    private _arrowAnimUniform: WGL.Uniform_Object;
    private _arrowTexture: WGL.Texture_Object;
    private _vao: WebGLVertexArrayObject;

    fontRenderer: Font_Renderer;

    constructor(gl: WebGL2RenderingContext){
        const backMargin = 2 * (Renderer.SCREEN_RES - MARGIN);

        super(gl);

        this._program = WGL.createProgram(
            this._gl,
            WGL.createShader(this._gl, this._gl.VERTEX_SHADER, Dialog_Fullscreen._vertexSource)!,
            WGL.createShader(this._gl, this._gl.FRAGMENT_SHADER, Dialog_Fullscreen._fragmentSource)!,
        )!;
        this._geoAttrib = new WGL.Attribute_Object(this._gl, this._program, 'a_geo');
        this._uvAttrib = new WGL.Attribute_Object(this._gl, this._program, 'a_uv');
        this._arrowAnimUniform = new WGL.Uniform_Object(this._gl, this._program, 'u_arrowAnim', WGL.Uniform_Types.FLOAT);
        this._arrowTexture = new WGL.Texture_Object(this._gl, this._program, 'u_arrowTexture', this._getArrowTexture());
        this._vao = this._gl.createVertexArray()!;

        this._gl.bindVertexArray(this._vao);
        this._gl.useProgram(this._program);

        this._geoAttrib.set(new Float32Array(Dialog_Fullscreen._planeGeo), 2, this._gl.FLOAT);
        this._uvAttrib.set(new Float32Array(Dialog_Fullscreen._planeUVs), 2, this._gl.FLOAT);

        this.fontRenderer = new Font_Renderer(
            this._gl,
            new Vector(MARGIN, MARGIN),
            backMargin, backMargin - 40
        );

        this.fontRenderer.fontSize = 2.5;
    }

    close(): void {
        this.onCloseCallback(this._asyncTag, !this._asyncTag);
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

        this._gl.drawArrays(this._gl.TRIANGLES, 0, 6);

        this._geoAttrib.disable();
        this._uvAttrib.disable();
        this._arrowTexture.deactivate();

        this._setProgress(this._progress + (delta * LETTERS_PER_SEC));

        this.fontRenderer.render();
    }
}