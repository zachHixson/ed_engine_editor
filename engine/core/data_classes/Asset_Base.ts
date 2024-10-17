import {CATEGORY_ID} from '../Enums';
import {ID_Generator} from '../ID_Generator';
import { Struct, GetKeyTypesFrom } from '../Struct';

export const sAssetSaveData = [
    ['id', Number()],
    ['name', String()],
    ['sortOrder', Number()],
] as const;
type tExtendableBaseSaveData = readonly [...typeof sAssetSaveData, ...[string, unknown][]];

export abstract class Asset_Base {
    id: number = ID_Generator.newID();
    name:string = this.id.toString();
    sortOrder: number = 0;

    abstract get category_ID(): CATEGORY_ID;
    get thumbnail(): HTMLCanvasElement | null {return null}

    loadBaseAssetData(data: GetKeyTypesFrom<tExtendableBaseSaveData>): void {
        Struct.assignFromArray(sAssetSaveData, this, data as unknown as GetKeyTypesFrom<typeof sAssetSaveData>);
    }
    
    getBaseAssetData(): GetKeyTypesFrom<typeof sAssetSaveData> {
        const outObj = Struct.arrFromObj(sAssetSaveData, this);

        if (!outObj){
            throw new Error('Error reading base asset data');
        }

        return outObj;
    }

    abstract toSaveData(): any;

    purgeMissingReferences(...args: any): void {};
};