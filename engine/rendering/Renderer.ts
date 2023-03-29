import { Room, Instance_Renderer, WGL, Instance_Base, Mat3 } from "@engine/core/core";
import Transition from "./Transition";

export default class Renderer{
    static get SCREEN_RES(){return 240}

    private _gl: WebGL2RenderingContext;
    private _instanceRenderer: Instance_Renderer;
    private _canvas: HTMLCanvasElement;
    private _room: Room | null = null;
    private _transition: Transition;
    private _viewMatrix = new Mat3();
    private _viewMatrixNeedsUpdate = true;

    constructor(canvas: HTMLCanvasElement){
        this._canvas = canvas;
        this._transition = new Transition(this._canvas);

        //setup webgl
        this._gl = WGL.getGLContext(this._canvas)!;
        this._instanceRenderer = new Instance_Renderer(this._gl, 16, 1024, false, true);
    }

    get isTransitioning(){return this._transition.active}

    setRoom = (room: Room): void => {
        this._room = room;
        this._gl.clearColor(this._room.bgColor.r / 255, this._room.bgColor.g / 255, this._room.bgColor.b / 255, 1);
        this._instanceRenderer.clear();
    }

    private _updateViewMatrix = (): void => {
        if (!this._viewMatrixNeedsUpdate) return;
        const camera = this._room!.camera;
        const zoom = 1 / (8 * camera.size);
        const {x, y} = camera.pos;
        const zoomMat = new Mat3([zoom, 0, 0, 0, zoom, 0, 0, 0, 1]);
        const tranMat = new Mat3([1, 0, -x, 0, 1, -y, 0, 0, 1]);

        this._viewMatrix.copy(zoomMat.multiply(tranMat));
        this._instanceRenderer.updateViewMatrix(this._viewMatrix);
        this._viewMatrixNeedsUpdate = false;
    }

    addInstance = (instance: Instance_Base): void => {
        this._instanceRenderer.addInstance(instance, instance.animFrame);
    }

    removeInstance = (instance: Instance_Base): void => {
        this._instanceRenderer.removeInstance(instance);
    }

    updateInstance = (instance: Instance_Base, newFrame?: number): void => {
        this._instanceRenderer.updateInstance(instance, newFrame);
    }

    startTransition = (type: any, duration: number, switchCallback: ()=>void, completeCallback?: ()=>void): void => {
        this._transition.start(type, duration, switchCallback, completeCallback ?? (()=>{}));
    }

    render = (): void => {
        if (!this._room){
            console.error('Cannot render scene without room being set');
            return;
        }

        this._updateViewMatrix();

        this._gl.depthMask(true);
        this._gl.clear(this._gl.COLOR_BUFFER_BIT | this._gl.DEPTH_BUFFER_BIT);
        this._gl.depthMask(false);
        this._instanceRenderer.render();
    }
}