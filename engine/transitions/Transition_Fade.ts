import Renderer from "@engine/Renderer";
import { WGL } from "@engine/core/core";
import Transition_Base, {TRANSITION} from "./Transition_Base";

const DURATION = 1;

export default class Transition_Fade extends Transition_Base {
    private static readonly _vertexSource = `
        attribute vec2 a_pos;

        void main(){
            gl_Position = vec4(a_pos, 0.0, 1.0);
        }
    `;
    private static readonly _fragmentSource = `
        precision lowp float;

        uniform float u_opacity;

        void main(){
            gl_FragColor = vec4(vec3(0.0), u_opacity);
        }
    `;
    get type(){return TRANSITION.FADE};

    private _roomId: number = -1;
    private _progress: number = 0;
    private _transitioned = false;
    private _loadRoom: ((roomId: number)=>void) | null = null;
    private _onFinish: (()=>void) | null = null;

    private _program: WebGLProgram;
    private _geoAttrib: WGL.Attribute_Object;
    private _opacityUniform: WGL.Uniform_Object;
    private _vao: WebGLVertexArrayObject;

    constructor(gl: WebGL2RenderingContext, renderer: Renderer){
        super(gl, renderer);

        this._program = WGL.createProgram(
            this._gl,
            WGL.createShader(this._gl, this._gl.VERTEX_SHADER, Transition_Fade._vertexSource)!,
            WGL.createShader(this._gl, this._gl.FRAGMENT_SHADER, Transition_Fade._fragmentSource)!
        )!;
        this._geoAttrib = new WGL.Attribute_Object(this._gl, this._program, 'a_pos');
        this._opacityUniform = new WGL.Uniform_Object(this._gl, this._program, 'u_opacity', WGL.Uniform_Types.FLOAT);
        this._vao = this._gl.createVertexArray()!;

        this._gl.useProgram(this._program);
        this._gl.bindVertexArray(this._vao);

        this._geoAttrib.set(new Float32Array(Transition_Fade._planeGeo), 2, this._gl.FLOAT);
    }

    start(roomId: number, loadRoomCallback: (roomId: number)=>void, onFinishCallback: ()=>void): void {
        this._active = true;
        this._roomId = roomId;
        this._loadRoom = loadRoomCallback;
        this._onFinish = onFinishCallback;
        this._progress = 0;
        this._transitioned = false;
    }

    render(deltaTime: number): void {
        if (!this.active) return;

        const opacity = (-Math.cos(this._progress * 2 * Math.PI) + 1) / 2

        this._gl.bindVertexArray(this._vao);
        this._gl.useProgram(this._program);

        this._opacityUniform.set(opacity);

        this._geoAttrib.enable();

        this._gl.enable(this._gl.BLEND);
        this._gl.blendFunc(this._gl.SRC_ALPHA, this._gl.ONE_MINUS_SRC_ALPHA);
        this._gl.drawArrays(this._gl.TRIANGLES, 0, 6);
        this._gl.disable(this._gl.BLEND);

        this._geoAttrib.disable();

        this._progress += deltaTime;

        if (this._progress > (DURATION / 2) && !this._transitioned){
            this._loadRoom && this._loadRoom(this._roomId);
            this._transitioned = true;
        }

        if (this._progress > DURATION){
            this._active = false;
            this._opacityUniform.set(0);
            this._onFinish && this._onFinish();
        }
    }
}