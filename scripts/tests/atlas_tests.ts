//@ts-nocheck

function check(label: string, value: any, checkVal: any): void {
    console.log(value == checkVal ? '✅' : '❌', label);
}

function createSprite(length: number){
    const colors = [
        Math.floor(Math.random() * 256),
        Math.floor(Math.random() * 256),
        Math.floor(Math.random() * 256),
        255
    ];
    const sprite = new Array(length).fill(null).map(()=>{
        const image = new ImageData(16, 16);

        for (let i = 0; i < image.data.length; i += 4){
            const idx = i % colors.length;
            image.data[i + 0] = colors[idx + 0];
            image.data[i + 1] = colors[idx + 1];
            image.data[i + 2] = colors[idx + 2];
            image.data[i + 3] = colors[idx + 3];
        }

        return image;
    });
    
    return sprite;
}

let dbgEnabled = false;
function debug(...args: any[]){
    //@ts-ignore
    if (dbgEnabled){
        console.log(...arguments);
    }
}

//exists test
(()=>{
    const canvas = document.createElement('canvas');
    const gl = WGL.getGLContext(canvas)!;
    const atlas = new Atlas(gl, 16, 1024);
    const image = [new ImageData(16, 16)];

    check('does not exist', atlas.checkExists(42), false);
    atlas.addImage(42, image, true);
    check('exits after add', atlas.checkExists(42), true);
    check('wrong id does not exist after add', atlas.checkExists('hello'), false);
})();

//add test
(()=>{
    const canvas = document.createElement('canvas');
    const gl = WGL.getGLContext(canvas)!;
    const atlas = new Atlas(gl, 16, 1024);

    //add works
    let works = true;

    for (let i = 1; i <= 5; i++){
        const image = createSprite(i);
        atlas.addImage(i, image, true);
    }

    for (let i = 1; i <= 5; i++){
        //calc fact
        let fact = 0;
        for (let j = 0; j < i; j++){
            fact += j;
        }
        
        //measure
        for (let j = fact; j < fact + i; j++){
            //@ts-ignore
            works &&= atlas._assignment[j] == i;
        }
    }

    check('IDs match after adding', works, true);
})();

//free test
(()=>{
    const canvas = document.createElement('canvas');
    const gl = WGL.getGLContext(canvas)!;
    const atlas = new Atlas(gl, 16, 1024);
    let fill = 0;

    check('free index when empty', atlas.checkFree(2), true);
    check('free index after cache', atlas.checkFree(2), true);
    
    //after a few images
    for (let i = 0; i < 24; i++){
        const image = createSprite(3);
        atlas.addImage(fill, image);
        fill += image.length;
    }
    check('free index after adding multiple images', atlas.checkFree(2), true);

    //fill to near full
    let toFill = 4096 - fill - 6;
    for (let i = 0; i < toFill; i++){
        const image = createSprite(1);
        atlas.addImage(fill, image);
        fill += image.length;
    }
    check('fill with 6 remaining, and check if 6 are empty', atlas.checkFree(6), true);
    check('check more than remaining', atlas.checkFree(12), false);

    //fill remaining
    const lastImage = createSprite(4096 - fill);
    atlas.addImage('last', lastImage);
    check('reports full when full (request 12)', atlas.checkFree(12), false);
    check('reports full when full (request 1)', atlas.checkFree(1), false);
    check('reports full when full (request 0)', atlas.checkFree(0), false);

    //check gaps
    let nogaps = true;

    //@ts-ignore
    for (let i = 0; i < atlas._assignment.length; i++){
        //@ts-ignore
        nogaps &&= atlas._assignment[i] != null;
    }
    check('no gaps', nogaps, true);
})();

//uses and overwriting
(()=>{
    const canvas = document.createElement('canvas');
    const gl = WGL.getGLContext(canvas)!;
    const atlas = new Atlas(gl, 16, 1024);

    //add 3 different sprites
    const sprite1 = createSprite(4);
    const sprite2 = createSprite(1);
    const sprite3 = createSprite(3);
    atlas.addImage(1, sprite1);
    atlas.addImage(2, sprite2);
    atlas.addImage(3, sprite3);

    atlas.decrementUsage(1);
    atlas.decrementUsage(3);

    check('exists after uses reach 0', atlas.checkExists(3), true);

    //add 2 more small sprites
    const sprite4 = createSprite(3);
    const sprite5 = createSprite(2);
    atlas.addImage(4, sprite4);
    atlas.addImage(5, sprite5);

    check('does not show as existing after overwrite', atlas.checkExists(3), false);

    //check correct order
    const order = [4, 4, 4, 1, 2, 5, 5, 3];
    let inOrder = true;
    
    for (let i = 0; i < order.length; i++){
        //@ts-ignore
        inOrder &&= atlas._assignment[i] == order[i];
    }
    
    check('is the order correct after overwriting data', inOrder, true);
})();

//check screen drawing
(()=>{
    const canvas = document.createElement('canvas');
    const gl = WGL.getGLContext(canvas)!;
    const atlas = new Atlas(gl, 16, 1024);
    const vs = `
        attribute vec2 a_position;

        varying vec2 v_uv;

        void main(){
            v_uv = (a_position + 1.0) * 0.5;
            gl_Position = vec4(a_position, 0.0, 1.0);
        }
    `;
    const fs = `
        precision highp float;

        uniform sampler2D u_texture;

        varying vec2 v_uv;

        void main(){
            vec4 tex = texture2D(u_texture, v_uv);
            gl_FragColor = tex;
        }
    `;

    //add canvas to screen
    canvas.width = 1024;
    canvas.height = 1024;
    canvas.style.position = 'absolute';
    canvas.style.left = '0';
    canvas.style.top = '0';
    canvas.style.border = '1px solid black';
    canvas.style.zIndex = '1000';
    canvas.style.width = 'auto';
    canvas.style.height = '100%';
    document.body.append(canvas);

    dbgEnabled = true;
    //fill
    for (let i = 0; i < 4096; i++){
        const remaining = 4096 - i;
        const length = Math.min(Math.ceil(Math.random() * 7), remaining);
        const sprite = createSprite(length);
        atlas.addImage(i, sprite);
        i += length - 1;
    }

    //setup webGL props
    const program = WGL.createProgram(
        gl,
        WGL.createShader(gl, gl.VERTEX_SHADER, vs)!,
        WGL.createShader(gl, gl.FRAGMENT_SHADER, fs)!
    )!;
    const textureUniform = new WGL.Texture_Object(gl, program, 'u_texture', atlas.texture);
    const positionAttribute = new WGL.Attribute_Object(gl, program, 'a_position');
    const vao = gl.createVertexArray();

    gl.bindVertexArray(vao);

    positionAttribute.set(new Float32Array([
        -1, -1,
        -1, 1,
        1, -1,
        1, -1,
        1, 1,
        -1, 1
    ]), 2);
    positionAttribute.enable();

    gl.clearColor(0, 0, 0, 1);
    gl.useProgram(program);
    gl.viewport(0, 0, canvas.width, canvas.height);

    textureUniform.activate();

    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.bindVertexArray(vao);
    gl.drawArrays(gl.TRIANGLES, 0, 6);
})();