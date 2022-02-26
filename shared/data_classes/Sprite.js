waitForSharedDependencies(['Asset'], ()=>{

Shared.Sprite = class extends Shared.Asset{
    constructor(dimensions = 16){
        super();
        this.dimensions = dimensions;
        this.frames = [];
        this.frameIDs = [];

        this.addFrame();
        this.hashAllFrames();
    }

    get category_ID(){return Shared.CATEGORY_ID.SPRITE}
    get thumbnailData(){
        for (let i = 0; i < this.frames[0].length; i++){
            if (this.frames[0][i] != ''){
                return this.frames[0];
            }
        }

        return null;
    }
    
    toSaveData(){
        let stripped = Object.assign({}, this);
        stripped.frames = this.getFramesCopy();
        stripped.frames = this.compressFrames(stripped.frames);
        delete stripped.frameIDs;

        return stripped;
    }

    fromSaveData(data){
        Object.assign(this, data);
        this.navState = this.parseNavData(data.navState);
        this.decompressFrames(this.frames);
        this.hashAllFrames();

        return this;
    }

    updateFrame(idx){
        this.frameIDs[idx] = this.hashFrame(idx);
    }

    addFrame(){
        let pixNum = Math.pow(this.dimensions, 2);
        let newFrame = [];

        for (let i = 0; i < pixNum; i++){
            newFrame.push('');
        }

        this.frames.push(newFrame);
        this.frameIDs.push(this.hashFrame(this.frames.length - 1));

        return this.frames.length - 1;
    }

    deleteFrame(idx){
        this.frames.splice(idx, 1);
        this.frameIDs.splice(idx, 1);
    }

    copyFrame(idx){
        this.frames.splice(idx, 0, [...this.frames[idx]]);
        this.frameIDs.splice(idx, 0, this.hashFrame(idx + 1));
    }

    moveFrame(idx, dir){
        //swap frames
        let frame = [...this.frames[idx]];
        this.frames[idx] = [...this.frames[idx + dir]];
        this.frames[idx + dir] = [...frame];

        //swap frame IDs
        let id = this.frameIDs[idx];
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
        let copy = [];

        for (let i = 0; i < this.frames.length; i++){
            copy.push([...this.frames[i]]);
        }

        return copy;
    }

    setFramesFromArray(arr){
        this.frames = [];

        for (let i = 0; i < arr.length; i++){
            this.frames.push([...arr[i]]);
        }

        this.hashAllFrames();
    }

    clear(){
        this.frames = [];
        this.frameIDs = [];
        this.addFrame();
    }

    hashAllFrames(){
        this.frameIDs = new Array(this.frames.length);

        for (let f = 0; f < this.frameIDs.length; f++){
            this.frameIDs[f] = this.hashFrame(f);
        }
    }

    hashFrame(idx){
        let frameHash = 0;
        let frame = this.frames[idx];

        for (let p = 0; p < frame.length; p++){
            let curPixel = frame[p];

            for (let c = 0; c < curPixel.length; c++){
                frameHash = curPixel.charCodeAt(c) + (frameHash << 6) + (frameHash << 16) - frameHash;
            }

            frameHash = idx + (frameHash << 6) + (frameHash << 16) - frameHash;
        }

        return frameHash;
    }

    compressFrames(frames){
        let compressed = this._compTemporal(frames);
        compressed = this._compFrame(compressed);
        return compressed;
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
        this._decompTemporal(frames);
        this._decompFrame(frames);
    }

    _decompTemporal(frameList){
        for (let i = 0; i < frameList.length; i++){
            //Find marker
            if (frameList[i].length == 1){
                let range = parseInt(frameList[i]);
                
                //Insert range of duplicates in place of the marker
                if (range > 0){
                    let dupedFrames = new Array(range).fill([...frameList[i - 1]]);
                    frameList.splice(i, 1, ...dupedFrames);
                }
            }
        }
    }

    _decompFrame(frameList){
        for (let i = 0; i < frameList.length; i++){
            for (let p = 1; p < frameList[i].length; p++){
                //If the pixel is parsable as an int, then it's a marker
                let range = parseInt(frameList[i][p]);

                //Splice in new array of duplicated pixels
                if (range){
                    let dupedPixels = new Array(range).fill(frameList[i][p - 1]);
                    frameList[i].splice(p, 1, ...dupedPixels);
                    p += range;
                }
            }
        }
    }
};

});