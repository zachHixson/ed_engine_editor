import Core from '@/core';

export interface iActionStore {
    action: number;
    data: Core.iAnyObj;
}

class Undo_Store<T>{
    stepLimit: number;
    undoStore = new Core.Linked_List<T>();
    redoStore = new Core.Linked_List<T>();
    initialState: T | null = null;
    returnPrevStep: boolean;
    cache = new Map<any, any | object>();

    constructor(stepLimit = 1, returnPrevStep = true){
        this.stepLimit = stepLimit;
        this.returnPrevStep = returnPrevStep;
    }

    get undoLength(){return this.undoStore.length}
    get redoLength(){return this.redoStore.length}

    setInitialState(data: T): void {
        this.initialState = data;
    }

    commit(data: T): void {
        this.undoStore.push(data);
        this.redoStore.clear();

        if (this.undoLength > this.stepLimit){
            this.initialState = this.undoStore.popFirst();
        }
    }

    peekLastUndo(): T | null {
        return this.undoStore.getLast();
    }

    stepBack(): T | null {
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

    stepForward(): T | null {
        let undoStep = this.redoStore.pop();

        if (undoStep){
            this.undoStore.push(undoStep);
        }

        return undoStep;
    }

    clear(): void {
        this.undoStore.clear();
        this.redoStore.clear();
    }

    popLast(): T | null {
        return this.undoStore.pop();
    }
}

interface iComponent {
    undoStore: Undo_Store<iActionStore>;
    applyChronoStep: typeof UndoHelpers["applyChronoStep"];
    actionMap: Map<number, (data: Core.iAnyObj, commit: boolean)=>void>;
    revertMap: Map<number, (data: Core.iAnyObj, commit: boolean)=>void>;
}

const UndoHelpers = {
    stepBackward(this: iComponent){
        if (this.undoStore.undoLength > 0){
            this.applyChronoStep(this.undoStore.stepBack()!, this.revertMap);
        }
    },
    stepForward(this: iComponent){
        if (this.undoStore.redoLength > 0){
            this.applyChronoStep(this.undoStore.stepForward()!, this.actionMap);
        }
    },
    applyChronoStep(step: iActionStore, map: Map<number, (data: Core.iAnyObj, commit: boolean)=>void>){
        let action = map.get(step.action)!;
        
        action(step.data, false);
    },
}

export default Undo_Store;
export {UndoHelpers};