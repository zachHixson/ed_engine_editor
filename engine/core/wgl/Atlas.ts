import { Vector } from '../Vector';

export class Atlas {
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
        this._gl.texImage2D(
            this._gl.TEXTURE_2D,
            0,
            this._gl.RGBA,
            this._atlasSize,
            this._atlasSize,
            0,
            this._gl.RGBA,
            this._gl.UNSIGNED_BYTE,
            new Uint8ClampedArray(this._atlasSize * this._atlasSize * 4)
        );

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
            }
        }

        if (searching){
            return null;
        }

        for (let i = freeIdx!; i < freeIdx! + length - 1; i++){
            const id = this._assignment[i];
            const imageInfo = this._imageInfo.get(id!);

            if (id != null && imageInfo){
                this._imageInfo.delete(id);
                i += imageInfo.length - 1;
            }
        }

        this._lastFoundIdx = freeIdx;
        this._lastFoundLength = freeLength;

        return this._lastFoundIdx;
    }

    private _calculateOffsetPosition(offset: number): [number, number] {
        const idx = offset * this._tileSize;
        const x = idx % this._atlasSize;
        const y = Math.floor(idx / this._atlasSize) * this._tileSize;
        return [x, y];
    }

    private _writeImage(location: number, image: ImageData[]): void {
        this._gl.bindTexture(this._gl.TEXTURE_2D, this._atlasTexture);

        for (let i = 0; i < image.length; i++){
            const frame = image[i];
            const [x, y] = this._calculateOffsetPosition(location + i);

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
        if (this.checkExists(id)){
            console.warn('Warning: Adding image that already exists in atlas. Use "atlas.checkExists" first');
            return;
        }
        
        const freeIdx = this._lastFoundLength == image.length ? this._lastFoundIdx : this._getFreeIdx(image.length);

        if (freeIdx == null) {
            console.error('Error: Attempting to add image to full atlas. Make sure you\'re using "atlas.checkFree()" first');
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

        this._writeImage(freeIdx, image);

        //generate mipmaps if enabled
        if (this._generateMipmaps){
            this._gl.generateMipmap(this._gl.TEXTURE_2D);
            this._gl.texParameteri(this._gl.TEXTURE_2D, this._gl.TEXTURE_MIN_FILTER, this._gl.LINEAR_MIPMAP_LINEAR);
            this._gl.texParameteri(this._gl.TEXTURE_2D, this._gl.TEXTURE_MAG_FILTER, this._gl.NEAREST);
        }

        this._gl.texParameteri(this._gl.TEXTURE_2D, this._gl.TEXTURE_WRAP_S, this._gl.CLAMP_TO_EDGE);
        this._gl.texParameteri(this._gl.TEXTURE_2D, this._gl.TEXTURE_WRAP_T, this._gl.CLAMP_TO_EDGE);
    }

    updateImage(id: number | string, image: ImageData[]): void {
        const imageInfo = this._imageInfo.get(id);

        if (!imageInfo){
            console.warn('Warning: Could not find image with id ', id, 'in atlas');
            return;
        }

        this._writeImage(imageInfo.location, image);
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