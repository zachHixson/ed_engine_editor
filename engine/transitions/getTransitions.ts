import Renderer from "@engine/Renderer";
import Transition_Base, { TRANSITION } from "./Transition_Base";
import Transition_None from './Transition_None';
import Transition_Fade from './Transition_Fade';

export default function getTransitions(gl: WebGL2RenderingContext, renderer: Renderer): Map<TRANSITION, Transition_Base> {
    const transitions = new Map<TRANSITION, Transition_Base>();

    transitions.set(TRANSITION.NONE, new Transition_None(gl, renderer));
    transitions.set(TRANSITION.FADE, new Transition_Fade(gl, renderer));

    return transitions;
}