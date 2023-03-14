import { WGL } from "../core";
import { Mat3 } from "../Mat3";

export class Instance_Renderer {
    private static readonly _planeGeo = WGL.createPlaneGeo().map(i => (i + 1) * 8);
    private static readonly _planeUVs = WGL.createPlaneGeo().map(i => (i + 1) * 0.5);
    private static readonly _vertexSource = `
        uniform mat3 u_viewMatrix;

        attribute vec2 a_planeVerts;
        attribute vec2 a_position;
        attribute vec2 a_uv;

        varying vec2 v_uv;

        void main(){
            v_uv = a_uv;

            vec2 worldPos = (a_planeVerts + a_position);
            vec3 clipPos = vec3(worldPos, 1.0) * u_viewMatrix;
            gl_Position = vec4(clipPos, 1.0);
        }
    `;
    private static readonly _fragmentSource = `
        precision highp float;

        varying vec2 v_uv;

        void main(){
            gl_FragColor = vec4(vec3(v_uv, 0.0), 1.0);
        }
    `;

    private _gl: WebGL2RenderingContext;
    private _instanceProgram: WebGLProgram;
    private _viewMatrixUniform: WGL.Uniform_Object;
    private _planeVertsAttribute: WGL.Attribute_Object;
    private _positionAttribute: WGL.Attribute_Object;
    private _uvAttribute: WGL.Attribute_Object;
    private _instanceVAO: WebGLVertexArrayObject;
    private _outputTexture: WGL.Render_Texture;

    constructor(gl: WebGL2RenderingContext){
        //setup webGL context
        this._gl = gl;
        this._instanceProgram = WGL.createProgram(
            this._gl,
            WGL.createShader(this._gl, this._gl.VERTEX_SHADER, Instance_Renderer._vertexSource)!,
            WGL.createShader(this._gl, this._gl.FRAGMENT_SHADER, Instance_Renderer._fragmentSource)!    
        )!;
        this._viewMatrixUniform = new WGL.Uniform_Object(this._gl, this._instanceProgram, 'u_viewMatrix', WGL.Uniform_Types.MAT3);
        this._planeVertsAttribute = new WGL.Attribute_Object(this._gl, this._instanceProgram, 'a_planeVerts');
        this._positionAttribute = new WGL.Attribute_Object(this._gl, this._instanceProgram, 'a_position');
        this._uvAttribute = new WGL.Attribute_Object(this._gl, this._instanceProgram, 'a_uv');
        this._instanceVAO = this._gl.createVertexArray()!;
        this._outputTexture = new WGL.Render_Texture(this._gl, this._gl.canvas.width, this._gl.canvas.height);

        this._gl.bindVertexArray(this._instanceVAO);

        this._planeVertsAttribute.set(new Float32Array(Instance_Renderer._planeGeo), 2);
        this._positionAttribute.set(new Float32Array([
            0, 0,
            16, 0,
            32, 0,
            32, 32
        ]), 2, this._gl.FLOAT, false, 0, 0, this._gl.DYNAMIC_DRAW);
        this._positionAttribute.setDivisor(1);
        this._uvAttribute.set(new Float32Array(Instance_Renderer._planeUVs), 2);
    }

    get texture(){return this._outputTexture.texture}

    updateViewMatrix(viewMat: Mat3): void {
        this._gl.useProgram(this._instanceProgram);
        this._viewMatrixUniform.set(false, viewMat.data);
    }

    resize(): void {
        this._outputTexture.resize(this._gl.canvas.width, this._gl.canvas.height);
    }

    render(): void {
        //setup render
        this._gl.bindVertexArray(this._instanceVAO);
        this._gl.useProgram(this._instanceProgram);

        //enable attributes and set render target
        this._planeVertsAttribute.enable();
        this._positionAttribute.enable();
        this._uvAttribute.enable();
        this._outputTexture.setAsRenderTarget();

        //set render target and draw
        this._gl.clear(this._gl.COLOR_BUFFER_BIT);
        this._gl.viewport(0, 0, this._gl.canvas.width, this._gl.canvas.height);
        this._gl.drawArraysInstanced(
            this._gl.TRIANGLES,
            0,
            6,
            4
        );

        //disable attributes and unset render target
        this._planeVertsAttribute.disable();
        this._positionAttribute.disable();
        this._uvAttribute.disable();
        this._outputTexture.unsetRenderTarget();
    }

    destroy(): void {
        this._outputTexture.destroy();
    }
}