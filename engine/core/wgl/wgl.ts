export enum Uniform_Types {
    INT,
    FLOAT,
    VEC2,
    VEC3,
    MAT3,
}

export function getGLContext(canvas: HTMLCanvasElement): WebGL2RenderingContext | null {
    const ctx = canvas.getContext('webgl2') ?? getPolyfill(canvas);

    if (!ctx){
        console.error('Could not create webgl context');
        return null;
    }

    return ctx;
}

function getPolyfill(canvas: HTMLCanvasElement): WebGL2RenderingContext | null {
    const ctx = canvas.getContext('webgl') as any;
    const vboExt = ctx.getExtension('OES_vertex_array_object');
    const instanceExt = ctx.getExtension('ANGLE_instanced_arrays');

    if (!(vboExt && instanceExt)){
        console.error('Browser does not support required extensions, please update your browser');
        return null;
    }

    function makeCallable(ext: any, func: Function){
        return function(){
            return func.apply(ext, arguments);
        }
    }
    
    //bind VBO ext
    ctx.createVertexArray = makeCallable(vboExt, vboExt.createVertexArrayOES);
    ctx.bindVertexArray = makeCallable(vboExt, vboExt.bindVertexArrayOES);
    ctx.deleteVertexArray = makeCallable(vboExt, vboExt.deleteVertexArrayOES);

    //bind instancing ext
    ctx.drawArraysInstanced = makeCallable(instanceExt, instanceExt.drawArraysInstancedANGLE);
    ctx.drawElementsInstanced = makeCallable(instanceExt, instanceExt.drawArraysInstancedANGLE);
    ctx.vertexAttribDivisor = makeCallable(instanceExt, instanceExt.vertexAttribDivisorANGLE);

    console.warn('WARNING: WebGL -> WebGL2 polyfill is being used. Some functionality may be unavailable');

    return ctx;
}

export function createShader(gl: WebGL2RenderingContext, type: number, source: string): WebGLShader | null {
    const shader = gl.createShader(type);

    if (!shader){
        console.error('Error creating shader');
        return null;
    }

    gl.shaderSource(shader, source);
    gl.compileShader(shader);

    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)){
        console.error(gl.getShaderInfoLog(shader));
        gl.deleteShader(shader);
        return null;
    }

    return shader;
}

export function createProgram(gl: WebGL2RenderingContext, vertexShader: WebGLShader, fragmentShader: WebGLShader): WebGLProgram | null {
    const program = gl.createProgram();

    if (!program){
        console.error('Error creating program');
        return null;
    }

    gl.attachShader(program, vertexShader);
    gl.attachShader(program, fragmentShader);
    gl.linkProgram(program);

    if (!gl.getProgramParameter(program, gl.LINK_STATUS)){
        console.error(gl.getProgramInfoLog(program));
        gl.deleteProgram(program);
        return null;
    }

    return program;
}

export function createPlaneGeo(){
    return [
        -1, 1,
        1, 1,
        1, -1,
        1, -1,
        -1, -1,
        -1, 1
    ];
}

export class Uniform_Object {
    private _ctx: WebGL2RenderingContext;
    private _name: string;
    private _type: Uniform_Types;
    private _loc: WebGLUniformLocation;

    constructor(ctx: WebGL2RenderingContext, program: WebGLProgram, name: string, type: Uniform_Types){
        this._ctx = ctx;
        this._name = name;
        this._type = type;
        this._loc = this._ctx.getUniformLocation(program, this._name)!;
    }

    set(...args: any[]): void {
        switch(this._type){
            case Uniform_Types.INT:
                this._ctx.uniform1i(this._loc, args[0]);
                break;
            case Uniform_Types.FLOAT:
                this._ctx.uniform1f(this._loc, args[0]);
                break;
            case Uniform_Types.VEC2:
                this._ctx.uniform2f(this._loc, args[0], args[1]);
                break;
            case Uniform_Types.VEC3:
                this._ctx.uniform3f(this._loc, args[0], args[1], args[2]);
                break;
            case Uniform_Types.MAT3:
                this._ctx.uniformMatrix3fv(this._loc, args[0], args[1]);
                break;
        }
    }
}

export class Attribute_Object {
    private _gl: WebGL2RenderingContext;
    private _name: string;
    private _program: WebGLProgram;
    private _loc: number;
    private _buffer: WebGLBuffer;

    constructor(gl: WebGL2RenderingContext, program: WebGLProgram, name: string){
        this._gl = gl;
        this._name = name;
        this._program = program;
        this._loc = this._gl.getAttribLocation(this._program, this._name);
        this._buffer = this._gl.createBuffer()!;

        this._gl.useProgram(this._program);
        this._gl.bindBuffer(this._gl.ARRAY_BUFFER, this._buffer);
        //this._gl.enableVertexAttribArray(this._loc);
    }

    set(data: Float32Array, size = 1, type = this._gl.FLOAT, normalize = false, offset = 0, stride = 0, hint = this._gl.STATIC_DRAW): void {
        this._gl.useProgram(this._program);
        this._gl.bindBuffer(this._gl.ARRAY_BUFFER, this._buffer);
        this._gl.bufferData(this._gl.ARRAY_BUFFER, data, hint);
        //this._gl.enableVertexAttribArray(this._loc);
        this._gl.vertexAttribPointer(this._loc, size, type, normalize, offset, stride);
    }

    enable(): void {
        this._gl.useProgram(this._program);
        this._gl.enableVertexAttribArray(this._loc);
    }

    disable(): void {
        this._gl.useProgram(this._program);
        this._gl.disableVertexAttribArray(this._loc);
    }

    setDivisor(num: number): void {
        this._gl.vertexAttribDivisor(this._loc, num);
    }
}

export class Texture_Slots {
    private static _textureUnitMap: boolean[];

    static {
        const gl = getGLContext(document.createElement('canvas'))!;
        this._textureUnitMap = new Array(gl.getParameter(gl.MAX_COMBINED_TEXTURE_IMAGE_UNITS));
        this._textureUnitMap.fill(false);
    }

    static getSlot(): number {
        let thisSlot = null;

        //find first available slot
        for (let i = 0; thisSlot == null && i < this._textureUnitMap.length; i++){
            if (!this._textureUnitMap[i]){
                thisSlot = i;
                this._textureUnitMap[i] = true;
            }
        }

        if (thisSlot == null){
            console.error('ERROR: Out of texture slots');
            return -1;
        }

        return thisSlot;
    }

    static freeSlot(slot: number): void {
        this._textureUnitMap[slot] = false;
    }
}

export class Texture_Object {
    private _gl: WebGL2RenderingContext;
    private _name: string;
    private _loc: WebGLUniformLocation;
    private _texture: WebGLTexture;
    private _slot: number = -1;

    constructor(ctx: WebGL2RenderingContext, program: WebGLProgram, name: string, existingTexture?: WebGLTexture){
        this._gl = ctx;
        this._name = name;
        this._loc = this._gl.getUniformLocation(program, this._name)!;
        this._texture = existingTexture ?? this._gl.createTexture()!;
    }

    get texture(){return this._texture}

    private _defaultParameters = ()=>{
        this._gl.texParameteri(this._gl.TEXTURE_2D, this._gl.TEXTURE_MIN_FILTER, this._gl.NEAREST);
        this._gl.texParameteri(this._gl.TEXTURE_2D, this._gl.TEXTURE_MAG_FILTER, this._gl.NEAREST);
    }

    set(imgData: ImageData, textureParameterCallback = this._defaultParameters): void {
        this._gl.bindTexture(this._gl.TEXTURE_2D, this._texture);
        this._gl.texImage2D(
            this._gl.TEXTURE_2D,
            0,
            this._gl.RGBA,
            imgData.width,
            imgData.height,
            0,
            this._gl.RGBA,
            this._gl.UNSIGNED_BYTE,
            imgData.data
        );

        textureParameterCallback();
    }

    activate(): void {
        this._slot = this._slot < 0 ? Texture_Slots.getSlot() : this._slot;

        //activate
        this._gl.activeTexture(this._gl.TEXTURE0 + this._slot);
        this._gl.bindTexture(this._gl.TEXTURE_2D, this._texture);
        this._gl.uniform1i(this._loc, this._slot);
    }

    deactivate(): void {
        if (this._slot < 0) return;
        Texture_Slots.freeSlot(this._slot);
        this._slot = -1;
    }

    destroy(): void {
        this.deactivate();
        this._gl.deleteTexture(this._texture);
    }
}

export class Render_Texture {
    private _gl: WebGL2RenderingContext;
    private _texture: WebGLTexture;
    private _frameBuffer: WebGLFramebuffer;

    constructor(gl: WebGL2RenderingContext, width: number, height: number){
        this._gl = gl;
        this._texture = this._gl.createTexture()!;
        this._frameBuffer = this._gl.createFramebuffer()!;

        this._gl.bindTexture(this._gl.TEXTURE_2D, this._texture);
        this._gl.bindFramebuffer(this._gl.FRAMEBUFFER, this._frameBuffer);
        this._gl.framebufferTexture2D(this._gl.FRAMEBUFFER, this._gl.COLOR_ATTACHMENT0, this._gl.TEXTURE_2D, this._texture, 0);

        this.resize(width, height);
        this._gl.texParameteri(this._gl.TEXTURE_2D, this._gl.TEXTURE_MIN_FILTER, this._gl.LINEAR);
        this._gl.texParameteri(this._gl.TEXTURE_2D, this._gl.TEXTURE_WRAP_S, this._gl.CLAMP_TO_EDGE);
        this._gl.texParameteri(this._gl.TEXTURE_2D, this._gl.TEXTURE_WRAP_T, this._gl.CLAMP_TO_EDGE);

        this._gl.bindFramebuffer(this._gl.FRAMEBUFFER, null);
    }

    get texture(){return this._texture}

    resize(width: number, height: number): void {
        this._gl.bindTexture(this._gl.TEXTURE_2D, this._texture);
        this._gl.texImage2D(
            this._gl.TEXTURE_2D,
            0,
            this._gl.RGBA,
            width,
            height,
            0,
            this._gl.RGBA,
            this._gl.UNSIGNED_BYTE,
            null
        );
    }

    setAsRenderTarget(): void {
        this._gl.bindFramebuffer(this._gl.FRAMEBUFFER, this._frameBuffer);
    }

    unsetRenderTarget(): void {
        this._gl.bindFramebuffer(this._gl.FRAMEBUFFER, null);
    }

    destroy(): void {
        this._gl.deleteTexture(this._texture);
    }
}