export class ID_Generator {
    private static _curStep = 0;

    static newID = (): number => {
        let id = this._curStep;
        this._curStep++;
        return id;
    }
    
    static reset = (): void => {
        this._curStep = 0;
    }
    
    static getCurrentID = (): number => {
        return this._curStep;
    }
    
    static setID = (id: number): void => {
        this._curStep = id;
    }
}