import { INSTANCE_TYPE } from "../Enums";
import { iAnyObj } from "../interfaces";
import { Vector } from "../Vector";

export interface iInstanceBaseSaveData {
    id: number;
    name: string;
    pos: { x: number, y: number };
    groups: string[];
}

export abstract class Instance_Base{
    id: number;
    name: string;
    pos: Vector;
    groups: string[] = [];
    depthOffset: number = 0;

    constructor(id: number, pos: Vector = new Vector()){
        this.id = id;
        this.name = this.id.toString();
        this.pos = pos;
    }

    get userDepth(){return 0};
    get zDepth(){return 0};
    set zDepth(val){};

    get hasEditorFrame(): boolean {return true};
    get editorFrameNum(){return 0};
    abstract get frameDataId(): number | string;
    abstract get frameData(): Array<ImageData>;
    
    abstract get TYPE(): INSTANCE_TYPE;
    abstract clone(): any;
    abstract toSaveData(): iAnyObj;

    loadBaseSaveData(data: iInstanceBaseSaveData): void {
        this.id = data.id;
        this.name = data.name;
        this.pos = Vector.fromObject(data.pos);
        this.groups = data.groups;
    }

    getBaseSaveData(): iInstanceBaseSaveData {
        return {
            id: this.id,
            name: this.name,
            pos: this.pos.toObject(),
            groups: this.groups,
        } satisfies iInstanceBaseSaveData;
    }
}