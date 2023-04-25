import {CATEGORY_ID} from '../Enums';
import {ID_Generator} from '../ID_Generator';

export interface iAssetSaveData {
    id: number;
    name: string;
    sort: number;
}

export abstract class Asset_Base {
    id: number = ID_Generator.newID();
    name:string = this.id.toString();
    sortOrder: number = 0;

    abstract get category_ID(): CATEGORY_ID;
    get thumbnail(): HTMLCanvasElement | null {return null}

    loadBaseAssetData(data: iAssetSaveData): void {
        this.id = data.id;
        this.name = data.name;
        this.sortOrder = data.sort;
    }
    
    getBaseAssetData(): iAssetSaveData {
        return {
            id: this.id,
            name: this.name,
            sort: this.sortOrder,
        }
    }

    abstract toSaveData(): any;

    purgeMissingReferences(...args: any): void {};
};