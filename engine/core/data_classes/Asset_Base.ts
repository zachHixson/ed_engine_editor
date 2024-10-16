import {CATEGORY_ID} from '../Enums';
import {ID_Generator} from '../ID_Generator';

export type Label<T, N> = T & {Label?: N};

export type tAssetSaveData = [
    Label<number, 'ID'>,
    Label<string, 'Name'>,
    Label<number, 'SortOrder'>,
]
type tExtendableBaseSaveData = [...tAssetSaveData, ...any[]];

export abstract class Asset_Base {
    id: number = ID_Generator.newID();
    name:string = this.id.toString();
    sortOrder: number = 0;

    abstract get category_ID(): CATEGORY_ID;
    get thumbnail(): HTMLCanvasElement | null {return null}

    loadBaseAssetData(data: tExtendableBaseSaveData): void {
        this.id = data[0];
        this.name = data[1];
        this.sortOrder = data[2];
    }
    
    getBaseAssetData(): tAssetSaveData {
        return [
            this.id,
            this.name,
            this.sortOrder,
        ];
    }

    abstract toSaveData(): any;

    purgeMissingReferences(...args: any): void {};
};