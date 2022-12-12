import { SOCKET_TYPE } from "./Node_Enums";

const {
    ANY,
    NUMBER,
    STRING,
    OBJECT,
    BOOL,
} = SOCKET_TYPE;

const socketConversionMap = new Map([
    [NUMBER, new Map([
        [STRING, val => val.toString()],
        [BOOL, val => !!val],
    ])],

    [STRING, new Map([
        [BOOL, val => val.length > 0],
    ])],

    [OBJECT, new Map([
        [STRING, val => val.name],
        [BOOL, () => true],
    ])],

    [BOOL, new Map([
        [NUMBER, val => val + 0],
        [STRING, val => val.toString()],
    ])],
]);

function needsConvert(fromType, toType){
    const anyToAny = fromType == ANY || toType == ANY;
    const sameType = fromType == toType;

    return !(sameType || anyToAny);
}

export function canConvertSocket(fromType, toType){
    return !needsConvert(fromType, toType) || !!socketConversionMap.get(fromType)?.get(toType);
}

export function convertSocketType(fromType, toType, value){
    if (!needsConvert(fromType, toType)){
        return value;
    }

    const fromTypeMap = socketConversionMap.get(fromType);
    const toTypeFunc = fromTypeMap.get(toType);

    return toTypeFunc ? toTypeFunc(value) : null;
}