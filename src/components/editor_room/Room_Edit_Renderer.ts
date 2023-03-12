import Core from '@/core';
import svgToCanvas from '@/components/common/svgToCanvas';

import cameraLocIconRaw from '@/assets/camera_location.svg?raw';
import objectIconRaw from '@/assets/object_icon.svg?raw';
import exitIconRaw from '@/assets/exit.svg?raw';
import endIconRaw from '@/assets/end.svg?raw';

const { Vector, Mat3, Draw, WGL } = Core;

const NO_SPRITE_PADDING = 0.85;
let iconsLoaded = false;

export default class Room_Edit_Renderer {
    private _nextDrawCall: number | null = null;
    private _canvas: HTMLCanvasElement;
    private _navState: Core.NavState;
    private _gl: WebGL2RenderingContext;
    private _instanceRenderer: Core.Instance_Renderer;
    private _viewMatrix = new Mat3();
    private _viewMatrixNeedsUpdate = true;

    constructor(canvas: HTMLCanvasElement, navState: Core.NavState){
        this._canvas = canvas;
        this._navState = navState;
        this._gl = WGL.getGLContext(this._canvas)!;
        this._instanceRenderer = new Core.Instance_Renderer(this._gl);

        this._gl.clearColor(0, 0, 0, 1);
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
        //
    }

    resize(){
        this._gl.viewport(0, 0, this._gl.canvas.width, this._gl.canvas.height);
        this._instanceRenderer.resize();
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
        this._updateViewMatrix();
        this._gl.clear(this._gl.COLOR_BUFFER_BIT);
        this._instanceRenderer.render();
    }

    screenToWorldPos(pt: Core.Vector){
        //
    }

    worldToScreenPos(pt: Core.Vector){
        //
    }
}