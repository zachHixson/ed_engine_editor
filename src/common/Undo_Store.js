import Linked_List from '@/common/Linked_List';

class Undo_Store{
    constructor(stepLimit = 0){
        this.stepLimit = stepLimit;
        this.undoStore = new Linked_List();
        this.redoStore = new Linked_List();
        this.initialState = null;
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

        return this.undoStore.getLast();
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
}

export default Undo_Store;