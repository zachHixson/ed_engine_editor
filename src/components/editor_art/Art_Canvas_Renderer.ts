import Core from '@/core';
import { toRaw } from 'vue';

const CANVAS_SIZE = 300;
const { WGL } = Core;

let test = 0;

export default class Art_Canvas_Renderer{
    private static readonly _vertexSource = `
        uniform vec2 u_dimensions;
        uniform mat3 u_viewMatrix;

        attribute vec2 a_position;
        attribute vec2 a_uv;
        
        varying vec2 vUv;
        varying vec2 vScreenUv;
        
        void main(){
            float minDim = min(u_dimensions.x, u_dimensions.y);

            vec2 aspect = vec2(u_dimensions.y / u_dimensions.x, 1.0);
            vec2 aspPos = a_position * aspect;

            vUv = a_uv;
            gl_Position = vec4((vec3(aspPos, 1.0) * u_viewMatrix) / minDim, 1.0);

            vScreenUv = gl_Position.xy * aspect;
        }
    `;
    private static readonly _fragmentSource = `
        precision highp float;

        const float CHECKER_SCALE = 20.0;

        varying vec2 vUv;
        varying vec2 vScreenUv;

        void main(){
            //checker bg
            float x = vScreenUv.x;
            x = floor(mod(x * CHECKER_SCALE, 2.0));
            float y = vScreenUv.y + (x * (1.0 / CHECKER_SCALE));
            y = floor(mod(y * CHECKER_SCALE, 2.0));
            float bg = mix(0.75, 0.8, y);

            //grid
            vec2 gUv = abs(fract(vUv * 16.0) - 0.5) * 2.0;
            float grid = max(gUv.x, gUv.y);
            grid = smoothstep(1.0, 0.90, grid);

            //composite
            vec3 col = vec3(mix(grid, bg, grid));
            
            gl_FragColor = vec4(col, 1.0);
        }
    `;
    private static readonly _planeGeo = [
        -1, 1,
        1, 1,
        1, -1,
        1, -1,
        -1, -1,
        -1, 1
    ].map(i => i * 320);
    private static readonly _planeUVs = [
        0, 1,
        1, 1,
        1, 0,
        1, 0,
        0, 0,
        0, 1,
    ];

    private readonly GRID_DIV = Core.Sprite.DIMENSIONS;
    private readonly CANVAS_WIDTH = this.GRID_DIV * 20;

    private _nextDrawCall: number | null = null;
    private _navState: Core.iNavState;
    private _canvas: HTMLCanvasElement;
    private _gl: WebGL2RenderingContext;
    private _program: WebGLProgram;
    private _dimensionUniformLoc: WebGLUniformLocation;
    private _viewMatrixUniformLoc: WebGLUniformLocation;
    private _positionAttribLoc: number;
    private _uvAttribLoc: number;
    private _positionBuffer: WebGLBuffer;
    private _uvBuffer: WebGLBuffer;
    private _vao: WebGLVertexArrayObject;

    constructor(element: HTMLCanvasElement, spriteData: ImageData, previewData: ImageData, navState: Core.iNavState){
        this._navState = navState;
        this._canvas = element;

        //Setup webGL context
        this._gl = WGL.getGLContext(this._canvas)!;
        this._program = WGL.createProgram(
            this._gl,
            WGL.createShader(this._gl, this._gl.VERTEX_SHADER, Art_Canvas_Renderer._vertexSource)!,
            WGL.createShader(this._gl, this._gl.FRAGMENT_SHADER, Art_Canvas_Renderer._fragmentSource)!
        )!;

        this._dimensionUniformLoc = this._gl.getUniformLocation(this._program, 'u_dimensions')!;
        this._viewMatrixUniformLoc = this._gl.getUniformLocation(this._program, 'u_viewMatrix')!;
        this._positionAttribLoc = this._gl.getAttribLocation(this._program, 'a_position');
        this._uvAttribLoc = this._gl.getAttribLocation(this._program, 'a_uv');

        this._positionBuffer = this._gl.createBuffer()!;
        this._uvBuffer = this._gl.createBuffer()!;
        this._vao = this._gl.createVertexArray()!;

        this._gl.bindVertexArray(this._vao);
        this._gl.bindBuffer(this._gl.ARRAY_BUFFER, this._positionBuffer);
        this._gl.bufferData(this._gl.ARRAY_BUFFER, new Float32Array(Art_Canvas_Renderer._planeGeo), this._gl.STATIC_DRAW);
        this._gl.enableVertexAttribArray(this._positionAttribLoc);
        this._gl.vertexAttribPointer(this._positionAttribLoc, 2, this._gl.FLOAT, false, 0, 0);
        this._gl.bindBuffer(this._gl.ARRAY_BUFFER, this._uvBuffer);
        this._gl.bufferData(this._gl.ARRAY_BUFFER, new Float32Array(Art_Canvas_Renderer._planeUVs), this._gl.STATIC_DRAW);
        this._gl.enableVertexAttribArray(this._uvAttribLoc);
        this._gl.vertexAttribPointer(this._uvAttribLoc, 2, this._gl.FLOAT, false, 0, 0);

        this._gl.clearColor(1, 1, 1, 1);
        this._gl.useProgram(this._program);
        this._gl.uniformMatrix3fv(this._viewMatrixUniformLoc, false, this.getCanvasXfrm().data);

        this.resize();
        this.queueRender();
    }

    getCanvasXfrm(): Core.Mat3 {
        const zoom = this._navState.zoomFac;
        const { x, y } = this._navState.offset;
        const zoomMat = new Core.Mat3([zoom, 0, 0, 0, zoom, 0, 0, 0, 1]);
        const tranMat = new Core.Mat3([1, 0, x * 2, 0, 1, y * 2, 0, 0, 1]);
        return zoomMat.multiply(tranMat);
    }

    queueRender(){
        if (!this._nextDrawCall){
            this._nextDrawCall = requestAnimationFrame(()=>{
                this.render()
                this._nextDrawCall = null;
            });
        }
    }

    render(): void {
        this._gl.clear(this._gl.COLOR_BUFFER_BIT);
        this._gl.useProgram(this._program);
        this._gl.bindVertexArray(this._vao);
        this._gl.uniform2f(this._dimensionUniformLoc, this._gl.canvas.width, this._gl.canvas.height);
        this._gl.drawArrays(this._gl.TRIANGLES, 0, 6);
    }

    resize(): void {
        this._gl.viewport(0, 0, this._canvas.width, this._canvas.height);
    }

    navChanged(): void {
        this._gl.uniformMatrix3fv(this._viewMatrixUniformLoc, false, this.getCanvasXfrm().data);
        this.queueRender();
    }

    setSprite(newSprite: ImageData, navRef: Core.iNavState): void {
        this._navState = navRef;

        this.queueRender();
    }

    mouseDown(): void {
        this.queueRender();
    }

    mouseUp(): void {
        this.queueRender();
    }

    mouseMove(): void {
        this.queueRender();
    }
}