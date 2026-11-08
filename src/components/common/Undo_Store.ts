import Core from '@/core';

type MultiAction<T> = {
    isMultiAction: true;
    actions: T[];
}

function isMultiAction<T>(a: T | MultiAction<T>): a is MultiAction<T> {
    return !!(a as MultiAction<T>).isMultiAction;
}

export default class Undo_Store<T>{
    private readonly undoStore = new Core.Linked_List<T | MultiAction<T>>();
    private readonly redoStore = new Core.Linked_List<T | MultiAction<T>>();
    private _isRecording = false;
    private _commitBuffer: T[] = [];
    private _commitMade: boolean = false;

    stepLimit: number;
    initialState: T | MultiAction<T> | null = null;
    returnPrevStep: boolean;
    cache = new Map<unknown, unknown>();

    constructor(stepLimit = 1, returnPrevStep = true){
        this.stepLimit = stepLimit;
        this.returnPrevStep = returnPrevStep;
    }

    get undoLength(){return this.undoStore.length}
    get redoLength(){return this.redoStore.length}
    get isRecording(){return this._isRecording}

    private _commit(data: T | MultiAction<T>): void {
        this.undoStore.push(data);
        this.redoStore.clear();

        if (this.undoLength > this.stepLimit){
            this.initialState = this.undoStore.popFirst();
        }
    }

    destroy(): void {
        this.undoStore.clear();
        this.redoStore.clear();
        this.initialState = null;
        this.cache.clear();
    }

    setInitialState(data: T): void {
        this.initialState = data;
    }

    startRecording(autoTimeout: boolean = true): void {
        if (this._isRecording) return;

        this._isRecording = true;

        if (!autoTimeout) return;

        const checkCommits = ()=>{
            if (this._commitMade){
                setTimeout(checkCommits, 10);
            }
            else{
                this.stopRecording();
            }

            this._commitMade = false;
        }

        setTimeout(checkCommits);
    }

    stopRecording(): void {
        this._isRecording = false;

        if (this._commitBuffer.length > 0){
            this._commit({isMultiAction: true, actions: this._commitBuffer});
            this._commitBuffer = [];
        }
    }

    commit(data: T): void {
        if (this._isRecording){
            this._commitBuffer.push(data);
            this._commitMade = true;
        }
        else{
            this._commit(data);
        }
    }

    peekLastUndo(): T | MultiAction<T> | null {
        return this.undoStore.getLast();
    }

    stepBack(): T | MultiAction<T> | null {
        const redoStep = this.undoStore.pop();

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

    stepForward(): T | MultiAction<T> | null {
        const undoStep = this.redoStore.pop();

        if (undoStep){
            this.undoStore.push(undoStep);
        }

        return undoStep;
    }

    clear(): void {
        this.undoStore.clear();
        this.redoStore.clear();
    }

    popLast(): T | MultiAction<T> | null {
        return this.undoStore.pop();
    }
}

export function useUndoHelpers(undoStore: Undo_Store<Core.ActionCallbackData>, actionMap: Map<number, Core.ActionCallback>, revertMap: Map<number, Core.ActionCallback>){
    function stepBackward(): void {
        if (undoStore.undoLength <= 0) return;

        const step = undoStore.stepBack();

        if (!step) {
            console.error("Could not retrieve undo step");
            return;
        }

        if (isMultiAction(step)){
            for (let i = step.actions.length - 1; i >= 0; i--){
                const action = step.actions[i];
                applyChronoStep(action, revertMap);
            }
        }
        else{
            applyChronoStep(step, revertMap);
        }
    }

    function stepForward(): void {
        if (undoStore.redoLength <= 0) return;

        const step = undoStore.stepForward();

        if (!step) {
            console.error("Could no retrieve undo step");
            return;
        }

        if (isMultiAction(step)){
            for (let i = 0; i < step.actions.length; i++){
                const action = step.actions[i];
                applyChronoStep(action, actionMap);
            }
        }
        else{
            applyChronoStep(step, actionMap);
        }
    }

    function applyChronoStep(step: Core.ActionCallbackData, map: Map<Core.ActionCallbackData['actionType'], Core.ActionCallback>): void {
        const action = map.get(step.actionType);

        if (!action) {
            console.error('Could not find action');
            return;
        }

        action(step, false);
    }

    return {
        stepBackward,
        stepForward,
    }
}
