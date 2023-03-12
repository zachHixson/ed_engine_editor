import { WGL } from "../core";
import { NavState } from "../NavState";
import { Mat3 } from "../Mat3";
import { Vector } from "../Vector";

export abstract class Instance_Renderer {
    private static _planeGeo = WGL.createPlaneGeo().map(i => (i + 1) * 8);
    private static _planeUVs = WGL.createPlaneGeo().map(i => (i + 1) * 0.5);
    private static _vertexSource = `
        uniform mat3 u_viewMatrix;
        uniform vec2 u_dimensions;

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
    private static _fragmentSource = `
        precision highp float;

        varying vec2 v_uv;

        void main(){
            gl_FragColor = vec4(vec3(v_uv, 0.0), 1.0);
        }
    `;

    protected _canvas: HTMLCanvasElement;
    protected _navState: NavState;
    protected _gl: WebGL2RenderingContext;
    protected _instanceProgram: WebGLProgram;
    protected _viewMatrixUniform: WGL.Uniform_Object;
    protected _dimensionUniform: WGL.Uniform_Object;
    protected _planeVertsAttribute: WGL.Attribute_Object;
    protected _positionAttribute: WGL.Attribute_Object;
    protected _uvAttribute: WGL.Attribute_Object;
    protected _instanceVAO: WebGLVertexArrayObject;
    protected _viewMatrix = new Mat3();
    protected _viewMatrixNeedsUpdate = true;

    constructor(canvas: HTMLCanvasElement, navState: NavState){
        this._canvas = canvas;
        this._navState = navState;

        //setup webGL context
        this._gl = WGL.getGLContext(this._canvas)!;
        this._instanceProgram = WGL.createProgram(
            this._gl,
            WGL.createShader(this._gl, this._gl.VERTEX_SHADER, Instance_Renderer._vertexSource)!,
            WGL.createShader(this._gl, this._gl.FRAGMENT_SHADER, Instance_Renderer._fragmentSource)!    
        )!;
        this._viewMatrixUniform = new WGL.Uniform_Object(this._gl, this._instanceProgram, 'u_viewMatrix', WGL.Uniform_Types.MAT3);
        this._dimensionUniform = new WGL.Uniform_Object(this._gl, this._instanceProgram, 'u_dimensions', WGL.Uniform_Types.VEC2);
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

        this._gl.clearColor(0, 0, 0, 1);

        this.render();
    }

    protected _updateViewMatrix(): void {
        if (!this._viewMatrixNeedsUpdate) return;

        const zoom = this._navState.zoomFac;
        const { x, y } = this._navState.offset;
        const dimensions = new Vector(this._canvas.width / 2, this._canvas.height / 2);
        const zoomMat = new Mat3([zoom, 0, 0, 0, zoom, 0, 0, 0, 1]);
        const tranMat = new Mat3([1, 0, x, 0, 1, y, 0, 0, 1]);
        const aspectMat = new Mat3([
            1.0 / dimensions.x, 0, 0,
            0, 1.0 / dimensions.y, 0,
            0, 0, 1.0
        ]);
        this._viewMatrix.copy(zoomMat.multiply(aspectMat).multiply(tranMat));
        this._viewMatrixUniform.set(false, this._viewMatrix.data);
        this._viewMatrixNeedsUpdate = false;
    }

    resize(): void {
        this._gl.viewport(0, 0, this._canvas.width, this._canvas.height);
        this._dimensionUniform.set(this._gl.canvas.width / 2, this._gl.canvas.height / 2);
        this._viewMatrixNeedsUpdate = true;
    }

    render(): void {
        this._gl.bindVertexArray(this._instanceVAO);
        this._gl.useProgram(this._instanceProgram);
        this._gl.clear(this._gl.COLOR_BUFFER_BIT);
        this._updateViewMatrix();
        this._gl.drawArraysInstanced(
            this._gl.TRIANGLES,
            0,
            6,
            4
        );
    }
}