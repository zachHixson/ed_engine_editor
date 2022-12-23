import { iAnyObj } from "../interfaces";
import { Vector } from "../Vector";

export abstract class Instance_Base<T extends Instance_Base<T>>{
    id: number;
    name: string;
    pos: Vector;

    constructor(id: number, pos: Vector = new Vector()){
        this.id = id;
        this.name = this.id.toString();
        this.pos = pos;
    }
    
    abstract clone(): T;
    abstract toSaveData(): iAnyObj;
    abstract fromSaveData(data: iAnyObj): T;
}