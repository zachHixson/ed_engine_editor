import {CATEGORY_ID} from '../Enums';
import {ID_Generator} from '../ID_Generator';
import { iAnyObj, iNavState } from '../interfaces';
import { Vector } from '../Vector';

export abstract class Asset_Base {
    id: number = ID_Generator.newID();
    name:string = this.id.toString();
    sortOrder: number = 0;
    navState?: iNavState;

    constructor(){
        if (!window.IS_ENGINE){
            this.navState = this.defaultNavState;
        }
    }

    abstract get category_ID(): CATEGORY_ID;
    get thumbnail(): HTMLCanvasElement | null {return null}
    get defaultNavState(){return {
        offset: new Vector(0, 0),
        zoomFac: 1,
    }}

    parseNavData(navData: iAnyObj){
        return {
            offset: Vector.fromObject(navData.offset),
            zoomFac: navData.zoomFac
        }
    }
    
    abstract toSaveData(): any;
    abstract fromSaveData(data: iAnyObj, ...other: any): any;

    purgeMissingReferences(...args: any): void {};
};