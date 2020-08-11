class Sprite{
    constructor(dimensions = 16){
        this.id;
        this.dimensions = dimensions;
        this.frames = [];

        this.addFrame();
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