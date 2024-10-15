import { Vector } from "../Vector";
import { Instance_Object, tObjectInstanceSaveData } from "./Instance_Object";
import { Game_Object } from "./Game_Object";
import { iEngineLogic } from "../LogicInterfaces";
import { INSTANCE_TYPE } from "../Enums";
import type { Label } from "./Asset_Base";

export type tInstanceLogicSaveData = [
    ...tObjectInstanceSaveData,
    Label<number, 'Logic ID'>
]

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

    constructor(id: number, pos = new Vector(), logicScriptId: number, logicScriptName: string){
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

    override toSaveData(): tInstanceLogicSaveData {
        return [
            ...super.toSaveData(),
            this.logicId,
        ];
    }

    override needsPurge(logicMap: Map<number, any>): boolean {
        return !logicMap.get(this.logicId);
    }

    static fromSaveData(data: tInstanceLogicSaveData, objMap: Map<number, Game_Object>): Instance_Logic {
        const instance = new Instance_Logic(data.id, Vector.fromArray(data.pos), data.lId, data.name);

        instance.name = data.name;

        if (data.objId >= 0){
            instance._objRef = objMap.get(data.objId)!;
        }

        instance.logicId = data.lId;

        return instance;
    }

    setLogic(logicMap: Map<number, iEngineLogic>): void {
        this.logicScript = logicMap.get(this.logicId)!;
    }

    override isInGroup(group: string): boolean {
        return !!this.groups.find(g => g == group);
    }
}