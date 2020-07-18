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
}

export default Sprite;