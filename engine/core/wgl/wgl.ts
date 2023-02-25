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