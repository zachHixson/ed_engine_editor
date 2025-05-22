import {CATEGORY_ID} from '../Enums';
import {ID_Generator} from '../ID_Generator';
import { AssetSave as AssetSave_L, AssetSaveId } from '@compiled/SaveTypes';

export type AssetSave = {
    id: number,
	name: string,
	sort: number,
};

export abstract class Asset_Base {
    id: number = ID_Generator.newID();
    name:string = this.id.toString();
    sortOrder: number = 0;

    abstract get category_ID(): CATEGORY_ID;
    get thumbnail(): HTMLCanvasElement | null {return null}

    loadBaseAssetData(data: [...AssetSave_L, ...any[]]): void {
        this.id = data[AssetSaveId.id];
        this.name = data[AssetSaveId.name];
        this.sortOrder = data[AssetSaveId.sortOrder];
    }
    
    getBaseAssetData(): AssetSave {
        return {
            id: this.id,
            name: this.name,
            sort: this.sortOrder,
        };
    }

    abstract toSaveData(): any;

    purgeMissingReferences(...args: any): void {};
};