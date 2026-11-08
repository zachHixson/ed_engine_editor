import Renderer from "@engine/Renderer";
import { TRANSITION_TYPE } from "@engine/core/Enums";
import Transition_Base from "./Transition_Base";

export default class Transition_Fade extends Transition_Base {
    get type(){return TRANSITION_TYPE.NONE};

    constructor(gl: WebGL2RenderingContext, renderer: Renderer){
        super(gl, renderer);
    }

    start(roomId: number): void {
        this.onRoomLoad.emit(roomId);
        this.onCompleted.emit();
    }

    render(): void {}
}
