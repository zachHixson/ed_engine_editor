import Renderer from "@engine/Renderer";
import { Event_Emitter } from "@engine/core/Event_Emitter";

export enum TRANSITION {
    NONE = 'N',
    FADE = 'F',
};

export default abstract class Transition_Base {
    protected _gl: WebGL2RenderingContext;
    protected _renderer: Renderer;

    protected _active = false;

    onRoomLoad = new Event_Emitter<(roomId: number)=>void>(this);
    onCompleted = new Event_Emitter<()=>void>(this);

    constructor(gl: WebGL2RenderingContext, renderer: Renderer){
        this._gl = gl;
        this._renderer = renderer;
    }

    abstract get type(): TRANSITION;
    get active(){return this._active}

    abstract start(roomId: number): void;
    abstract render(deltaTime: number): void;
}