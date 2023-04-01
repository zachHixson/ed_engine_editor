import { WGL, EventListenerMixin } from "@engine/core/core";
import Renderer from "@engine/Renderer";

export enum TRANSITION {
    NONE = 'N',
    FADE = 'F',
};

export default abstract class Transition_Base extends EventListenerMixin(class{}) {
    protected static readonly _planeGeo = WGL.createPlaneGeo();
    protected static readonly _planeUVs = WGL.createPlaneGeo().map(i => (i + 1) * 0.5);

    protected _gl: WebGL2RenderingContext;
    protected _renderer: Renderer;

    protected _active = false;

    abstract get type(): TRANSITION;
    get active(){return this._active}

    constructor(gl: WebGL2RenderingContext, renderer: Renderer){
        super();
        this._gl = gl;
        this._renderer = renderer;
    }

    abstract start(roomId: number): void;
    abstract render(deltaTime: number): void;
}