import { Instance_Base, WGL } from "../core";
import { Mat3 } from "../Mat3";
import { Atlas } from './Atlas';
import { Color } from "../Draw";
import { easeOutBack } from "../Util";

interface iInstanceData {
    instance: Instance_Base,
    imageId: number | string,
    frameNumber: number,
    pool: number,
    bufferLocation: number,
}

interface iAtlasData {
    atlas: Atlas,
    vao: WebGLVertexArrayObject,
    planeGeoBuffer: WGL.Attribute,
    planeUVBuffer: WGL.Attribute,
    positionBuffer: WGL.Attribute,
    spriteOffsetBuffer: WGL.Attribute,
    orientationBuffer: WGL.Attribute,
    backAnimBuffer: WGL.Attribute,
    bufferLocations: Array<number>,
    renderLength: number,
}

enum ORIENTATION_BITS {
    hFlip = 0b0001,
    vFlip = 0b0010,
}

const DEPTH_OFFSET_INCREMENT = Math.pow(10, -7);

export class Instance_Renderer {
    private static readonly DEFAULT_BUFFER_SIZE = 64;
    private static readonly _planeGeo = WGL.createPlaneGeo().map(i => i * 8);
    private static readonly _planeUVs = WGL.createPlaneGeo().map(i => (i + 1) * 0.5);
    private static readonly _vertexSource = `
        precision highp float;
        
        uniform mat3 u_viewMatrix;
        uniform float u_instanceScale;

        attribute vec2 a_planeVerts;
        attribute vec3 a_position;
        attribute vec2 a_spriteOffset;
        attribute vec2 a_uv;
        attribute float a_orientation;
        attribute float a_backAnim;

        varying vec2 v_uv;
        varying vec2 v_spriteOffset;

        bool checkBit(float val, int bit){
            float fBit = pow(2.0, float(bit));
            return mod(floor(val / fBit), 2.0) == 1.0;
        }

        void main(){
            bool hFlip = checkBit(a_orientation, 0);
            bool vFlip = checkBit(a_orientation, 1);
            vec2 verts = a_planeVerts;

            if (hFlip) verts.x *= -1.0;
            if (vFlip) verts.y *= -1.0;

            verts.x += a_orientation;

            v_uv = a_uv;
            v_spriteOffset = a_spriteOffset;

            float backAnim = a_backAnim / 225.0;
            vec2 vert = (verts * backAnim * u_instanceScale) + 8.0;
            vec2 worldPos = vert + a_position.xy;
            vec3 clipPos = vec3(worldPos, 1.0) * u_viewMatrix;
            gl_Position = vec4(clipPos.xy, a_position.z, 1.0);
        }
    `;
    private static _getFragmentSource(repeatEdges: boolean, discardTransparent: boolean): string {return `
        precision highp float;

        uniform int u_tileSize;
        uniform int u_atlasSize;
        uniform vec4 u_colorOverride;
        uniform sampler2D u_atlasTexture;

        varying vec2 v_uv;
        varying vec2 v_spriteOffset;

        vec4 atlasMap(vec4 uv, float tileScaleFac, float scale){
            uv = (uv - 0.5) * scale + 0.5;
            uv += v_spriteOffset.xyxy;
            uv /= tileScaleFac;
            return uv;
        }

        void main(){
            float tileSize = float(u_tileSize);
            float atlasSize = float(u_atlasSize);
            float scaleFac = atlasSize / tileSize;

            //main atlas mapping
            vec2 uv = vec2(v_uv.x, 1.0 - v_uv.y);
            uv = atlasMap(vec4(uv, 0.0, 0.0), scaleFac, 1.0).xy;

            ${
                //eliminate pixel gap between atlased sprites
                repeatEdges ?
                `
                float clipScale = 1.0 - (1.0 / scaleFac / 2.0);
                vec4 bounds = vec4(1.0, 1.0, 0.0, 0.0);
                bounds = atlasMap(bounds, scaleFac, 0.98);
                uv = max(min(uv, bounds.xy), bounds.zw);
                `:``
            }

            vec4 tex = texture2D(u_atlasTexture, uv);

            //color override
            tex = mix(tex, vec4(u_colorOverride.rgb, 1.0), u_colorOverride.a * tex.a);

            ${
                discardTransparent ?
                `
                if (tex.a <= 0.0){
                    discard;
                }
                `:''
            }

            gl_FragColor = tex;
        }
    `}

    //renderer properties
    private _tileSize: number;
    private _atlasSize: number;
    private _depthOffsets = new Map<number, number>();

    //webGL properties
    private _gl: WebGL2RenderingContext;
    private _program: WebGLProgram;
    private _generateMipmaps: boolean;
    private _viewMatrixUniform: WGL.Uniform;
    private _tileSizeUniform: WGL.Uniform;
    private _atlasSizeUniform: WGL.Uniform;
    private _instanceScaleUniform: WGL.Uniform;
    private _colorOverrideUniform: WGL.Uniform;
    private _atlasTextureUniform: WGL.Texture_Uniform;

    //instance properties
    private _instanceMap = new Map<number, iInstanceData>();
    private _atlasPool = new Array<iAtlasData>();

    constructor(gl: WebGL2RenderingContext, tileSize: number, atlasSize: number, generateMipmaps = false, useDepth = false){
        this._tileSize = tileSize;
        this._atlasSize = atlasSize;

        //setup webGL context
        this._gl = gl;
        this._program = WGL.createProgram(
            this._gl,
            WGL.createShader(this._gl, this._gl.VERTEX_SHADER, Instance_Renderer._vertexSource)!,
            WGL.createShader(this._gl, this._gl.FRAGMENT_SHADER, Instance_Renderer._getFragmentSource(!generateMipmaps, useDepth))!    
        )!;
        this._generateMipmaps = generateMipmaps;
        this._viewMatrixUniform = new WGL.Uniform(this._gl, this._program, 'u_viewMatrix', WGL.Uniform_Types.MAT3);
        this._tileSizeUniform = new WGL.Uniform(this._gl, this._program, 'u_tileSize', WGL.Uniform_Types.INT);
        this._atlasSizeUniform = new WGL.Uniform(this._gl, this._program, 'u_atlasSize', WGL.Uniform_Types.INT);
        this._instanceScaleUniform = new WGL.Uniform(this._gl, this._program, 'u_instanceScale', WGL.Uniform_Types.FLOAT);
        this._colorOverrideUniform = new WGL.Uniform(this._gl, this._program, 'u_colorOverride', WGL.Uniform_Types.VEC4);
        this._atlasTextureUniform = new WGL.Texture_Uniform(this._gl, this._program, 'u_atlasTexture');

        this._gl.useProgram(this._program);
        this._tileSizeUniform.set(this._tileSize);
        this._atlasSizeUniform.set(this._atlasSize);

        this._instanceScaleUniform.set(1);
    }

    private _createAtlasData(bufferSize = Instance_Renderer.DEFAULT_BUFFER_SIZE){
        const buffersize = Math.round(bufferSize);
        const atlasData: iAtlasData = {
            atlas: new Atlas(this._gl, this._tileSize, this._atlasSize, this._generateMipmaps),
            vao: this._gl.createVertexArray()!,
            planeGeoBuffer: new WGL.Attribute(this._gl, this._program, 'a_planeVerts'),
            planeUVBuffer: new WGL.Attribute(this._gl, this._program, 'a_uv'),
            positionBuffer: new WGL.Attribute(this._gl, this._program, 'a_position'),
            spriteOffsetBuffer: new WGL.Attribute(this._gl, this._program, 'a_spriteOffset'),
            orientationBuffer: new WGL.Attribute(this._gl, this._program, 'a_orientation'),
            backAnimBuffer: new WGL.Attribute(this._gl, this._program, 'a_backAnim'),
            bufferLocations: new Array(buffersize),
            renderLength: 0,
        };

        this._gl.bindVertexArray(atlasData.vao);
        atlasData.planeGeoBuffer.set(new Float32Array(Instance_Renderer._planeGeo), 2, this._gl.FLOAT);
        atlasData.planeUVBuffer.set(new Float32Array(Instance_Renderer._planeUVs), 2, this._gl.FLOAT);
        atlasData.positionBuffer.set(new Float32Array(buffersize * 3), 3, this._gl.FLOAT);
        atlasData.spriteOffsetBuffer.set(new Uint8Array(buffersize * 2), 2, this._gl.UNSIGNED_BYTE);
        atlasData.orientationBuffer.set(new Uint8Array(buffersize), 1, this._gl.UNSIGNED_BYTE);
        atlasData.backAnimBuffer.set(new Uint8Array(buffersize), 1, this._gl.UNSIGNED_BYTE);
        atlasData.positionBuffer.setDivisor(1);
        atlasData.spriteOffsetBuffer.setDivisor(1);
        atlasData.orientationBuffer.setDivisor(1);
        atlasData.backAnimBuffer.setDivisor(1);

        this._atlasPool.push(atlasData);
    }

    private _setInstanceData(atlasData: iAtlasData, bufferLocation: number, instance: Instance_Base, imageFrame: number): void {
        const spriteoffset = atlasData.atlas.getImageOffset(instance.frameDataId, imageFrame).divideScalar(this._tileSize);
        const instancePos = instance.pos.clone().round();
        let orientationData = 0b000;

        //Pack orientation data
        orientationData = orientationData | (+instance.flipH * ORIENTATION_BITS.hFlip);
        orientationData = orientationData | (+instance.flipV * ORIENTATION_BITS.vFlip);

        this._gl.bindVertexArray(atlasData.vao);

        atlasData.positionBuffer.setSubData(new Float32Array([instancePos.x, instancePos.y, -instance.zDepth]), bufferLocation * 4 * 3);
        atlasData.spriteOffsetBuffer.setSubData(new Uint8Array([spriteoffset.x, spriteoffset.y]), bufferLocation * 2);
        atlasData.orientationBuffer.setSubData(new Uint8Array([orientationData]), bufferLocation);
        atlasData.backAnimBuffer.setSubData(new Uint8ClampedArray([easeOutBack(instance.backAnim) * 225]), bufferLocation);
        atlasData.bufferLocations[bufferLocation] = instance.id;
    }

    private _growBuffer(atlasData: iAtlasData): void {
        const instanceData = atlasData.bufferLocations.map(id => this._instanceMap.get(id));
        const newBufferSize = atlasData.bufferLocations.length + Instance_Renderer.DEFAULT_BUFFER_SIZE;

        //create new buffers
        this._gl.bindVertexArray(atlasData.vao);
        atlasData.positionBuffer.set(new Float32Array(newBufferSize * 3), 3, this._gl.FLOAT);
        atlasData.spriteOffsetBuffer.set(new Uint8Array(newBufferSize * 2), 2, this._gl.UNSIGNED_BYTE);
        atlasData.orientationBuffer.set(new Uint8Array(newBufferSize), 1, this._gl.UNSIGNED_BYTE);
        atlasData.backAnimBuffer.set(new Uint8Array(newBufferSize), 1, this._gl.UNSIGNED_BYTE);
        atlasData.positionBuffer.setDivisor(1);
        atlasData.spriteOffsetBuffer.setDivisor(1);
        atlasData.orientationBuffer.setDivisor(1);
        atlasData.backAnimBuffer.setDivisor(1);
        atlasData.bufferLocations = new Array(newBufferSize);

        //fill old data
        for (let i = 0; i < instanceData.length; i++){
            const instance = instanceData[i]!;
            this._setInstanceData(atlasData, i, instance.instance, instance.frameNumber);
        }
    }

    private _getNextDepthOffset(userDepth: number): number {
        const currentOffset = Math.min(this._depthOffsets.get(userDepth) ?? 0, 0.01);
        const nextOffset = currentOffset + DEPTH_OFFSET_INCREMENT;

        this._depthOffsets.set(userDepth, nextOffset);
        return nextOffset;
    }

    updateViewMatrix(viewMat: Mat3): void {
        this._gl.useProgram(this._program);
        this._viewMatrixUniform.set(false, viewMat.data);
    }

    resize(): void {
        this._gl.viewport(0, 0, this._gl.canvas.width, this._gl.canvas.height);
    }

    setInstanceScale(scale: number): void {
        this._gl.useProgram(this._program);
        this._instanceScaleUniform.set(scale);
    }

    setColorOverride(color: Color): void {
        this._gl.useProgram(this._program);
        this._colorOverrideUniform.set(color.r, color.g, color.b, 1.0);
    }

    hasInstance(instanceId: number): boolean {
        return !!this._instanceMap.get(instanceId);
    }

    addInstance(instance: Instance_Base, startFrame = 0): void {
        const image = instance.frameData;
        const depthOffset = instance.depthOffset == 0 ? this._getNextDepthOffset(instance.userDepth) : instance.depthOffset;
        let availableAtlas = 0;
        let atlasData: iAtlasData | null = null;

        while (!atlasData){
            if (!this._atlasPool[availableAtlas]){
                this._createAtlasData();
            }

            const curAtlasData = this._atlasPool[availableAtlas];

            if (curAtlasData.atlas.checkFree(image.length) || curAtlasData.atlas.checkExists(instance.frameDataId)){
                atlasData = curAtlasData;
            }
            else{
                availableAtlas++;
            }
        }

        if (atlasData.atlas.checkExists(instance.frameDataId)){
            atlasData.atlas.incrementUsage(instance.frameDataId);
        }
        else{
            atlasData.atlas.addImage(instance.frameDataId, image);
        }

        //setup instance data
        if (atlasData.renderLength + 1 > atlasData.bufferLocations.length){
            this._growBuffer(atlasData);
        }

        instance.depthOffset = depthOffset;

        this._instanceMap.set(instance.id, {
            instance,
            imageId: instance.frameDataId,
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
        const lastInstanceId = atlasData.bufferLocations[atlasData.renderLength - 1];
        const lastInstance = this._instanceMap.get(lastInstanceId)!;

        if (lastInstanceId != instance.id){
            this._setInstanceData(atlasData, instanceData.bufferLocation, lastInstance.instance, lastInstance.frameNumber);
            lastInstance.bufferLocation = instanceData.bufferLocation;
        }

        this._atlasPool[instanceData.pool].atlas.decrementUsage(instanceData.imageId);
        this._instanceMap.delete(instance.id);
        atlasData.renderLength--;
    }

    updateInstance(instance: Instance_Base, newFrame?: number): void {
        const instanceData = this._instanceMap.get(instance.id);

        if (!instanceData) {
            console.warn(`Warning: Attempting to update instance ID '${instance.id}' that does not exist in renderer`);
            return;
        }

        if (newFrame != undefined){
            instanceData.frameNumber = newFrame;
        }

        const sameImage = instanceData.imageId == instance.frameDataId;
        const atlasData = this._atlasPool[instanceData.pool];

        if (sameImage){
            this._setInstanceData(atlasData, instanceData.bufferLocation, instance, instanceData.frameNumber);
            return;
        }

        const sameAtlas = atlasData.atlas.checkExists(instance.frameDataId);

        if (sameAtlas){
            atlasData.atlas.decrementUsage(instanceData.imageId);
        }
        else{
            this.removeInstance(instance);
            instanceData.imageId = instance.frameDataId;
            this.addInstance(instance, instanceData.frameNumber);
        }
    }

    clear(): void {
        this._instanceMap.clear();
        this._atlasPool = [];
    }

    updateSprite(id: number | string, sprite: ImageData[]): void {
        const pool = this._atlasPool.find((atlasData) => atlasData.atlas.checkExists(id));
        
        if (!pool) return;

        pool.atlas.updateImage(id, sprite);
    }

    render(): void {
        this._gl.useProgram(this._program);
        
        this._gl.viewport(0, 0, this._gl.canvas.width, this._gl.canvas.height);
        
        this._gl.enable(this._gl.DEPTH_TEST);
        this._gl.depthMask(true);
        this._gl.depthFunc(this._gl.LEQUAL);

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
            atlasData.orientationBuffer.enable();
            atlasData.backAnimBuffer.enable();

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
            atlasData.orientationBuffer.disable();
            atlasData.backAnimBuffer.disable();

            this._atlasTextureUniform.deactivate();
        }

        this._gl.disable(this._gl.DEPTH_TEST);
        this._gl.depthMask(false);
    }
}