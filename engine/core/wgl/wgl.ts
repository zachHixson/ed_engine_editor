export enum Uniform_Types {
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
    ctx.delecteVertexArray = makeCallable(vboExt, vboExt.deleteVertexArrayOES);

    //bind instancing ext
    ctx.drawArraysInstanced = makeCallable(instanceExt, instanceExt.drawArraysInstancedANGLE);
    ctx.drawElementsInstanced = makeCallable(instanceExt, instanceExt.drawArraysInstancedANGLE);

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
    private _ctx: WebGL2RenderingContext;
    private _name: string;
    private _loc: number;
    private _buffer: WebGLBuffer;

    constructor(ctx: WebGL2RenderingContext, program: WebGLProgram, name: string){
        this._ctx = ctx;
        this._name = name;
        this._loc = this._ctx.getAttribLocation(program, this._name);
        this._buffer = this._ctx.createBuffer()!;

        this._ctx.bindBuffer(this._ctx.ARRAY_BUFFER, this._buffer);
        this._ctx.enableVertexAttribArray(this._loc);
    }

    set(data: Float32Array, size = 1, type = this._ctx.FLOAT, normalize = false, offset = 0, stride = 0, hint = this._ctx.STATIC_DRAW): void {
        this._ctx.bindBuffer(this._ctx.ARRAY_BUFFER, this._buffer);
        this._ctx.bufferData(this._ctx.ARRAY_BUFFER, data, hint);
        this._ctx.enableVertexAttribArray(this._loc);
        this._ctx.vertexAttribPointer(this._loc, size, type, normalize, offset, stride);
    }
}

export class Texture_Object {
    private static _textureUnitMap: boolean[];

    private _ctx: WebGL2RenderingContext;
    private _name: string;
    private _loc: WebGLUniformLocation;
    private _texture: WebGLTexture;
    private _slot: number = -1;

    constructor(ctx: WebGL2RenderingContext, program: WebGLProgram, name: string){
        this._ctx = ctx;
        this._name = name;
        this._loc = this._ctx.getUniformLocation(program, this._name)!;
        this._texture = this._ctx.createTexture()!;

        if (!Texture_Object._textureUnitMap){
            Texture_Object._textureUnitMap = new Array(this._ctx.getParameter(this._ctx.MAX_COMBINED_TEXTURE_IMAGE_UNITS));
            Texture_Object._textureUnitMap.fill(false);
        }
    }

    set(imgData: ImageData, generateMipmap = false): void {
        this._ctx.bindTexture(this._ctx.TEXTURE_2D, this._texture);
        this._ctx.texImage2D(
            this._ctx.TEXTURE_2D,
            0,
            this._ctx.RGBA,
            imgData.width,
            imgData.height,
            0,
            this._ctx.RGBA,
            this._ctx.UNSIGNED_BYTE,
            imgData.data
        );

        if (generateMipmap){
            this._ctx.generateMipmap(this._ctx.TEXTURE_2D);
        }
        else{
            this._ctx.texParameteri(this._ctx.TEXTURE_2D, this._ctx.TEXTURE_MIN_FILTER, this._ctx.NEAREST);
            this._ctx.texParameteri(this._ctx.TEXTURE_2D, this._ctx.TEXTURE_MAG_FILTER, this._ctx.NEAREST);
        }
    }

    private _getTextureSlot(): number {
        let thisSlot = this._slot;

        //find first available slot
        for (let i = 0; thisSlot < 0 && i < Texture_Object._textureUnitMap.length; i++){
            if (!Texture_Object._textureUnitMap[i]){
                thisSlot = i;
                Texture_Object._textureUnitMap[i] = true;
            }
        }

        if (thisSlot < 0){
            console.error('ERROR: Out of texture slots');
            return -1;
        }

        return thisSlot;
    }

    activate(): void {
        this._slot = this._slot < 0 ? this._getTextureSlot() : this._slot;

        //activate
        this._ctx.activeTexture(this._ctx.TEXTURE0 + this._slot);
        this._ctx.bindTexture(this._ctx.TEXTURE_2D, this._texture);
        this._ctx.uniform1i(this._loc, this._slot);
    }

    deactivate(): void {
        Texture_Object._textureUnitMap[this._slot] = false;
        this._slot = -1;
    }

    destroy(): void {
        Texture_Object._textureUnitMap[this._slot] = false;
        this._slot = -1;
        this._ctx.deleteTexture(this._texture);
    }
}