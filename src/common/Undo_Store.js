import Linked_List from '@/common/Linked_List';

class Undo_Store{
    constructor(stepLimit = 1, returnPrevStep = true){
        this.stepLimit = stepLimit;
        this.undoStore = new Linked_List();
        this.redoStore = new Linked_List();
        this.initialState = null;
        this.returnPrevStep = returnPrevStep;
        this.cache = new Map();
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

    squashCommits(num){
        let squashList = new Array(num);

        for (let i = num - 1; i >= 0; i--){
            squashList[i] = this.undoStore.pop();
        }

        this.undoStore.push({squashList});
    }

    peekLastUndo(){
        return this.undoStore.getLast();
    }

    stepBack(){
        let redoStep = this.undoStore.pop();

        if (redoStep){
            if (redoStep.squashList){
                redoStep.squashList.reverse();
            }

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
            if (undoStep.squashList){
                undoStep.squashList.reverse();
            }
            
            this.undoStore.push(undoStep);
        }

        return undoStep;
    }

    clear(){
        this.undoStore.clear();
        this.redoStore.clear();
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
        if (step.squashList){
            for (let i = 0; i < step.squashList.length; i++){
                this.applyChronoStep(step.squashList[i], map);
            }
        }
        else{
            let action = map.get(step.action);
            
            action(step.data, false);
        }
    },
    squashActions(){
        this.undoStore.squashCommits(this.squashCounter);
        this.squashCounter = 0;
    }
}

export default Undo_Store;
export {UndoHelpers};