import {CATEGORY_ID} from '../Enums';
import {createCanvas, hexToRGBA, RGBAToHex} from '../Draw';
import { Asset_Base } from './Asset_Base';
import { NavState } from '../NavState';
import { SpriteSave, SpriteSaveId } from '@compiled/SaveTypes';

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
            this.compressFrames(this.getFramesCopy()).map(f => f.join(',')),
            this.navState.toSaveData(),
         ];
    }

    static fromSaveData(data: SpriteSave): Sprite {
        return new Sprite()._loadSaveData(data);
    }

    private _loadSaveData(data: SpriteSave): Sprite {
        const splitFrames = data[SpriteSaveId.frameList].map(f => f.split(','));
        const hexFrames = this.decompressFrames(splitFrames);
        const imgDataFrames = new Array(hexFrames.length);

        this.loadBaseAssetData(data);
        this.navState = NavState.fromSaveData(data[SpriteSaveId.navSaveData]);

        for (let i = 0; i < hexFrames.length; i++){
            imgDataFrames[i] = this._hexToImageData(splitFrames[i]);
        }

        this.frames = imgDataFrames;

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
        let frame = this.frames[frameIdx];

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

    compressFrames(frames: ImageData[]): string[][] {
        const hexFrames = frames.map(frame => this._imgDataToHex(frame));
        return this._compFrameData(hexFrames);
    }

    private _compFrameData(frameList: string[][]): string[][] {
        for (let i = 0; i < frameList.length; i++){
            //Find full frame
            if (frameList[i].length > 1){
                //Find ranges within that frame that can be compressed
                for (let p = 0; p < frameList[i].length; p++){
                    let curRange = 0;
                    let isSame = true;
                    
                    //Check current pixel against next pixels until a different one is found
                    for (let check = p + 1; check < frameList[i].length && isSame; check++){
                        if (frameList[i][p] == frameList[i][check]){
                            curRange++;
                        }
                        else{
                            isSame = false;
                        }
                    }

                    //Replace range of identical pixels with a marker indicating how many pixels to duplicate
                    if (curRange > 0){
                        frameList[i].splice(p + 1, curRange, curRange.toString());
                        p += 1;
                    }
                }
            }
        }

        return frameList;
    }

    decompressFrames(frames: string[][]): string[][] {
        return this._decompFrameData(frames);
    }

    private _decompFrameData(frameList: string[][]): string[][] {
        const decomped = [...frameList];

        for (let i = 0; i < decomped.length; i++){
            for (let p = 1; p < decomped[i].length; p++){
                //If the pixel is parsable as an int, then it's a marker
                let rawVal = decomped[i][p];
                let range = parseInt(rawVal);

                //Splice in new array of duplicated pixels
                if (range && rawVal.length < 6){
                    let dupedPixels = new Array(range).fill(decomped[i][p - 1]);
                    decomped[i].splice(p, 1, ...dupedPixels);
                    p += range;
                }
            }
        }

        return decomped;
    }

    private _hexToImageData(hexFrame: string[]): ImageData {
        const imgData = new ImageData(Sprite.DIMENSIONS, Sprite.DIMENSIONS);

        for (let i = 0; i < hexFrame.length; i++){
            const imgDataIdx = i * 4;
            const hexPixel = hexFrame[i];
            const filled = hexPixel.length > 0;
            const rgba = filled ? hexToRGBA(hexFrame[i]) : {r: 0, g: 0, b: 0, a: 0};
            
            imgData.data[imgDataIdx + 0] = rgba.r;
            imgData.data[imgDataIdx + 1] = rgba.g;
            imgData.data[imgDataIdx + 2] = rgba.b;
            imgData.data[imgDataIdx + 3] = filled ? 255 : 0;
        }

        return imgData;
    }

    private _imgDataToHex(imgData: ImageData): string[] {
        const data = imgData.data;
        const hexFrame = new Array(Math.floor(data.length / 4));

        for (let i = 0; i < hexFrame.length; i++){
            const dataIdx = i * 4;
            const filled = data[dataIdx + 3];

            if (filled){
                const hex = RGBAToHex(
                    data[dataIdx + 0],
                    data[dataIdx + 1],
                    data[dataIdx + 2],
                    data[dataIdx + 3],
                );
                hexFrame[i] = hex.substring(1, hex.length - 2);
            }
            else{
                hexFrame[i] = '';
            }
        }

        return hexFrame;
    }
};