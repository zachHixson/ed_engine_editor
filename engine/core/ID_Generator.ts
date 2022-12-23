export const ID_Generator = {
    curStep: 0,

    newID(): number {
        let id = this.curStep;
        this.curStep++;
        return id;
    },

    reset(): void {
        this.curStep = 0;
    },

    getCurrentID(): number {
        return this.curStep;
    },

    setID(id: number): void {
        this.curStep = id;
    }
};