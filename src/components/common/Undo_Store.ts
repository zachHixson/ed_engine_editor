class Undo_Store{
    stepLimit: number;
    undoStore = new Shared.Linked_List();
    redoStore = new Shared.Linked_List();
    initialState = null;
    returnPrevStep: boolean;
    cache = new Map<any, any | object>();

    constructor(stepLimit = 1, returnPrevStep = true){
        this.stepLimit = stepLimit;
        this.returnPrevStep = returnPrevStep;
    }

    get undoLength(){return this.undoStore.length}
    get redoLength(){return this.redoStore.length}

    setInitialState(data){
        this.initialState = data;
    }

    commit(data){
        this.undoStore.push(data);
        this.redoStore.clear();

        if (this.undoLength > this.stepLimit){
            this.initialState = this.undoStore.popFirst();
        }
    }

    peekLastUndo(){
        return this.undoStore.getLast();
    }

    stepBack(){
        let redoStep = this.undoStore.pop();

        if (redoStep){
            this.redoStore.push(redoStep);
        }

        if (this.returnPrevStep){
            return this.undoStore.getLast();
        }
        else{
            return redoStep;
        }
    }

    stepForward(){
        let undoStep = this.redoStore.pop();

        if (undoStep){
            this.undoStore.push(undoStep);
        }

        return undoStep;
    }

    clear(){
        this.undoStore.clear();
        this.redoStore.clear();
    }

    popLast(){
        return this.undoStore.pop();
    }
}

const UndoHelpers = {
    stepBackward(){
        if (this.undoStore.undoLength > 0){
            this.applyChronoStep(this.undoStore.stepBack(), this.revertMap);
        }
    },
    stepForward(){
        if (this.undoStore.redoLength > 0){
            this.applyChronoStep(this.undoStore.stepForward(), this.actionMap);
        }
    },
    applyChronoStep(step, map){
        let action = map.get(step.action);
        
        action(step.data, false);
    },
}

export default Undo_Store;
export {UndoHelpers};