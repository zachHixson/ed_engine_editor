import { INSTANCE_TYPE } from "../Enums";
import { Vector } from "../Vector";
import { Node_Enums } from "../core";

export interface iInstanceBaseSaveData {
    id: number;
    name: string;
    type: string;
    pos: { x: number, y: number };
    groups: string[];
}

export interface iCollisionEvent {
    type: Node_Enums.COLLISION_EVENT,
    instance: Instance_Base,
}

export abstract class Instance_Base{
    id: number;
    name: string;
    pos: Vector;
    groups: string[] = [];
    depthOffset: number = 0;
    needsRenderUpdate = false;

    constructor(id: number, pos: Vector = new Vector()){
        this.id = id;
        this.name = this.id.toString();
        this.pos = pos;
    }

    //Basic data getters
    abstract get TYPE(): INSTANCE_TYPE;
    abstract clone(): any;
    abstract toSaveData(): any;

    //Rendering getters
    get renderable() {return false};
    get hasEditorFrame(): boolean {return false};
    get startFrame(){return 0};
    get animFrame(){return 0};
    set animFrame(val: number){};
    get userDepth(){return 0};
    get zDepth(){return 0};
    set zDepth(val){};
    abstract get frameDataId(): number | string;
    abstract get frameData(): Array<ImageData>;

    get hasCollisionEvent(){return false};

    //Lifecycle events
    onCreate(): void {}
    onUpdate(deltaTime: number): void {}
    onCollision(event: iCollisionEvent): void {}
    onDestroy(): void {}

    advanceAnimation(deltaTime: number): void {}

    setPosition(newPos: Vector): void {
        this.pos.copy(newPos);
    }

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
            type: this.TYPE,
            pos: this.pos.toObject(),
            groups: this.groups,
        } satisfies iInstanceBaseSaveData;
    }
}