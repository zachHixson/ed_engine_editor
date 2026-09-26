import { CATEGORY_ID } from '../Enums';
import { createCanvas } from '../Draw';
import { Asset_Base, AssetSave } from './Asset_Base';
import { NavState, tNavSaveData } from '../NavState';

/*
    Save Format Doc:
    - Frames are stored as a JSON list of base64 encoded byte arrays
    - Sprites are palettized, so each color is saved once to a palette list, and that color's index is used as single byte ID in the image data
        - Since there can only be 255 unique colors in a sprite which contains a transparent pixel, a palette ID of 255 is used to represent transparency
        - When decoding, any paletteId greater than the length of the palette is considered a transparent pixel
    - The list of paletteIds representing the image is then run length encoded

    - Byte array format:
        - First byte represents # of palette colors (Np)
            - In cases where a sprite reaches 256 unique colors, this value will overflow to 0
            - However if # of palette colors and # of RLE runs are 0 (meaning all pixels are unique colors) then we know the real value is 256
        - Second byte represents # of RLE runs (Nr)
        - Third byte represents # of palette indices left over after RLE, each index is 1 byte  (Nd)
            - In cases where there are no runs of pixels > 3, all 256 pixels will need a paletteId, and this value will overflow to 0
            - However, since we know it's impossible to have both 0 runs AND 0 stored palette indices, we know the real value is 256
        - The next [Np * 3] bytes represent a list of RGB palette colors, with each color being 3 bytes
        - The next [Nr * 3] bytes represent a list of RLE runs, with each run being 3 bytes [index, length, paletteId]
            - index: starting index of the ImageData buffer where the run begins
            - length: how many pixels to copy to the buffer
                - Since a run length of 0 would never exist, run lengths are stored [actualLength - 1] to fit in 8 bits
            - paletteId: index of color in palette list (actual byte index in flattened palette array can be calculated by [paletteId * 3])
        - The next [Nd] bytes represent the list of paletteIds
*/

type PaletteData = {
    palette: Uint8Array;
    data: Uint8Array;
};

type RLEData = {
    runs: Uint8Array;
    data: Uint8Array;
};

export type SpriteSave = [
    ...AssetSave,
    frameList: Array<string>,
    navData: tNavSaveData,
];

function palettizeImageData(frame: Readonly<ImageData>): PaletteData {
    const PIXEL_COUNT = 256;

    if (frame.data.length / 4 != PIXEL_COUNT) {
        throw new Error('Can only palettize 16x16 RGBA images');
    }

    type ColorHash = number;
    type PaletteIdx = number;

    const palette = new Uint8Array(256 * 3);
    const paletteMap = new Map<ColorHash, PaletteIdx>();
    const paletteIds = new Uint8Array(PIXEL_COUNT);
    let paletteLength = 0;

    for (let i = 0; i < PIXEL_COUNT; i++) {
        const pIdx = i * 4;
        const r = frame.data[pIdx + 0];
        const g = frame.data[pIdx + 1];
        const b = frame.data[pIdx + 2];
        const a = frame.data[pIdx + 3];
        const colorHash = (r << 16) | (g << 8) | b;

        /*
            Since it's impossible to have at least one xprnt pixel AND more than 255 palette colors,
            a palette ID of 255 represents xprnt pixels
        */
        if (a < 255) {
            paletteIds[i] = 255;
        }
        else {
            if (!paletteMap.has(colorHash)) {
                palette[paletteLength + 0] = r;
                palette[paletteLength + 1] = g;
                palette[paletteLength + 2] = b;
                paletteLength += 3;
                paletteMap.set(colorHash, (paletteLength / 3) - 1);
            }

            paletteIds[i] = paletteMap.get(colorHash)!;
        }
    }

    return {
        palette: palette.subarray(0, paletteLength),
        data: paletteIds,
    };
}

function rleEncode(data: Readonly<Uint8Array>): RLEData {
    const MAX_POSSIBLE_RUNS = 86;
    const MAX_POSSIBLE_DATA = 256;
    const runData = new Uint8Array(MAX_POSSIBLE_RUNS * 3);
    const outData = new Uint8Array(MAX_POSSIBLE_DATA);
    let runDataLength = 0;
    let outDataLength = 0;
    let i = 0;

    while (i < data.length) {
        const curIdx = i;
        const curByte = data[i];
        let runLength = 0;

        while (i < data.length && data[i] == curByte) {
            i++;
            runLength++;
        }

        if (runLength > 3) {
            runData[runDataLength + 0] = curIdx;
            runData[runDataLength + 1] = runLength - 1;
            runData[runDataLength + 2] = curByte;
            runDataLength += 3;
        }
        else {
            for (let i = 0; i < runLength; i++) {
                outData[outDataLength] = curByte;
                outDataLength++;
            }
        }
    }

    return {
        runs: runData.subarray(0, runDataLength),
        data: outData.subarray(0, outDataLength),
    };
}

function compressImageData(img: Readonly<ImageData>): Uint8Array {
    const paletteSprite = palettizeImageData(img);
    const rleSpriteData = rleEncode(paletteSprite.data);
    const u8Length =
        3 + //use first 3 bytes to store palette length, runs length, and data length for decoding
        paletteSprite.palette.length +
        rleSpriteData.runs.length +
        rleSpriteData.data.length;
    const u8Arr = new Uint8Array(u8Length);
    let i = 0;

    u8Arr[i++] = paletteSprite.palette.length / 3;
    u8Arr[i++] = rleSpriteData.runs.length / 3;
    u8Arr[i++] = rleSpriteData.data.length;

    u8Arr.set(paletteSprite.palette, i);
    i += paletteSprite.palette.length;
    u8Arr.set(rleSpriteData.runs, i);
    i += rleSpriteData.runs.length;
    u8Arr.set(rleSpriteData.data, i);

    return u8Arr;
}

function writeRunToBuffer(palette: Readonly<Uint8Array>, paletteId: number, runLength: number, pxlStartIdx: number, outBuffer: Uint8ClampedArray): void {
    const paletteCount = palette.length / 3;
    const paletteIdx = paletteId * 3;
    const isXprnt = paletteId >= paletteCount;
    const color = isXprnt ? [0, 0, 0, 0] : [
        palette[paletteIdx + 0],
        palette[paletteIdx + 1],
        palette[paletteIdx + 2],
        255
    ];

    for (let i = 0; i < runLength; i++) {
        const buffIdx = (pxlStartIdx + i) * 4;
        outBuffer.set(color, buffIdx);
    }
}

function decodeRunLengthPalette(palette: Readonly<Uint8Array>, runs: Readonly<Uint8Array>, data: Readonly<Uint8Array>): Uint8ClampedArray {
    const PIXEL_COUNT = 256;
    const outBuff = new Uint8ClampedArray(PIXEL_COUNT * 4);
    let pxlIdx = 0;
    let curRle = 0;
    let dataIdx = 0;

    while (pxlIdx < PIXEL_COUNT) {
        const curRunIdx = runs[curRle * 3];

        if (pxlIdx == curRunIdx) {
            //expand rle and palette
            const rleIdx = curRle * 3;
            const runLength = runs[rleIdx + 1] + 1;
            const paletteId = runs[rleIdx + 2];
            writeRunToBuffer(palette, paletteId, runLength, pxlIdx, outBuff);
            pxlIdx += runLength;
            curRle++;
        }
        else {
            const paletteId = data[dataIdx++];
            writeRunToBuffer(palette, paletteId, 1, pxlIdx, outBuff);
            pxlIdx++
        }
    }

    return outBuff;
}

function decompressImageData(data: Readonly<Uint8Array>): ImageData {
    let startIdx: number;
    let endIdx: number;

    const rawPaletteCount = data[0];
    const rawRunsCount = data[1];
    const rawSprDataLength = data[2];

    const paletteOverflow = rawRunsCount == 0 && rawPaletteCount == 0;
    const sprDataOverflow = rawRunsCount == 0;

    const paletteCount = paletteOverflow ? 256 : rawPaletteCount;
    const runsCount = rawRunsCount;

    const paletteLength = paletteCount * 3;
    const runsLength = runsCount * 3;
    const sprDataLength = sprDataOverflow ? 256 : rawSprDataLength;

    const paletteData = data.subarray(startIdx = 3, endIdx = startIdx + paletteLength);
    const runsData = data.subarray(startIdx = endIdx, endIdx = startIdx + runsLength);
    const sprData = data.subarray(startIdx = endIdx, endIdx = startIdx + sprDataLength);

    const imageData = decodeRunLengthPalette(paletteData, runsData, sprData);

    return new ImageData(imageData, 16, 16);
}

export class Sprite extends Asset_Base {
    static get DIMENSIONS(){return 16}

    frames: ImageData[] = [];
    navState: NavState = new NavState();

    _frameEmptyCache: Map<number, boolean> = new Map();

    constructor(){
        super();
        this.addFrame();
    }

    get category_ID(){return CATEGORY_ID.SPRITE}
    get thumbnail(): HTMLCanvasElement | null {
        return this.frameIsEmpty(0) ? null : this.drawToCanvas(0);
    }

    toSaveData(): SpriteSave {
        return [
            ...this.getBaseAssetData(),
            Sprite.compressFrames(this.frames),
            this.navState.toSaveData(),
        ];
    }

    static compressFrames(frames: Readonly<ImageData[]>): string[] {
        const stringFrames = new Array<string>(frames.length);

        for (let i = 0; i < stringFrames.length; i++) {
            const compressedData = compressImageData(frames[i]);
            const b64 = btoa(String.fromCharCode(...compressedData));
            stringFrames[i] = b64;
        }

        return stringFrames;
    }

    static decompressFrames(frames: string[]): ImageData[] {
        const imgDataFrames = new Array<ImageData>(frames.length);

        for (let i = 0; i < frames.length; i++) {
            const byteString = atob(frames[i]);
            const buffer = new Uint8Array(byteString.length);

            for (let j = 0; j < buffer.length; j++) {
                buffer[j] = byteString.charCodeAt(j);
            }

            const decompressedData = decompressImageData(buffer);

            imgDataFrames[i] = decompressedData;
        }

        return imgDataFrames;
    }

    static fromSaveData(data: SpriteSave): Sprite {
        return new Sprite()._loadSaveData(data);
    }

    private _loadSaveData(data: SpriteSave): Sprite {
        this.loadBaseAssetData(data);
        this.frames = Sprite.decompressFrames(data[3]);
        this.navState = NavState.fromSaveData(data[4]);
        return this;
    }

    updateFrame(idx: number): void {
        this._frameEmptyCache.delete(idx);
    }

    addFrame(): number {
        const imgData = new ImageData(Sprite.DIMENSIONS, Sprite.DIMENSIONS);

        this.frames.push(imgData);

        return this.frames.length - 1;
    }

    deleteFrame(idx: number): void {
        this.frames.splice(idx, 1);
    }

    copyFrame(idx: number): void {
        const frame = this.frames[idx];
        const dupedData = Uint8ClampedArray.from(frame.data);
        const dupedFrame = new ImageData(dupedData, frame.width, frame.height);
        this.frames.splice(idx, 0, dupedFrame);
    }

    moveFrame(idx: number, dir: number): void {
        //swap frames
        const frame = this.frames[idx];
        this.frames[idx] = this.frames[idx + dir];
        this.frames[idx + dir] = frame;
    }

    compareFrames(frame1: number[] | string[], frame2: number[] | string[]): boolean {
        for (let i = 0; i < frame1.length; i++){
            if (frame1[i] != frame2[i]){
                return false;
            }
        }

        return true;
    }

    getFramesCopy(): ImageData[] {
        const newFrames = new Array(this.frames.length);

        for (let i = 0; i < newFrames.length; i++){
            const dimensions = this.frames[i].width;
            const dataCopy = Uint8ClampedArray.from(this.frames[i].data);
            const imgData = new ImageData(dataCopy, dimensions, dimensions);
            newFrames[i] = imgData;
        }

        return newFrames;
    }

    setFramesFromArray(imgDataArray: ImageData[]): void {
        this.frames = new Array(imgDataArray.length);

        for (let i = 0; i < imgDataArray.length; i++){
            const {data, width, height} = imgDataArray[i];
            const dataCopy = Uint8ClampedArray.from(data);
            this.frames[i] = new ImageData(dataCopy, width, height);
        }
    }

    clear(): void {
        this.frames = [];
        this.addFrame();
    }

    frameIsEmpty(idx: number = 0): boolean {
        const cacheGet = this._frameEmptyCache.get(idx);

        if (cacheGet !== undefined) return cacheGet;

        let isEmpty = true;

        for (let i = 0; i < this.frames[idx].data.length; i++){
            if (this.frames[idx].data[i] != 0){
                isEmpty = false;
            }
        }

        this._frameEmptyCache.set(idx, isEmpty);
        return isEmpty;
    }

    static drawToCanvas(imgData: ImageData, canvas: HTMLCanvasElement): HTMLCanvasElement {
        const ctx = canvas.getContext('2d')!;
        ctx.putImageData(imgData, 0, 0);

        return canvas;
    }

    drawToCanvas(frameIdx: number = 0, canvas: HTMLCanvasElement = createCanvas(16, 16)): HTMLCanvasElement | null {
        const frame = this.frames[frameIdx];

        if (!frame){
            return null;
        }

        return Sprite.drawToCanvas(frame, canvas);
    }

    drawAllFrames(): HTMLCanvasElement[] {
        const frameArr = new Array(this.frames.length);

        for (let i = 0; i < frameArr.length; i++){
            frameArr[i] = this.drawToCanvas(i);
        }

        return frameArr;
    }
};
