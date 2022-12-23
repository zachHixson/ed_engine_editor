import { iAnyObj } from "../interfaces";
import { Vector } from "../Vector";

export abstract class Instance_Base{
    id: number;
    name: string;
    pos: Vector;
    zDepth: number = 0;

    constructor(id: number, pos: Vector = new Vector()){
        this.id = id;
        this.name = this.id.toString();
        this.pos = pos;
    }
    
    abstract clone(): any;
    abstract toSaveData(): iAnyObj;
    abstract fromSaveData(data: iAnyObj): any;
}