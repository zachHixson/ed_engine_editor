import Renderer from "@engine/Renderer";
import { Event_Emitter } from "@engine/core/Event_Emitter";
import type { TRANSITION_TYPE } from "@engine/core/Enums";

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

    abstract get type(): TRANSITION_TYPE;
    get active(){return this._active}

    abstract start(roomId: number): void;
    abstract render(deltaTime: number): void;
}
