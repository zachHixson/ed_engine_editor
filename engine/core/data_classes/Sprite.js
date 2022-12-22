import {Asset} from './Asset';
import {CATEGORY_ID} from '../Enums';
import {createCanvas, hexToRGBA, RGBAToHex} from '../Draw_2D';

export class Sprite extends Asset{
    static get DIMENSIONS(){return 16}

    constructor(){
        super();
        this.frames = [];
        this.frameIDs = [];

        this.addFrame();
        this.hashAllFrames();
    }

    get category_ID(){return CATEGORY_ID.SPRITE}
    get thumbnail(){
        return this.frameIsEmpty(0) ? null : this.drawToCanvas(0);
    }
    
    toSaveData(){
        let stripped = Object.assign({}, this);
        stripped.frames = this.getFramesCopy();
        stripped.frames = this.compressFrames(stripped.frames);
        delete stripped.frameIDs;

        return stripped;
    }

    fromSaveData(data){
        let imgDataFrames;
        let hexFrames;

        Object.assign(this, data);
        this.navState = this.parseNavData(data.navState);
        hexFrames = this.decompressFrames(this.frames);
        this.hashAllFrames();

        imgDataFrames = new Array(hexFrames.length);

        for (let i = 0; i < this.frames.length; i++){
            imgDataFrames[i] = this._hexToImageData(this.frames[i]);
        }

        this.frames = imgDataFrames;

        return this;
    }

    updateFrame(idx){
        this.frameIDs[idx] = this.hashFrame(idx);
    }

    addFrame(){
        const imgData = new ImageData(Sprite.DIMENSIONS, Sprite.DIMENSIONS);

        this.frames.push(imgData);
        this.frameIDs.push(this.hashFrame(this.frames.length - 1));

        return this.frames.length - 1;
    }

    deleteFrame(idx){
        this.frames.splice(idx, 1);
        this.frameIDs.splice(idx, 1);
    }

    copyFrame(idx){
        const frame = this.frames[idx];
        const dupedData = Uint8ClampedArray.from(frame.data);
        const dupedFrame = new ImageData(dupedData, frame.width, frame.height);
        this.frames.splice(idx, 0, dupedFrame);
        this.frameIDs.splice(idx, 0, this.hashFrame(idx + 1));
    }

    moveFrame(idx, dir){
        //swap frames
        const frame = this.frames[idx];
        this.frames[idx] = this.frames[idx + dir];
        this.frames[idx + dir] = frame;

        //swap frame IDs
        const id = this.frameIDs[idx];
        this.frameIDs[idx] = this.frameIDs[idx + dir];
        this.frameIDs[idx + dir] = id;
    }

    compareFrames(frame1, frame2){
        for (let i = 0; i < frame1.length; i++){
            if (frame1[i] != frame2[i]){
                return false;
            }
        }

        return true;
    }

    getFramesCopy(){
        const newFrames = new Array(this.frames.length);
        
        for (let i = 0; i < newFrames.length; i++){
            const dimensions = this.frames[i].width;
            const dataCopy = Uint8ClampedArray.from(this.frames[i].data);
            const imgData = new ImageData(dataCopy, dimensions, dimensions);
            newFrames[i] = imgData;
        }

        return newFrames;
    }

    setFramesFromArray(imgDataArray){
        this.frames = new Array(imgDataArray.length);

        for (let i = 0; i < imgDataArray.length; i++){
            const {data, width, height} = imgDataArray[i];
            const dataCopy = Uint8ClampedArray.from(data);
            this.frames[i] = new ImageData(dataCopy, width, height);
        }

        this.hashAllFrames();
    }

    clear(){
        this.frames = [];
        this.frameIDs = [];
        this.addFrame();
    }

    frameIsEmpty(idx = 0){
        for (let i = 0; i < this.frames[idx].data.length; i++){
            if (this.frames[idx].data[i] != 0){
                return false;
            }
        }

        return true;
    }

    hashAllFrames(){
        this.frameIDs = new Array(this.frames.length);

        for (let f = 0; f < this.frameIDs.length; f++){
            this.frameIDs[f] = this.hashFrame();
        }
    }

    hashFrame(){
        const LENGTH = 10;
        let hash = '';

        for (let i = 0; i < LENGTH; i++){
            hash += Math.floor(Math.random() * 16).toString(16);
        }

        return hash;
    }

    static drawToCanvas(imgData, canvas){
        const ctx = canvas.getContext('2d');
        ctx.putImageData(imgData, 0, 0);

        return canvas;
    }

    drawToCanvas(frameIdx = 0, canvas = createCanvas(16, 16)){
        let frame = this.frames[frameIdx];

        if (!frame){
            return;
        }

        return Sprite.drawToCanvas(frame, canvas);
    }

    drawAllFrames(){
        const frameArr = new Array(this.frames.length);

        for (let i = 0; i < frameArr.length; i++){
            frameArr[i] = this.drawToCanvas(i);
        }

        return frameArr;
    }

    compressFrames(frames){
        const hexFrames = frames.map(frame => this._imgDataToHex(frame));
        const tempCompressed = this._compTemporal(hexFrames);
        const frameCompressed = this._compFrame(tempCompressed);
        return frameCompressed;
    }

    _compTemporal(frameList){
        for (let i = 0; i < frameList.length; i++){
            let curRange = 0;
            let isSame = true;

            //look ahead and find a range of identical frames
            for (let checkFrame = i + 1; checkFrame < frameList.length && isSame; checkFrame++){
                if (this.compareFrames(frameList[i], frameList[checkFrame])){
                    curRange++;
                }
                else{
                    isSame = false;
                }

                checkFrame++;
            }

            //Replace range of identical frames with marker to indicate how many frames to be duplicated
            if (curRange > 0){
                frameList.splice(i + 1, curRange, [curRange.toString()]);
                i += 1;
            }
        }

        return frameList;
    }

    _compFrame(frameList){
        for (let i = 0; i < frameList.length; i++){
            //Find full frame
            if (frameList[i].length > 1){
                //Find ranges within that frame that can be compressed
                for (let p = 0; p < frameList[i].length; p++){
                    let curRange = 0;
                    let isSame = true;
                    
                    //Check current pixel against nex pixels until a different one is found
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

    decompressFrames(frames){
        const tempDecom = this._decompTemporal(frames);
        window.counter += 1;
        return this._decompFrame(frames);
    }

    _decompTemporal(frameList){
        const decomped = [...frameList];

        for (let i = 0; i < decomped.length; i++){
            //Find marker
            if (decomped[i].length == 1){
                let range = parseInt(decomped[i]);
                
                //Insert range of duplicates in place of the marker
                if (range > 0){
                    let dupedFrames = new Array(range).fill([...decomped[i - 1]]);
                    decomped.splice(i, 1, ...dupedFrames);
                }
            }
        }

        return decomped;
    }

    _decompFrame(frameList){
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

    _hexToImageData(hexFrame){
        const imgData = new ImageData(Sprite.DIMENSIONS, Sprite.DIMENSIONS);

        for (let i = 0; i < hexFrame.length; i++){
            const imgDataIdx = i * 4;
            const hexPixel = hexFrame[i];
            const filled = hexPixel.length > 0;
            const rgba = filled ? hexToRGBA(hexFrame[i]) : {r: 0, g: 0, b: 0, a: 0};
            
            imgData.data[imgDataIdx + 0] = rgba.r;
            imgData.data[imgDataIdx + 1] = rgba.g;
            imgData.data[imgDataIdx + 2] = rgba.b;
            imgData.data[imgDataIdx + 3] = !!filled * 255;
        }

        return imgData;
    }

    _imgDataToHex(imgData){
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