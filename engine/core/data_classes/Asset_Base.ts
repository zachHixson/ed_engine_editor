import {CATEGORY_ID} from '../Enums';
import {ID_Generator} from '../ID_Generator';

export type Label<T, N> = Partial<T | {Label: N}>;

export type tAssetSaveData = [
    Label<number, 'ID'>,
    Label<string, 'Name'>,
    Label<number, 'SortOrder'>,
]

export abstract class Asset_Base {
    id: number = ID_Generator.newID();
    name:string = this.id.toString();
    sortOrder: number = 0;

    abstract get category_ID(): CATEGORY_ID;
    get thumbnail(): HTMLCanvasElement | null {return null}

    loadBaseAssetData(data: tAssetSaveData): void {
        this.id = data.id;
        this.name = data.name;
        this.sortOrder = data.sort;
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