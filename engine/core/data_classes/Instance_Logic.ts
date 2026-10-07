import { Vec2 } from "linearz";
import { Instance_Object, InstanceObjectSave } from "./Instance_Object";
import { Game_Object } from "./Game_Object";
import { iEngineLogic } from "@engine/core/LogicInterfaces";
import type { AssetMap } from "@engine/core/interfaces";
import { INSTANCE_TYPE } from "@engine/core/Enums";
import { u32ToVec2 } from "@engine/core/Util";

export type InstanceLogicSave = [
    ...InstanceObjectSave,
    logicId: number,
];

export class Instance_Logic extends Instance_Object {
    private static readonly _placeHolderObject = (()=>{
        const obj = new Game_Object();
        obj.id = -1;
        return obj;
    })();

    static LOGIC_ICON_ID = 'LOGIC_ICON';
    static LOGIC_ICON = [new ImageData(1, 1)];

    logicId: number;
    logicScript: iEngineLogic | null = null;

    constructor(id: number, pos = new Vec2(), logicScriptId: number, logicScriptName: string){
        super(id, pos, Instance_Logic._placeHolderObject);

        this.name = logicScriptName + '_' + logicScriptId;
        this.logicId = logicScriptId;
    }

    get TYPE(){return INSTANCE_TYPE.LOGIC}
    get sourceId(){return this.logicId}

    get objRef(){
        //Don't create an object reference until the user actually tries to access it
        if (this._objRef == Instance_Logic._placeHolderObject){
            const obj = new Game_Object();
            obj.id = -Math.random();
            this._objRef = obj;
        }

        return this._objRef;
    }
    get logic(){return this.logicScript}

    get frameDataId(){return Instance_Logic.LOGIC_ICON_ID}
    get frameData(){return Instance_Logic.LOGIC_ICON}

    override clone(): Instance_Logic {
        const clone = new Instance_Logic(this.id, this.pos, this.logicId, this.name);
        Object.assign(clone, this);
        clone.pos = this.pos.clone();
        if (this.lastPos) clone.lastPos = this.lastPos.clone();
        clone.localVariables = new Map(this.localVariables);
        return clone;
    }

    override toSaveData(): InstanceLogicSave {
        return [
            ...super.toSaveData(),
            this.logicId,
        ] as unknown as InstanceLogicSave;
    }

    override needsPurge(assetMap: AssetMap): boolean {
        const map = assetMap.engineLogic ?? assetMap.editorLogic;
        return !map?.get(this.logicId);
    }

    static fromSaveData(data: InstanceObjectSave, objMap: Map<number, Game_Object>): Instance_Logic {
        const lData = data as unknown as InstanceLogicSave;
        const instance = new Instance_Logic(
            lData[0],
            u32ToVec2(lData[3]),
            lData[13],
            ""
        );
        const srcObjId = lData[10];

        instance.name = lData[1];

        if (srcObjId >= 0){
            instance._objRef = objMap.get(srcObjId)!;
        }

        instance.logicId = lData[13];

        return instance;
    }

    setLogic(logicMap: Map<number, iEngineLogic>): void {
        this.logicScript = logicMap.get(this.logicId)!;
    }

    override isInGroup(group: string): boolean {
        return !!this.groups.find(g => g == group);
    }
}
