import { WGL } from "@engine/core/core";
import Renderer from "@engine/Renderer";

export enum TRANSITION {
    NONE = 'N',
    FADE = 'F',
};

export default abstract class Transition_Base {
    protected static readonly _planeGeo = WGL.createPlaneGeo();
    protected static readonly _planeUVs = WGL.createPlaneGeo().map(i => (i + 1) * 0.5);


    protected _gl: WebGL2RenderingContext;
    protected _renderer: Renderer;

    protected _active = false;

    abstract get type(): TRANSITION;
    get active(){return this._active}

    constructor(gl: WebGL2RenderingContext, renderer: Renderer){
        this._gl = gl;
        this._renderer = renderer;
    }

    abstract start(roomId: number, loadRoomCallback: (roomId: number)=>void, onFinishCallback: ()=>void): void;
    abstract render(deltaTime: number): void;
}