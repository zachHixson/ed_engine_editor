class ID_Generator_Class{
    constructor(){
        this.curStep = 0;
    }

    newID(){
        let id = this.curStep;
        this.curStep++;
        return id;
    }

    reset(){
        this.curStep = 0;
    }

    getCurrentID(){
        return this.curStep;
    }

    setID(id){
        this.curStep = id;
    }
}

let ID_Generator = new ID_Generator_Class();

export default ID_Generator;