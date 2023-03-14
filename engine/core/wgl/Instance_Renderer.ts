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

    updateViewMatrix(viewMat: Mat3): void {
        this._gl.useProgram(this._instanceProgram);
        this._viewMatrixUniform.set(false, viewMat.data);
    }

    render(): void {
        this._gl.bindVertexArray(this._instanceVAO);
        this._gl.useProgram(this._instanceProgram);
        this._gl.drawArraysInstanced(
            this._gl.TRIANGLES,
            0,
            6,
            4
        );
    }
}