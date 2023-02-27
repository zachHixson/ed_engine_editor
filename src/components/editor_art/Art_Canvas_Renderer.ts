import Core from '@/core';

const { WGL } = Core;

export default class Art_Canvas_Renderer{
    private static readonly GRID_DIV = Core.Sprite.DIMENSIONS;
    private static readonly CANVAS_WIDTH = this.GRID_DIV * 20;

    private static readonly _vertexSource = `
        uniform vec2 u_dimensions;
        uniform mat3 u_viewMatrix;

        attribute vec2 a_position;
        attribute vec2 a_uv;
        
        varying vec2 vUv;
        varying vec2 vScreenUv;
        
        void main(){
            vec2 aspect = vec2(u_dimensions.y / u_dimensions.x, 1.0);
            vec3 aspPos = vec3(a_position, 1.0) * u_viewMatrix;
            aspPos.xy /= u_dimensions;
            
            gl_Position = vec4(aspPos, 1.0);

            vUv = a_uv * vec2(1.0, -1.0);
            vScreenUv = gl_Position.xy * u_dimensions;
        }
    `;
    private static readonly _fragmentSource = `
        precision highp float;

        const float CHECKER_SCALE = 16.0;

        uniform sampler2D u_spriteTexture;
        uniform sampler2D u_previewTexture;

        varying vec2 vUv;
        varying vec2 vScreenUv;

        void main(){
            //checker bg
            float x = vScreenUv.x;
            x = floor(mod(x / CHECKER_SCALE, 2.0));
            float y = vScreenUv.y + (x * CHECKER_SCALE);
            y = floor(mod(y / CHECKER_SCALE, 2.0));
            float bg = mix(0.75, 0.8, y);

            //grid
            vec2 gUv = abs(fract(vUv * 16.0) - 0.5) * 2.0;
            float grid = max(gUv.x, gUv.y);
            grid = smoothstep(1.0, 0.93, grid);

            //sprite and preview textures
            vec4 sprite = texture2D(u_spriteTexture, vUv);
            vec4 preview = texture2D(u_previewTexture, vUv);

            //composite
            vec3 col = mix(vec3(bg), sprite.rgb, sprite.a);
            col = mix(col, preview.rgb, preview.a);
            col = mix(vec3(0.3), col, grid);
            
            gl_FragColor = vec4(col, 1.0);
        }
    `;
    private static readonly _planeGeo = WGL.createPlaneGeo().map(i => i * Art_Canvas_Renderer.CANVAS_WIDTH * 0.5);
    private static readonly _planeUVs = WGL.createPlaneGeo().map(i => (i + 1) / 2);

    private _nextDrawCall: number | null = null;
    private _navState: Core.iNavState;
    private _canvas: HTMLCanvasElement;
    private _spriteData: ImageData;
    private _previewData: ImageData;
    private _gl: WebGL2RenderingContext;
    private _program: WebGLProgram;
    private _positionAttribute: Core.WGL.Attribute_Object;
    private _uvAttribute: Core.WGL.Attribute_Object;
    private _dimensionUniform: Core.WGL.Uniform_Object;
    private _viewMatrixUniform: Core.WGL.Uniform_Object;
    private _spriteTexUniform: Core.WGL.Texture_Object;
    private _previewTexUniform: Core.WGL.Texture_Object;
    private _vao: WebGLVertexArrayObject;

    constructor(element: HTMLCanvasElement, spriteData: ImageData, previewData: ImageData, navState: Core.iNavState){
        this._navState = navState;
        this._canvas = element;
        this._spriteData = spriteData;
        this._previewData = previewData;

        //Setup webGL context
        this._gl = WGL.getGLContext(this._canvas)!;
        this._program = WGL.createProgram(
            this._gl,
            WGL.createShader(this._gl, this._gl.VERTEX_SHADER, Art_Canvas_Renderer._vertexSource)!,
            WGL.createShader(this._gl, this._gl.FRAGMENT_SHADER, Art_Canvas_Renderer._fragmentSource)!
        )!;

        this._positionAttribute = new WGL.Attribute_Object(this._gl, this._program, 'a_position');
        this._uvAttribute = new WGL.Attribute_Object(this._gl, this._program, 'a_uv');
        this._dimensionUniform = new WGL.Uniform_Object(this._gl, this._program, 'u_dimensions', WGL.Uniform_Types.VEC2);
        this._viewMatrixUniform = new WGL.Uniform_Object(this._gl, this._program, 'u_viewMatrix', WGL.Uniform_Types.MAT3);
        this._spriteTexUniform = new WGL.Texture_Object(this._gl, this._program, 'u_spriteTexture');
        this._previewTexUniform = new WGL.Texture_Object(this._gl, this._program, 'u_previewTexture');

        this._vao = this._gl.createVertexArray()!;

        this._gl.bindVertexArray(this._vao);

        this._positionAttribute.set(new Float32Array(Art_Canvas_Renderer._planeGeo), 2);
        this._uvAttribute.set(new Float32Array(Art_Canvas_Renderer._planeUVs), 2);

        this._gl.clearColor(1, 1, 1, 1);
        this._gl.useProgram(this._program);
        this._viewMatrixUniform.set(false, this.getCanvasXfrm().data);

        this.updateSpriteTexture();

        this.resize();
        this.queueRender();
    }

    getCanvasXfrm(): Core.Mat3 {
        const zoom = this._navState.zoomFac;
        const { x, y } = this._navState.offset;
        const zoomMat = new Core.Mat3([zoom, 0, 0, 0, zoom, 0, 0, 0, 1]);
        const tranMat = new Core.Mat3([1, 0, x, 0, 1, y, 0, 0, 1]);
        return zoomMat.multiply(tranMat);
    }

    queueRender(): void {
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
        this._dimensionUniform.set(this._gl.canvas.width / 2, this._gl.canvas.height / 2);
        this._spriteTexUniform.activate();
        this._previewTexUniform.activate();
        this._gl.drawArrays(this._gl.TRIANGLES, 0, 6);
    }

    resize(): void {
        this._gl.viewport(0, 0, this._canvas.width, this._canvas.height);
    }

    navChanged(): void {
        this._viewMatrixUniform.set(false, this.getCanvasXfrm().data);
        this.queueRender();
    }

    setSprite(newSprite: ImageData, navRef: Core.iNavState): void {
        this._navState = navRef;
        this._spriteData = newSprite;
        this.updateSpriteTexture();
    }

    updateSpriteTexture(): void {
        this._spriteTexUniform.set(this._spriteData);
        this.queueRender();
    }

    private _updatePreviewTexture(): void {
        this._previewTexUniform.set(this._previewData);
        this.queueRender();
    }

    mouseDown(): void {
        this.queueRender();
    }

    mouseUp(): void {
        this.queueRender();
    }

    mouseMove(): void {
        this._updatePreviewTexture();
        this.queueRender();
    }
}