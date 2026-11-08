import Renderer from "@engine/Renderer";
import { TRANSITION_TYPE } from "@engine/core/Enums";
import Transition_Base from "./Transition_Base";
import Transition_None from './Transition_None';
import Transition_Fade from './Transition_Fade';

export default function getTransitions(gl: WebGL2RenderingContext, renderer: Renderer): Map<TRANSITION_TYPE, Transition_Base> {
    const transitions = new Map<TRANSITION_TYPE, Transition_Base>();

    transitions.set(TRANSITION_TYPE.NONE, new Transition_None(gl, renderer));
    transitions.set(TRANSITION_TYPE.FADE, new Transition_Fade(gl, renderer));

    return transitions;
}
