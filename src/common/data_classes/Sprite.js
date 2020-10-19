import Asset from './Asset';
import {CATEGORY_ID, CATEGORY_TYPE} from '../Enums';

class Sprite extends Asset{
    constructor(dimensions = 16){
        super();
        this.dimensions = dimensions;
        this.frames = [];
        this.frameIDs = [];

        this.addFrame();
        this.hashAllFrames();
    }

    get type(){return CATEGORY_TYPE.SPRITE}
    get category_ID(){return CATEGORY_ID.SPRITE}
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
        this.compressFrames(stripped.frames);
        delete stripped.frameIDs;

        return stripped;
    }

    fromSaveData(data){
        Object.assign(this, data);
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
        //strip '#' from frames
        for (let f = 0; f < frames.length; f++){
            for (let p = 0; p < frames[f].length; p++){
                let curFrame = frames[f][p];

                if (curFrame.length > 0){
                    curFrame = curFrame.substring(1, curFrame.length);
                }

                frames[f][p] = curFrame;
            }
        }
    }

    decompressFrames(frames){
        //Add '#' back to frames
        for (let f = 0; f < frames.length; f++){
            for (let p = 0; p < frames[f].length; p++){
                let curFrame = frames[f][p];

                if (curFrame.length == 6){
                    curFrame = '#' + curFrame;
                }

                frames[f][p] = curFrame;
            }
        }
    }
}

export default Sprite;