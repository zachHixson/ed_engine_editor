import { SOCKET_TYPE } from "./Node_Enums";
import { CATEGORY_ID, INSTANCE_TYPE } from "../Enums";
import iGameData from "@engine/iGameData";
import {
    Vector,
    Sprite,
    Game_Object,
    Asset_Base,
    Instance_Base,
    Instance_Logic,
    Instance_Object,
    Instance_Sprite,
    iEngineLogic
} from "../core";

const {
    ANY,
    NUMBER,
    STRING,
    ASSET,
    INSTANCE,
    BOOL,
} = SOCKET_TYPE;

export function assetToInstance(asset: Asset_Base | iEngineLogic, id: number, pos: Vector): Instance_Base | null {
    if (!asset) return null;
    
    switch(asset.category_ID){
        case CATEGORY_ID.SPRITE:
            const sprite = asset as Sprite;
            return new Instance_Sprite(id, pos, sprite);
        case CATEGORY_ID.OBJECT:
            const object = asset as Game_Object;
            return new Instance_Object(id, pos, object);
        case CATEGORY_ID.LOGIC:
            const logic = asset as iEngineLogic;
            return new Instance_Logic(id, pos, logic.id, '');
        default:
            return null;
    }
}

export function listConvert(fromList: boolean, toList: boolean, value: any | any[]): any | any[] {
    if (fromList == toList){
        return value;
    }

    if (fromList && !toList){
        return value[0] ?? null;
    }

    if (!fromList && toList){
        return [value];
    }

    return value;
}

export function instanceToAsset(instance: Instance_Base, gameData: iGameData): Asset_Base | iEngineLogic | null {
    let assetList: (Asset_Base | iEngineLogic)[];

    switch(instance.TYPE){
        case INSTANCE_TYPE.LOGIC:
            assetList = gameData.logic;
            break;
        case INSTANCE_TYPE.OBJECT:
            assetList = gameData.objects;
            break;
        case INSTANCE_TYPE.SPRITE:
            assetList = gameData.sprites;
            break;
        default:
            assetList = [];
    }

    return assetList.find(asset => asset.id == instance.sourceId) ?? null;
}

const socketConversionMap = (()=>{
    const scm = new Map<SOCKET_TYPE, Map<SOCKET_TYPE, (val: any)=>any>>();

    const number = new Map();
    number.set(STRING, (val: number): string => val.toString());
    number.set(BOOL, (val: number): boolean => !!val);

    const string = new Map();
    string.set(BOOL, (val: string): boolean => !!val.length);

    const asset = new Map();
    asset.set(STRING, (val: {name: string}): string => val.name);
    asset.set(BOOL, () => true);

    const instance = new Map();
    instance.set(STRING, (val: {name: string}): string => val.name);
    instance.set(ASSET, (val: Instance_Base)=>{
        switch(val.TYPE){
            case INSTANCE_TYPE.LOGIC:
                const logic = val as Instance_Logic;
                return logic.logicScript;
            case INSTANCE_TYPE.OBJECT:
                const object = val as Instance_Object;
                return object.objRef;
            case INSTANCE_TYPE.SPRITE:
                const sprite = val as Instance_Sprite;
                return sprite.sprite;
            default:
                return null;
        }
    });
    instance.set(BOOL, () => true);

    const bool = new Map();
    bool.set(NUMBER, (val: boolean): number => +val);
    bool.set(STRING, (val: boolean): string => val.toString());

    scm.set(NUMBER, number);
    scm.set(STRING, string);
    scm.set(ASSET, asset);
    scm.set(INSTANCE, instance);
    scm.set(BOOL, bool);

    return scm;
})();

function needsConvert(fromType: SOCKET_TYPE, toType: SOCKET_TYPE): boolean {
    const anyToAny = fromType == ANY || toType == ANY;
    const sameType = fromType == toType;

    return !(sameType || anyToAny);
}

export function canConvertSocket(fromType: SOCKET_TYPE, toType: SOCKET_TYPE): boolean {
    const triggerCheck = !(+(!!fromType) ^ +(!!toType));
    const hasConversionFunc = !!socketConversionMap.get(fromType)?.get(toType);
    return triggerCheck && (!needsConvert(fromType, toType) || hasConversionFunc);
}

export function convertSocketType(fromType: SOCKET_TYPE, toType: SOCKET_TYPE, value: any): any {
    if (!needsConvert(fromType, toType)){
        return value;
    }

    const fromTypeMap = socketConversionMap.get(fromType)!;
    const toTypeFunc = fromTypeMap.get(toType);

    return toTypeFunc ? toTypeFunc(value) : null;
}