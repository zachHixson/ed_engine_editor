import Core from '@/core';
import svgToCanvas from '@/components/common/svgToCanvas';

import cameraLocIconRaw from '@/assets/camera_location.svg?raw';
import objectIconRaw from '@/assets/object_icon.svg?raw';
import exitIconRaw from '@/assets/exit.svg?raw';
import endIconRaw from '@/assets/end.svg?raw';

const { Vector, Mat3, WGL } = Core;

const ICON_PADDING = 0.85;
let iconsLoaded = false;

export default class Room_Edit_Renderer {
    private _nextDrawCall: number | null = null;
    private _canvas: HTMLCanvasElement;
    private _navState: Core.NavState;
    private _roomRef: Core.Room | null = null;
    private _selectedInstance: Core.Instance_Base | null = null;
    private _gl: WebGL2RenderingContext;
    private _instanceRenderer: Core.Instance_Renderer;
    private _iconRenderer: Core.Instance_Renderer;
    private _uiRenderer: UI_Renderer;
    private _viewMatrix = new Mat3();
    private _viewMatrixInv = new Mat3();
    private _viewMatrixNeedsUpdate = true;
    private _mouseCell = new Vector(0, 0);

    constructor(canvas: HTMLCanvasElement, navState: Core.NavState){
        this._canvas = canvas;
        this._navState = navState;
        this._gl = WGL.getGLContext(this._canvas)!;
        this._instanceRenderer = new Core.Instance_Renderer(this._gl, Core.Sprite.DIMENSIONS, 1024, false, true);
        this._iconRenderer = new Core.Instance_Renderer(this._gl, 128, 512, true);
        this._uiRenderer = new UI_Renderer(this._gl);

        this._gl.clearColor(0, 0, 0, 0);
        this._gl.enable(this._gl.BLEND);
        this._gl.blendFunc(this._gl.SRC_ALPHA, this._gl.ONE_MINUS_SRC_ALPHA);

        if (!iconsLoaded){
            document.addEventListener('icons-loaded', this._iconsLoaded as EventListener, {once: true});
        }

        this._iconRenderer.setInstanceScale(ICON_PADDING);
        this.setSelection(null);
    }

    get CELL_PX_WIDTH(){return 50};
    get UNIT_WIDTH(){return this.CELL_PX_WIDTH / 16};

    private _updateViewMatrix(): void {
        if (!this._viewMatrixNeedsUpdate) return;

        const zoom = this._navState.zoomFac * this.UNIT_WIDTH;
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
        this._viewMatrixInv.copy(this._viewMatrix).inverse();
        this._instanceRenderer.updateViewMatrix(this._viewMatrix);
        this._iconRenderer.updateViewMatrix(this._viewMatrix);
        this._uiRenderer.updateViewMatrix(this._viewMatrix, this._viewMatrixInv);
        this._viewMatrixNeedsUpdate = false;
    }

    private _iconsLoaded = (event: CustomEvent): void => {
        const ids = event.detail as string[];

        for (let i = 0; i < ids.length; i++){
            this._iconRenderer.updateSprite(ids[i]);
        }

        this.queueRender();
    }
    
    getMouseWorldCell(){
        return this._mouseCell.clone();
    }

    setRoomRef(roomObj: Core.Room){
        this._roomRef = roomObj;
        this._navState = this._roomRef.navState;
        this.navChanged();
        this.initInstances();
        this._uiRenderer.updateCamera(this._roomRef.camera.pos, this._roomRef.camera.size);
        this.bgColorChanged();
    }

    setSelection(instRef: Core.Instance_Base | null){
        this._selectedInstance = instRef;

        if (this._selectedInstance){
            this._uiRenderer.updateSelection(this._selectedInstance.pos, true);
        }
        else{
            this._uiRenderer.updateSelection(new Vector(0,0), false);
        }
        
        this.queueRender();
    }

    setGridVisibility(newVisibility: boolean){
        this._uiRenderer.setGridState(newVisibility);
        this.queueRender();
    }

    mouseMove(event: MouseEvent){
        //convert to clip space
        const mousePos = new Vector(event.offsetX, event.offsetY).multiplyScalar(devicePixelRatio);
        const windowDimensions = new Vector(this._canvas.width, this._canvas.height);
        mousePos.divide(windowDimensions).subtractScalar(0.5).multiplyScalar(2);
        mousePos.y *= -1;

        const mouseCell = mousePos.clone().multiplyMat3(this._viewMatrixInv.clone().transpose());
        mouseCell.divideScalar(16);
        mouseCell.floor();
        mouseCell.multiplyScalar(16);
        this._mouseCell.copy(mouseCell);

        this._uiRenderer.updateMousePos(this._mouseCell);
        this.queueRender();
    }

    navChanged(): void {
        this._viewMatrixNeedsUpdate = true;
        this.queueRender();
    }

    cameraChanged(): void {
        const camera = this._roomRef!.camera;

        this._uiRenderer.updateCamera(camera.pos, camera.size);
        this.queueRender();
    }

    private _getRenderer(instance: Core.Instance_Base): Core.Instance_Renderer {
        return instance.hasEditorFrame ? this._instanceRenderer : this._iconRenderer;
    }

    initInstances(): void {
        if (!this._roomRef) return;

        this._instanceRenderer.clear();
        this._iconRenderer.clear();

        this._roomRef.instanceList.forEach(instance => {
            this.addInstance(instance);
        });

        this.queueRender();
    }

    addInstance(instance: Core.Instance_Base): void {
        const renderer = this._getRenderer(instance);
        renderer.addInstance(instance, instance.editorFrameNum);
        this.queueRender();
    }

    removeInstance(instance: Core.Instance_Base): void {
        const renderer = this._getRenderer(instance);
        renderer.removeInstance(instance);
        this.queueRender();
    }

    updateInstance(instance: Core.Instance_Base): void {
        const renderer = this._getRenderer(instance);
        renderer.updateInstance(instance);
        this.queueRender();
    }

    bgColorChanged(){
        if (!this._roomRef) return;

        const bgColor = this._roomRef.bgColor;
        const normalized = new Core.Draw.Color();

        const luma = Math.max(bgColor.r, bgColor.g, bgColor.b);
        const iconColor = luma > 100 ? new Core.Draw.Color(0,0,0) : new Core.Draw.Color(0.8, 0.8, 0.8);

        this._gl.clearColor(bgColor.r / 255, bgColor.g / 255, bgColor.b / 255, 1);
        this._iconRenderer.setColorOverride(iconColor);
        this._uiRenderer.setIconColor(iconColor);
        this.queueRender();
    }

    resize(){
        this._gl.viewport(0, 0, this._gl.canvas.width, this._gl.canvas.height);
        this._instanceRenderer.resize();
        this._iconRenderer.resize();
        this._uiRenderer.resize();
        this.queueRender();
    }

    queueRender(): void {
        if (this._nextDrawCall == null){
            this._nextDrawCall = requestAnimationFrame(()=>{
                this.render();
                this._nextDrawCall = null;
            });
        }
    }

    render(): void {
        this._updateViewMatrix();
        this._gl.depthMask(true);
        this._gl.clear(this._gl.COLOR_BUFFER_BIT | this._gl.DEPTH_BUFFER_BIT);
        this._gl.depthMask(false);
        this._instanceRenderer.render();
        this._iconRenderer.render();
        this._uiRenderer.render();
    }
}

class UI_Renderer {
    static CAMERA_ICON = new ImageData(128, 128);
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

        uniform bool u_showGrid;
        uniform float u_pixelWidth;
        uniform vec2 u_cursor;
        uniform vec3 u_selection;
        uniform vec3 u_camera;
        uniform vec3 u_iconColor;
        uniform sampler2D u_cameraIcon;

        varying vec2 v_uv;

        void main(){
            //world grid
            vec2 tUv = fract(v_uv / 16.0);
            tUv = abs(tUv - 0.5) * 2.0;
            float grid = max(tUv.x, tUv.y) * 16.0;
            grid -= 16.0 - (u_pixelWidth * 1.5);
            grid = smoothstep(0.0, u_pixelWidth, grid);

            //xy grid
            vec2 absUv = abs(v_uv) * 2.0;
            absUv -= (u_pixelWidth * 2.0) * .75;
            absUv = 1.0 - smoothstep(0.0, u_pixelWidth * 2.0, absUv);
            float xAxis = absUv.y;
            float yAxis = absUv.x;

            //cursor
            vec2 cursorUv = abs(v_uv - u_cursor - 8.0) - 8.0;
            float cursor = step(max(cursorUv.x, cursorUv.y), 0.01);

            //camera
            vec2 cameraUv = (v_uv - u_camera.xy) / 16.0;
            cameraUv.y = 1.0 - cameraUv.y;
            vec4 cameraIcon = texture2D(u_cameraIcon, cameraUv);

            vec2 cameraGradUv = abs(cameraUv - 0.5) * 2.0;
            float cameraGrad = max(cameraGradUv.x, cameraGradUv.y);
            float cameraMask = step(cameraGrad, 1.0);
            float cameraBounds = abs(cameraGrad - u_camera.z) * 16.0;
            cameraBounds -= u_pixelWidth * 1.5;
            cameraBounds = 1.0 - smoothstep(0.0, u_pixelWidth, cameraBounds);

            //selection
            vec2 selectionUv = abs(((v_uv - u_selection.xy) / 16.0) - 0.5) * 2.0;
            float selectionBox = max(selectionUv.x, selectionUv.y) * 16.0;
            selectionBox = abs(selectionBox - 16.0);
            selectionBox -= u_pixelWidth * 3.5;
            selectionBox = (1.0 - smoothstep(0.0, u_pixelWidth * 2.0, selectionBox)) * u_selection.z;

            //composite
            gl_FragColor = vec4(vec3(0.5), 0.3 * cursor);

            if (u_showGrid){
                gl_FragColor = mix(gl_FragColor, vec4(vec3(0.6), 0.5), grid);
                gl_FragColor = mix(gl_FragColor, vec4(1.0, 0.5, 0.0, 1.0), xAxis);
                gl_FragColor = mix(gl_FragColor, vec4(0.5, 1.0, 0.0, 1.0), yAxis);
            }
            
            gl_FragColor = mix(gl_FragColor, vec4(vec3(u_iconColor), 1.0), cameraIcon.a * cameraMask);
            gl_FragColor = mix(gl_FragColor, vec4(vec3((u_iconColor + 0.5) * 0.4), 1.0), cameraBounds);
            gl_FragColor = mix(gl_FragColor, vec4(0.0, 0.5, 1.0, 1.0), selectionBox);
        }
    `;

    private _gl: WebGL2RenderingContext;
    private _program: WebGLProgram;
    private _invViewMatrixUniform: Core.WGL.Uniform_Object;
    private _showGridUniform: Core.WGL.Uniform_Object;
    private _pixelWidthUniform: Core.WGL.Uniform_Object;
    private _dimensionUniform: Core.WGL.Uniform_Object;
    private _cursorUniform: Core.WGL.Uniform_Object;
    private _cameraUniform: Core.WGL.Uniform_Object;
    private _iconColorUniform: Core.WGL.Uniform_Object;
    private _selectionUniform: Core.WGL.Uniform_Object;
    private _cameraIconUniform: Core.WGL.Texture_Object;
    private _positionAttribute: Core.WGL.Attribute_Object;
    private _vao: WebGLVertexArrayObject;

    constructor(gl: WebGL2RenderingContext){
        this._gl = gl;
        this._program = WGL.createProgram(
            this._gl,
            WGL.createShader(this._gl, this._gl.VERTEX_SHADER, UI_Renderer._vertexSource)!,
            WGL.createShader(this._gl, this._gl.FRAGMENT_SHADER, UI_Renderer._fragmentSource)!
        )!;
        this._invViewMatrixUniform = new WGL.Uniform_Object(this._gl, this._program, 'u_invViewMatrix', WGL.Uniform_Types.MAT3);
        this._showGridUniform = new WGL.Uniform_Object(this._gl, this._program, 'u_showGrid', WGL.Uniform_Types.BOOL);
        this._pixelWidthUniform = new WGL.Uniform_Object(this._gl, this._program, 'u_pixelWidth', WGL.Uniform_Types.FLOAT);
        this._dimensionUniform = new WGL.Uniform_Object(this._gl, this._program, 'u_dimensions', WGL.Uniform_Types.VEC2);
        this._cursorUniform = new WGL.Uniform_Object(this._gl, this._program, 'u_cursor', WGL.Uniform_Types.VEC2);
        this._cameraUniform = new WGL.Uniform_Object(this._gl, this._program, 'u_camera', WGL.Uniform_Types.VEC3);
        this._iconColorUniform = new WGL.Uniform_Object(this._gl, this._program, 'u_iconColor', WGL.Uniform_Types.VEC3);
        this._selectionUniform = new WGL.Uniform_Object(this._gl, this._program, 'u_selection', WGL.Uniform_Types.VEC3);
        this._cameraIconUniform = new WGL.Texture_Object(this._gl, this._program, 'u_cameraIcon');
        this._positionAttribute = new WGL.Attribute_Object(this._gl, this._program, 'a_position');
        this._vao = this._gl.createVertexArray()!;

        this._gl.bindVertexArray(this._vao);
        
        this._positionAttribute.set(new Float32Array(UI_Renderer._planeGeo), 2, this._gl.FLOAT);

        if (!iconsLoaded){
            document.addEventListener('icons-loaded', this.iconsLoaded, {once: true});
        }
        else{
            this.iconsLoaded();
        }
    }

    resize(): void {
        this._gl.useProgram(this._program);
        this._dimensionUniform.set(this._gl.canvas.width / 2, this._gl.canvas.height / 2);
    }

    iconsLoaded = (): void => {
        this._gl.useProgram(this._program);
        this._cameraIconUniform.set(UI_Renderer.CAMERA_ICON, ()=>{
            this._gl.generateMipmap(this._gl.TEXTURE_2D);
            this._gl.texParameteri(this._gl.TEXTURE_2D, this._gl.TEXTURE_MIN_FILTER, this._gl.LINEAR_MIPMAP_LINEAR);
            this._gl.texParameteri(this._gl.TEXTURE_2D, this._gl.TEXTURE_MAG_FILTER, this._gl.NEAREST);
        });
    }

    updateViewMatrix(viewMat: Core.Mat3, viewMatInv: Core.Mat3): void {
        const screenWidth = this._gl.canvas.width;
        const transposed = viewMatInv.clone().transpose();
        const p1 = new Vector(0, 0).multiplyMat3(transposed);
        const p2 = new Vector(1/(screenWidth/2), 0).multiplyMat3(transposed);
        const pixelWidth = (p2.x - p1.x);

        //update uniforms
        this._gl.useProgram(this._program);
        this._invViewMatrixUniform.set(false, viewMatInv.data);
        this._pixelWidthUniform.set(pixelWidth);
    }

    updateMousePos(mouseCell: Core.Vector): void {
        this._gl.useProgram(this._program);
        this._cursorUniform.set(mouseCell.x, mouseCell.y);
    }

    updateCamera(pos: Core.Vector, size: number): void {
        this._gl.useProgram(this._program);
        this._cameraUniform.set(pos.x - 8, pos.y - 8, size);
    }

    updateSelection(pos: Core.Vector, enabled: boolean): void {
        this._gl.useProgram(this._program);
        this._selectionUniform.set(pos.x, pos.y, enabled);
    }

    setGridState(state: boolean): void {
        this._gl.useProgram(this._program);
        this._showGridUniform.set(state);
    }

    setIconColor(newColor: Core.Draw.Color): void {
        this._gl.useProgram(this._program);
        this._iconColorUniform.set(newColor.r, newColor.g, newColor.b);
    }

    render(): void {
        //setup render
        this._gl.bindVertexArray(this._vao);
        this._gl.useProgram(this._program);

        //enable attributes and render target
        this._positionAttribute.enable();
        this._cameraIconUniform.activate();

        //draw
        this._gl.viewport(0, 0, this._gl.canvas.width, this._gl.canvas.height);
        this._gl.drawArrays(this._gl.TRIANGLES, 0, 6);

        //disable attributes and render target
        this._positionAttribute.disable();
        this._cameraIconUniform.deactivate();
    }
}

//load icons
(()=>{
    const DIM = 128;
    const LOAD_ARRAY = [
        svgToCanvas(cameraLocIconRaw, DIM, canvas => {
            UI_Renderer.CAMERA_ICON = getImageData(canvas!);
            loaded('CAMERA_ICON');
        }),
        svgToCanvas(objectIconRaw, DIM, canvas => {
            Core.Object_Instance.DEFAULT_INSTANCE_ICON = [getImageData(canvas!)];
            loaded(Core.Object_Instance.DEFAULT_INSTANCE_ICON_ID);
        }),
        svgToCanvas(exitIconRaw, DIM, canvas => {
            Core.Exit.EXIT_ICON = [getImageData(canvas!)];
            loaded(Core.Exit.EXIT_ICON_ID);
        }),
        svgToCanvas(endIconRaw, DIM, canvas => {
            Core.Exit.ENDING_ICON = [getImageData(canvas!)];
            loaded(Core.Exit.ENDING_ICON_ID);
        })
    ];
    const loadedIDs = new Array<string>();
    let toLoad = LOAD_ARRAY.length;

    function getImageData(canvas: HTMLCanvasElement): ImageData {
        return canvas.getContext('2d')!.getImageData(0, 0, DIM, DIM);
    }

    function loaded(id: string){
        toLoad--;
        loadedIDs.push(id);

        if (toLoad <= 0){
            iconsLoaded = true;
            document.dispatchEvent(new CustomEvent('icons-loaded', {detail: loadedIDs}));
        }
    }
})();