export type tStruct = readonly (readonly [PropertyKey, any, boolean?])[];
export type GetKeyTypesFrom<T extends tStruct> = { [I in keyof T]: T[I][1] }
export type GetObjectTypeFrom<T extends tStruct> = { [I in `${number}` & keyof T as T[I][0]]: T[I][1] }

export class Struct {
    static objFromArr<S extends tStruct>(struct: S, arr: GetKeyTypesFrom<S>): GetObjectTypeFrom<S> | null {
        const outObj: any = {};

        for (let i = 0; i < struct.length; i++){
            if (arr[i] === undefined && !struct[i][2]){
                console.error(`Could not find required key ${String(struct[i][0])}`);
                return null;
            }

            outObj[struct[i][0]] = arr[i];
        }

        return outObj;
    }

    static arrFromObj<S extends tStruct>(struct: S, obj: GetObjectTypeFrom<S>): GetKeyTypesFrom<S> | null{
        const outArr: any = new Array(struct.length);

        for (let i = 0; i < struct.length; i++){
            const key = struct[i][0];
            outArr[i] = (obj as any)[key];
        }

        return outArr;
    }

    static assignFromArray<S extends tStruct, D extends GetObjectTypeFrom<S>>(struct: S, destObj: D, srcArr: GetKeyTypesFrom<S>): D | null{
        const dObj = destObj as any;

        for (let i = 0; i < struct.length; i++){
            const key = struct[i][0];

            if (dObj[key] === undefined){
                console.error(`Attempting to write key '${String(key)}' which does not exist on object ${destObj}`);
                return null;
            }

            dObj[key] = srcArr[i];
        }

        return destObj;
    }

    static getDataType<T>(): T {return null as any}
}

//Testing
// const saveDataStruct = [
//     ["ID", Number()],
//     ["name", String()],
//     ["someBool", Boolean()],
// ] as const;

// console.log(
//     'Object from Array',
//     Struct.objFromArr(saveDataStruct, [3, 'hello', false])
// )

// console.log(
//     'Array from object',
//     Struct.arrFromObj(saveDataStruct, {ID: 3, name: 'arrName', someBool: true})
// )

// class ATestClass {
//     ID: number;
//     name: string;
//     someBool: boolean;

//     constructor(){
//         this.ID = Math.floor(Math.random() * 10);
//         this.name = 'Default';
//         this.someBool = Math.random() * 2 > 1;
//     }
// }

// console.log(
//     'Assign load struct array into object',
//     Struct.assignFromArray(saveDataStruct, new ATestClass(), [6, 'new name', false])
// )