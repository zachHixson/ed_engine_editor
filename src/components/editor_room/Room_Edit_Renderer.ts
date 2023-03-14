import Core from '@/core';
import svgToCanvas from '@/components/common/svgToCanvas';

import cameraLocIconRaw from '@/assets/camera_location.svg?raw';
import objectIconRaw from '@/assets/object_icon.svg?raw';
import exitIconRaw from '@/assets/exit.svg?raw';
import endIconRaw from '@/assets/end.svg?raw';

const { Vector, Mat3, WGL } = Core;

const NO_SPRITE_PADDING = 0.85;
let iconsLoaded = false;

export default class Room_Edit_Renderer {
    private static readonly _planeGeo = WGL.createPlaneGeo();
    private static readonly _planeUVs = WGL.createPlaneGeo().map(i => (i + 1) * 0.5);
    private static readonly _vertexSource = `
        attribute vec2 a_position;
        attribute vec2 a_uv;

        varying vec2 v_uv;

        void main(){
            v_uv = a_uv;
            gl_Position = vec4(a_position, 1.0, 1.0);
        }
    `;
    private static readonly _fragmentSource = `
        precision highp float;

        uniform sampler2D u_instanceBuffer;
        uniform sampler2D u_uiBuffer;
        uniform vec3 u_bgColor;
        uniform int u_drawGrid;

        varying vec2 v_uv;

        void main(){
            vec3 outCol = u_bgColor;

            vec4 instanceBuffer = texture2D(u_instanceBuffer, v_uv);
            vec4 uiBuffer = texture2D(u_uiBuffer, v_uv);

            outCol = mix(outCol, instanceBuffer.rgb, instanceBuffer.a);
            outCol = mix(outCol, uiBuffer.rgb, uiBuffer.a);

            gl_FragColor = vec4(outCol, 1.0);
        }
    `;

    private _nextDrawCall: number | null = null;
    private _canvas: HTMLCanvasElement;
    private _navState: Core.NavState;
    private _gl: WebGL2RenderingContext;
    private _program: WebGLProgram;
    private _instanceRenderer: Core.Instance_Renderer;
    private _uiRenderer: UI_Renderer;
    private _instanceBuffer: Core.WGL.Texture_Object;
    private _uiBuffer: Core.WGL.Texture_Object;
    private _bgColorUniform: Core.WGL.Uniform_Object;
    private _drawGridUniform: Core.WGL.Uniform_Object;
    private _positionAttribute: Core.WGL.Attribute_Object;
    private _uvAttribute: Core.WGL.Attribute_Object;
    private _vao: WebGLVertexArrayObject;
    private _viewMatrix = new Mat3();
    private _viewMatrixNeedsUpdate = true;

    constructor(canvas: HTMLCanvasElement, navState: Core.NavState){
        this._canvas = canvas;
        this._navState = navState;
        this._gl = WGL.getGLContext(this._canvas)!;
        this._program = WGL.createProgram(
            this._gl,
            WGL.createShader(this._gl, this._gl.VERTEX_SHADER, Room_Edit_Renderer._vertexSource)!,
            WGL.createShader(this._gl, this._gl.FRAGMENT_SHADER, Room_Edit_Renderer._fragmentSource)!
        )!;
        this._instanceRenderer = new Core.Instance_Renderer(this._gl);
        this._uiRenderer = new UI_Renderer(this._gl);
        this._instanceBuffer = new WGL.Texture_Object(this._gl, this._program, 'u_instanceBuffer', this._instanceRenderer.texture);
        this._uiBuffer = new WGL.Texture_Object(this._gl, this._program, 'u_uiBuffer', this._uiRenderer.texture);
        this._drawGridUniform = new WGL.Uniform_Object(this._gl, this._program, 'u_drawGrid', WGL.Uniform_Types.INT);
        this._bgColorUniform = new WGL.Uniform_Object(this._gl, this._program, 'u_bgColor', WGL.Uniform_Types.VEC3);
        this._positionAttribute = new WGL.Attribute_Object(this._gl, this._program, 'a_position');
        this._uvAttribute = new WGL.Attribute_Object(this._gl, this._program, 'a_uv');
        this._vao = this._gl.createVertexArray()!;

        this._gl.bindVertexArray(this._vao);

        this._positionAttribute.set(new Float32Array(Room_Edit_Renderer._planeGeo), 2);
        this._uvAttribute.set(new Float32Array(Room_Edit_Renderer._planeUVs), 2);

        this._gl.clearColor(0, 0, 0, 0);
    }

    get CELL_PX_WIDTH(){return 50};
    get UNIT_WIDTH(){return this.CELL_PX_WIDTH / 16};

    private _updateViewMatrix(): void {
        if (!this._viewMatrixNeedsUpdate) return;

        const zoom = this._navState.zoomFac;
        const { x, y } = this._navState.offset;
        const dimensions = new Vector(this._gl.canvas.width / 2, this._gl.canvas.height / 2);
        const zoomMat = new Mat3([zoom, 0, 0, 0, zoom, 0, 0, 0, 1]);
        const tranMat = new Mat3([1, 0, x, 0, 1, y, 0, 0, 1]);
        const aspectMat = new Mat3([
            1.0 / dimensions.x, 0, 0,
            0, 1.0 / dimensions.y, 0,
            0, 0, 1.0
        ]);
        this._viewMatrix.copy(zoomMat.multiply(aspectMat).multiply(tranMat));
        this._instanceRenderer.updateViewMatrix(this._viewMatrix);
        this._uiRenderer.updateViewMatrix(this._viewMatrix);
        this._viewMatrixNeedsUpdate = false;
    }

    getMouseCell(){
        return //this.mouseCell;
    }

    getMouseWorldCell(){
        return //this.mouseCell.clone().multiplyScalar(16);
    }

    setRoomRef(roomObj: Core.Room){
        //
    }

    setSelection(instRef: Core.Instance_Base){
        //
    }

    setGridVisibility(newVisibility: boolean){
        //
    }

    mouseMove(event: MouseEvent){
        //
    }

    navChanged(): void {
        this._viewMatrixNeedsUpdate = true;
        this.queueRender();
    }

    instancesChanged(){
        //
    }

    bgColorChanged(){
        this.queueRender();
    }

    resize(){
        this._gl.viewport(0, 0, this._gl.canvas.width, this._gl.canvas.height);
        this._instanceRenderer.resize();
        this._uiRenderer.resize();
        this.queueRender();
    }

    queueRender(): void {
        if (!this._nextDrawCall){
            this._nextDrawCall = requestAnimationFrame(()=>{
                this.render();
                this._nextDrawCall = null;
            });
        }
    }

    render(): void {
        //update matrix and buffers
        this._updateViewMatrix();
        this._instanceRenderer.render();
        this._uiRenderer.render();

        //setup render
        this._gl.clear(this._gl.COLOR_BUFFER_BIT);
        this._gl.useProgram(this._program);
        this._bgColorUniform.set(1, 1, 1);
        this._gl.bindVertexArray(this._vao);

        //enable attributes and textures 
        this._positionAttribute.enable();
        this._uvAttribute.enable();
        this._instanceBuffer.activate();
        this._uiBuffer.activate();

        //draw
        this._gl.drawArrays(this._gl.TRIANGLES, 0, 6);

        //disable attributes and textures
        this._positionAttribute.disable();
        this._uvAttribute.disable();
        this._instanceBuffer.deactivate();
        this._uiBuffer.deactivate();
    }

    screenToWorldPos(pt: Core.Vector){
        //
    }

    worldToScreenPos(pt: Core.Vector){
        //
    }

    destroy(): void {
        this._instanceRenderer.destroy();
        this._instanceBuffer.destroy();
    }
}

class UI_Renderer {
    private static readonly _planeGeo = WGL.createPlaneGeo();
    private static readonly _vertexSource = `
        attribute vec2 a_position;

        uniform mat3 u_invViewMatrix;

        varying vec2 v_uv;

        void main(){
            v_uv = (vec3(a_position, 1.0) * u_invViewMatrix).xy;
            gl_Position = vec4(a_position, 0.0, 1.0);
        }
    `;
    private static readonly _fragmentSource = `
        precision highp float;

        varying vec2 v_uv;

        void main(){
            //grid
            vec2 tUv = fract(v_uv / 16.0);
            tUv = abs(tUv - 0.5) * 2.0;
            float grid = max(tUv.x, tUv.y);
            grid = step(grid, 0.95);

            //composite
            gl_FragColor = vec4(vec3(grid), 1.0 - grid);
        }
    `;

    private _gl: WebGL2RenderingContext;
    private _program: WebGLProgram;
    private _invViewMatrixUniform: Core.WGL.Uniform_Object;
    private _dimensionUniform: Core.WGL.Uniform_Object;
    private _cursorUniform: Core.WGL.Uniform_Object;
    private _positionAttribute: Core.WGL.Attribute_Object;
    private _vao: WebGLVertexArrayObject;
    private _outputTexture: Core.WGL.Render_Texture;

    constructor(gl: WebGL2RenderingContext){
        this._gl = gl;
        this._program = WGL.createProgram(
            this._gl,
            WGL.createShader(this._gl, this._gl.VERTEX_SHADER, UI_Renderer._vertexSource)!,
            WGL.createShader(this._gl, this._gl.FRAGMENT_SHADER, UI_Renderer._fragmentSource)!
        )!;
        this._invViewMatrixUniform = new WGL.Uniform_Object(this._gl, this._program, 'u_invViewMatrix', WGL.Uniform_Types.MAT3);
        this._dimensionUniform = new WGL.Uniform_Object(this._gl, this._program, 'u_dimensions', WGL.Uniform_Types.VEC2);
        this._cursorUniform = new WGL.Uniform_Object(this._gl, this._program, 'u_cursor', WGL.Uniform_Types.VEC2);
        this._positionAttribute = new WGL.Attribute_Object(this._gl, this._program, 'a_position');
        this._vao = this._gl.createVertexArray()!;
        this._outputTexture = new WGL.Render_Texture(this._gl, this._gl.canvas.width, this._gl.canvas.height);

        this._gl.bindVertexArray(this._vao);
        
        this._positionAttribute.set(new Float32Array(UI_Renderer._planeGeo), 2, this._gl.FLOAT);
    }

    get texture(){return this._outputTexture.texture}

    resize(): void {
        this._gl.useProgram(this._program);
        this._dimensionUniform.set(this._gl.canvas.width / 2, this._gl.canvas.height / 2);
        this._outputTexture.resize(this._gl.canvas.width, this._gl.canvas.height);
    }

    updateViewMatrix(viewMat: Core.Mat3): void {
        this._gl.useProgram(this._program);
        this._invViewMatrixUniform.set(false, viewMat.clone().inverse().data);
    }

    render(): void {
        //setup render
        this._gl.bindVertexArray(this._vao);
        this._gl.useProgram(this._program);

        //enable attributes and render target
        this._positionAttribute.enable();
        this._outputTexture.setAsRenderTarget();

        //draw
        this._gl.viewport(0, 0, this._gl.canvas.width, this._gl.canvas.height);
        this._gl.clear(this._gl.COLOR_BUFFER_BIT);
        this._gl.drawArrays(this._gl.TRIANGLES, 0, 6);

        //disable attributes and render target
        this._positionAttribute.disable();
        this._outputTexture.unsetRenderTarget();
    }
}