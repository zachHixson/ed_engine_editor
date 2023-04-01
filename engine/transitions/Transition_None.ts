import Renderer from "@engine/Renderer";
import Transition_Base, {TRANSITION} from "./Transition_Base";

export default class Transition_Fade extends Transition_Base {
    get type(){return TRANSITION.NONE};

    constructor(gl: WebGL2RenderingContext, renderer: Renderer){
        super(gl, renderer);
    }

    start(roomId: number): void {
        this.emit('load-room', roomId);
        this.emit('complete');
    }

    render(): void {}
}