export const ID_Generator = {
    curStep: 0,

    newID(){
        let id = this.curStep;
        this.curStep++;
        return id;
    },

    reset(){
        this.curStep = 0;
    },

    getCurrentID(){
        return this.curStep;
    },

    setID(id){
        this.curStep = id;
    }
};