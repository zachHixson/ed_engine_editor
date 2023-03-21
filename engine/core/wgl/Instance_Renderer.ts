import { Instance_Base, WGL, Sprite } from "../core";
import { Mat3 } from "../Mat3";
import { Vector } from '../Vector';
import { Color } from "../Draw";

interface iInstanceData {
    instance: Instance_Base,
    frameNumber: number,
    pool: number,
    bufferLocation: number,
}

interface iAtlasData {
    atlas: Atlas,
    vao: WebGLVertexArrayObject,
    planeGeoBuffer: WGL.Attribute_Object,
    planeUVBuffer: WGL.Attribute_Object,
    positionBuffer: WGL.Attribute_Object,
    spriteOffsetBuffer: WGL.Attribute_Object,
    bufferLocations: Array<number>,
    renderLength: number,
}

export class Instance_Renderer {
    private static readonly DEFAULT_BUFFER_SIZE = 4096;
    private static readonly _planeGeo = WGL.createPlaneGeo().map(i => (i + 1) * 8);
    private static readonly _planeUVs = WGL.createPlaneGeo().map(i => (i + 1) * 0.5);
    private static readonly _vertexSource = `
        uniform mat3 u_viewMatrix;

        attribute vec2 a_planeVerts;
        attribute vec2 a_position;
        attribute vec2 a_spriteOffset;
        attribute vec2 a_uv;

        varying vec2 v_uv;
        varying vec2 v_spriteOffset;

        void main(){
            v_uv = a_uv;
            v_spriteOffset = a_spriteOffset;

            vec2 worldPos = (a_planeVerts + a_position);
            vec3 clipPos = vec3(worldPos, 1.0) * u_viewMatrix;
            gl_Position = vec4(clipPos, 1.0);
        }
    `;
    private static readonly _fragmentSource = `
        precision highp float;

        uniform int u_tileSize;
        uniform int u_atlasSize;
        uniform float u_instanceScale;
        uniform vec4 u_colorOverride;
        uniform sampler2D u_atlasTexture;

        varying vec2 v_uv;
        varying vec2 v_spriteOffset;

        void main(){
            float tileSize = float(u_tileSize);
            float atlasSize = float(u_atlasSize);
            float scaleFac = atlasSize / tileSize;
            float invInstanceScale = 1.0 / u_instanceScale;

            //main atlas mapping
            vec2 uv = vec2(v_uv.x, 1.0 - v_uv.y);
            uv = (uv - 0.5) * invInstanceScale + 0.5;
            uv += v_spriteOffset;
            uv /= scaleFac;

            //scale mask
            vec2 maskUv = abs(v_uv - 0.5) * 2.0;
            float mask = max(maskUv.x, maskUv.y);
            mask = 1.0 - step(u_instanceScale, mask);

            vec4 tex = texture2D(u_atlasTexture, uv);
            tex.a *= mask;

            //color override
            tex = mix(tex, vec4(u_colorOverride.rgb, 1.0), u_colorOverride.a * tex.a);

            gl_FragColor = tex;
        }
    `;

    //renderer properties
    private _tileSize: number;
    private _atlasSize: number;

    //webGL properties
    private _gl: WebGL2RenderingContext;
    private _program: WebGLProgram;
    private _generateMipmaps: boolean;
    private _viewMatrixUniform: WGL.Uniform_Object;
    private _tileSizeUniform: WGL.Uniform_Object;
    private _atlasSizeUniform: WGL.Uniform_Object;
    private _instanceScaleUniform: WGL.Uniform_Object;
    private _colorOverrideUniform: WGL.Uniform_Object;
    private _atlasTextureUniform: WGL.Texture_Object;
    private _outputTexture: WGL.Render_Texture;

    //instance properties
    private _instanceMap = new Map<number, iInstanceData>();
    private _atlasPool = new Array<iAtlasData>();

    constructor(gl: WebGL2RenderingContext, tileSize: number, atlasSize: number, generateMipmaps = false){
        this._tileSize = tileSize;
        this._atlasSize = atlasSize;

        //setup webGL context
        this._gl = gl;
        this._program = WGL.createProgram(
            this._gl,
            WGL.createShader(this._gl, this._gl.VERTEX_SHADER, Instance_Renderer._vertexSource)!,
            WGL.createShader(this._gl, this._gl.FRAGMENT_SHADER, Instance_Renderer._fragmentSource)!    
        )!;
        this._generateMipmaps = generateMipmaps;
        this._viewMatrixUniform = new WGL.Uniform_Object(this._gl, this._program, 'u_viewMatrix', WGL.Uniform_Types.MAT3);
        this._tileSizeUniform = new WGL.Uniform_Object(this._gl, this._program, 'u_tileSize', WGL.Uniform_Types.INT);
        this._atlasSizeUniform = new WGL.Uniform_Object(this._gl, this._program, 'u_atlasSize', WGL.Uniform_Types.INT);
        this._instanceScaleUniform = new WGL.Uniform_Object(this._gl, this._program, 'u_instanceScale', WGL.Uniform_Types.FLOAT);
        this._colorOverrideUniform = new WGL.Uniform_Object(this._gl, this._program, 'u_colorOverride', WGL.Uniform_Types.VEC4);
        this._atlasTextureUniform = new WGL.Texture_Object(this._gl, this._program, 'u_atlasTexture');
        this._outputTexture = new WGL.Render_Texture(this._gl, this._gl.canvas.width, this._gl.canvas.height);

        this._gl.useProgram(this._program);
        this._tileSizeUniform.set(this._tileSize);
        this._atlasSizeUniform.set(this._atlasSize);

        this._instanceScaleUniform.set(1);
    }

    get texture(){return this._outputTexture.texture}

    updateViewMatrix(viewMat: Mat3): void {
        this._gl.useProgram(this._program);
        this._viewMatrixUniform.set(false, viewMat.data);
    }

    resize(): void {
        this._outputTexture.resize(this._gl.canvas.width, this._gl.canvas.height);
    }

    private _createAtlasData(){
        const atlas = new Atlas(this._gl, this._tileSize, this._atlasSize, this._generateMipmaps);
        const bufferLocations = new Array(Instance_Renderer.DEFAULT_BUFFER_SIZE);
        const atlasData = {
            atlas,
            vao: this._gl.createVertexArray()!,
            planeGeoBuffer: new WGL.Attribute_Object(this._gl, this._program, 'a_planeVerts'),
            planeUVBuffer: new WGL.Attribute_Object(this._gl, this._program, 'a_uv'),
            positionBuffer: new WGL.Attribute_Object(this._gl, this._program, 'a_position'),
            spriteOffsetBuffer: new WGL.Attribute_Object(this._gl, this._program, 'a_spriteOffset'),
            bufferLocations,
            renderLength: 0,
        };

        this._gl.bindVertexArray(atlasData.vao);
        atlasData.planeGeoBuffer.set(new Float32Array(Instance_Renderer._planeGeo), 2, this._gl.FLOAT);
        atlasData.planeUVBuffer.set(new Float32Array(Instance_Renderer._planeUVs), 2, this._gl.FLOAT);
        atlasData.positionBuffer.set(new Float32Array(Instance_Renderer.DEFAULT_BUFFER_SIZE * 2), 2, this._gl.FLOAT);
        atlasData.spriteOffsetBuffer.set(new Uint8Array(Instance_Renderer.DEFAULT_BUFFER_SIZE * 2), 2, this._gl.UNSIGNED_BYTE);
        atlasData.positionBuffer.setDivisor(1);
        atlasData.spriteOffsetBuffer.setDivisor(1);

        this._atlasPool.push(atlasData);
    }

    private _setInstanceData(atlasData: iAtlasData, bufferLocation: number, instance: Instance_Base, imageFrame: number): void {
        const spriteoffset = atlasData.atlas.getImageOffset(instance.frameDataId, imageFrame).divideScalar(this._tileSize);
        this._gl.bindVertexArray(atlasData.vao);

        atlasData.positionBuffer.setSubData(new Float32Array([instance.pos.x, instance.pos.y]), bufferLocation * 4 * 2);
        atlasData.spriteOffsetBuffer.setSubData(new Int8Array([spriteoffset.x, spriteoffset.y]), bufferLocation * 2);
        atlasData.bufferLocations[bufferLocation] = instance.id;
    }

    setInstanceScale(scale: number): void {
        this._gl.useProgram(this._program);
        this._instanceScaleUniform.set(scale);
    }

    setColorOverride(color: Color): void {
        this._gl.useProgram(this._program);
        this._colorOverrideUniform.set(color.r, color.g, color.b, 1.0);
    }

    addInstance(instance: Instance_Base, startFrame = 0): void {
        const image = instance.frameData;
        let availableAtlas = 0;
        let atlasData: typeof this._atlasPool[number] | null = null;

        while (!atlasData){
            if (!this._atlasPool[availableAtlas]){
                this._createAtlasData();
            }

            if (this._atlasPool[availableAtlas].atlas.checkFree(image.length)){
                atlasData = this._atlasPool[availableAtlas];
            }
            else{
                availableAtlas++;
            }
        }

        //setup atlas
        atlasData = this._atlasPool[availableAtlas];

        if (atlasData.atlas.checkExists(instance.frameDataId)){
            atlasData.atlas.incrementUsage(instance.frameDataId);
        }
        else{
            atlasData.atlas.addImage(instance.frameDataId, image);
        }

        this._instanceMap.set(instance.id, {
            instance,
            frameNumber: startFrame,
            pool: availableAtlas,
            bufferLocation: atlasData.renderLength,
        });

        //setup webGL data
        this._setInstanceData(atlasData, atlasData.renderLength, instance, startFrame);
        atlasData.renderLength++;
    }

    removeInstance(instance: Instance_Base): void {
        const instanceData = this._instanceMap.get(instance.id);

        if (!instanceData) {
            console.warn(`Warning: Attempting to remove instance ID '${instance.id}' that does not exist in renderer`);
            return;
        }

        const atlasData = this._atlasPool[instanceData.pool];
        const instanceLocation = instanceData.bufferLocation;
        const lastInstanceId = atlasData.bufferLocations[atlasData.renderLength - 1];
        const lastInstance = this._instanceMap.get(lastInstanceId)!;

        this._setInstanceData(atlasData, instanceLocation, lastInstance.instance, lastInstance.frameNumber);
        atlasData.renderLength--;
    }

    clear(): void {
        this._instanceMap.clear();
        this._atlasPool = [];
    }

    updateSprite(id: number | string, sprite?: ImageData[]): void {
        const pool = this._atlasPool.find((atlasData) => atlasData.atlas.checkExists(id));
        
        if (!pool) return;
    }

    render(): void {
        this._gl.useProgram(this._program);
        this._outputTexture.setAsRenderTarget();
        this._gl.viewport(0, 0, this._gl.canvas.width, this._gl.canvas.height);
        this._gl.clearColor(0, 0, 0, 0);
        this._gl.clear(this._gl.COLOR_BUFFER_BIT);

        //render each atlas as a draw call
        for (let i = 0; i < this._atlasPool.length; i++){
            const atlasData = this._atlasPool[i];

            this._atlasTextureUniform.texture = atlasData.atlas.texture;
            this._atlasTextureUniform.activate();

            this._gl.bindVertexArray(atlasData.vao);

            atlasData.planeGeoBuffer.enable();
            atlasData.planeUVBuffer.enable();
            atlasData.positionBuffer.enable();
            atlasData.spriteOffsetBuffer.enable();

            this._gl.drawArraysInstanced(
                this._gl.TRIANGLES,
                0,
                6,
                atlasData.renderLength
            );

            atlasData.planeGeoBuffer.disable();
            atlasData.planeUVBuffer.disable();
            atlasData.positionBuffer.disable();
            atlasData.spriteOffsetBuffer.disable();

            this._atlasTextureUniform.deactivate();
        }

        this._outputTexture.unsetRenderTarget();
    }

    destroy(): void {
        this._outputTexture.destroy();
    }
}

class Atlas {
    private _gl: WebGL2RenderingContext;
    private _tileSize: number;
    private _atlasSize: number;
    private _tileCount: number;
    private _generateMipmaps: boolean;
    private _imageInfo = new Map<number | string, {
        location: number,
        length: number,
        uses: number
    }>();
    private _assignment: Array<number | string | null>;
    private _atlasTexture: WebGLTexture;
    private _lastFoundLength: number = 0;
    private _lastFoundIdx: number | null = null;

    constructor(gl: WebGL2RenderingContext, tileSize: number, atlasSize: number, generateMipmaps = false){
        const tileSizeRounded = Math.round(tileSize);
        const atlasSizeRounded = Math.round(atlasSize);
        this._tileCount = (atlasSizeRounded * atlasSizeRounded) / (tileSizeRounded * tileSizeRounded);
        this._generateMipmaps = generateMipmaps;

        if (this._tileCount % 1 != 0){
            console.error('Atlas size needs to be evenly divisible by tile size');
        }

        this._gl = gl;
        this._tileSize = tileSizeRounded;
        this._atlasSize = atlasSizeRounded;
        this._assignment = new Array(this._tileCount).fill(null);
        this._atlasTexture = this._gl.createTexture()!;

        this._gl.bindTexture(gl.TEXTURE_2D, this._atlasTexture);
        this._gl.texStorage2D(gl.TEXTURE_2D, 1, gl.RGBA8, atlasSizeRounded, atlasSizeRounded);

        if (!generateMipmaps){
            this._gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
            this._gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
        }
    }

    get tileCount(){return this._tileCount}
    get texture(){return this._atlasTexture}

    private _getFreeIdx(length: number): number | null {
        let searching = true;
        let freeIdx = null;
        let freeLength = 0;

        for (let i = 0; searching && i < this._assignment.length; i++){
            const curId = this._assignment[i];
            const occupied = curId != null;
            const infoGet = this._imageInfo.get(curId ?? -1);
            const inUse = infoGet ? infoGet.uses > 0 : false;

            if (occupied && inUse){
                freeIdx = null;
                freeLength = 0;
                continue;
            }

            if (freeIdx == null){
                freeIdx = i;
            }

            freeLength++;

            if (freeLength >= length){
                searching = false;

                if (occupied){
                    this._imageInfo.delete(curId);
                }
            }
        }

        this._lastFoundIdx = freeIdx;
        this._lastFoundLength = freeLength;

        return searching ? null : this._lastFoundIdx;
    }

    private _calculateOffsetPosition(offset: number): number[] {
        const idx = offset * this._tileSize;
        const x = idx % this._atlasSize;
        const y = Math.floor(idx / this._atlasSize) * this._tileSize;
        return [x, y];
    }

    checkExists(id: number | string): boolean {
        return !!this._imageInfo.get(id);
    }

    checkFree(length: number): boolean {
        return this._getFreeIdx(length) != null;
    }

    getImageOffset(id: number | string, frameOffset: number): Vector {
        const get = this._imageInfo.get(id);

        if (!get){
            console.warn('Warning: Could not find image id', id, 'in atlas, returning <0,0>');
            return new Vector(0, 0);
        }

        return Vector.fromArray(this._calculateOffsetPosition(get.location + frameOffset));
    }

    addImage(id: number | string, image: Array<ImageData>, incrementUsage = true): void {
        const freeIdx = this._lastFoundLength == image.length ? this._lastFoundIdx : this._getFreeIdx(image.length);

        if (freeIdx == null) {
            console.error('Error: Attempting to add image to full atlas. Make sure you\'re using "atlas.checkFree()" first');
            return;
        }

        if (this.checkExists(id)){
            console.warn('Warning: Adding image that already exists in atlas. Use "atlas.checkExits" first');
            return;
        }

        //reserve atlas space
        for (let i = freeIdx; i < freeIdx + image.length; i++){
            this._assignment[i] = id;
        }

        this._imageInfo.set(id, {
            location: freeIdx,
            length: image.length,
            uses: 0,
        });

        if (incrementUsage){
            this.incrementUsage(id);
        }

        this._lastFoundLength = 0;

        //insert image
        this._gl.bindTexture(this._gl.TEXTURE_2D, this._atlasTexture);

        for (let i = 0; i < image.length; i++){
            const frame = image[i];
            const [x, y] = this._calculateOffsetPosition(freeIdx + i);

            this._gl.texSubImage2D(
                this._gl.TEXTURE_2D,
                0,
                x,
                y,
                this._tileSize,
                this._tileSize,
                this._gl.RGBA,
                this._gl.UNSIGNED_BYTE,
                frame.data
            );
        }

        //generate mipmaps if enabled
        if (this._generateMipmaps){
            this._gl.generateMipmap(this._gl.TEXTURE_2D);
            this._gl.texParameteri(this._gl.TEXTURE_2D, this._gl.TEXTURE_MIN_FILTER, this._gl.LINEAR_MIPMAP_LINEAR);
            this._gl.texParameteri(this._gl.TEXTURE_2D, this._gl.TEXTURE_MAG_FILTER, this._gl.NEAREST);
        }
    }

    incrementUsage(id: number | string): void {
        const info = this._imageInfo.get(id);

        if (!info){
            console.warn('Non existant id on atlas', id);
            return;
        }

        info.uses++;
    }

    decrementUsage(id: number | string): void {
        const info = this._imageInfo.get(id);

        if (!info){
            console.warn('Non existant id on atlas', id);
            return;
        }

        info.uses = Math.max(info.uses - 1, 0);
    }
}