import { SOCKET_TYPE } from "./Node_Enums";

const {
    ANY,
    NUMBER,
    STRING,
    OBJECT,
    BOOL,
} = SOCKET_TYPE;

const socketConversionMap = (()=>{
    const scm = new Map<SOCKET_TYPE, Map<SOCKET_TYPE, (val: any)=>any>>();

    const number = new Map();
    number.set(STRING, (val: number): string => val.toString());
    number.set(BOOL, (val: number): boolean => !!val);

    const string = new Map();
    string.set(BOOL, (val: string): boolean => !!val.length);

    const object = new Map();
    object.set(STRING, (val: {name: string}): string => val.name);
    object.set(BOOL, () => true);

    const bool = new Map();
    bool.set(NUMBER, (val: boolean): number => +val);
    bool.set(STRING, (val: boolean): string => val.toString());

    scm.set(NUMBER, number);
    scm.set(STRING, string);
    scm.set(OBJECT, object);
    scm.set(BOOL, bool);

    return scm;
})();

function needsConvert(fromType: SOCKET_TYPE, toType: SOCKET_TYPE){
    const anyToAny = fromType == ANY || toType == ANY;
    const sameType = fromType == toType;

    return !(sameType || anyToAny);
}

export function canConvertSocket(fromType: SOCKET_TYPE, toType: SOCKET_TYPE){
    return !needsConvert(fromType, toType) || !!socketConversionMap.get(fromType)?.get(toType);
}

export function convertSocketType(fromType: SOCKET_TYPE, toType: SOCKET_TYPE, value: any){
    if (!needsConvert(fromType, toType)){
        return value;
    }

    const fromTypeMap = socketConversionMap.get(fromType)!;
    const toTypeFunc = fromTypeMap.get(toType);

    return toTypeFunc ? toTypeFunc(value) : null;
}