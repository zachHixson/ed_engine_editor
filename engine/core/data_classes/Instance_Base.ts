import { ENTITY_TYPE } from "../Enums";
import { iAnyObj } from "../interfaces";
import { Vector } from "../Vector";

export abstract class Instance_Base{
    id: number;
    name: string;
    pos: Vector;

    constructor(id: number, pos: Vector = new Vector()){
        this.id = id;
        this.name = this.id.toString();
        this.pos = pos;
    }

    get zDepth(){return 0};
    set zDepth(val){};
    
    abstract get TYPE(): ENTITY_TYPE;
    abstract clone(): any;
    abstract toSaveData(): iAnyObj;
    abstract fromSaveData(data: iAnyObj): any;
}