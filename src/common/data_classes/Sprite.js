import Asset from './Asset';
import {CATEGORY_ID, CATEGORY_TYPE} from '../Enums';

class Sprite extends Asset{
    constructor(dimensions = 16){
        super();
        this.dimensions = dimensions;
        this.frames = [];

        this.addFrame();
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

    addFrame(){
        let pixNum = Math.pow(this.dimensions, 2);
        let newFrame = [];

        for (let i = 0; i < pixNum; i++){
            newFrame.push('');
        }

        this.frames.push(newFrame);
        return this.frames.length - 1;
    }

    deleteFrame(idx){
        this.frames.splice(idx, 1);
    }

    copyFrame(idx){
        this.frames.splice(idx, 0, [...this.frames[idx]]);
    }

    moveFrame(idx, dir){
        let frame = [...this.frames[idx]];
        this.frames[idx] = [...this.frames[idx + dir]];
        this.frames[idx + dir] = [...frame];
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
    }

    clear(){
        this.frames = [];
    }
}

export default Sprite;