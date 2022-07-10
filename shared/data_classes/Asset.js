import {CATEGORY_ID} from '../Enums';
import {ID_Generator} from '../ID_Generator';

export class Asset{
    constructor(){
        this.id = ID_Generator.newID();
        this.name = this.id;
        this.sortOrder = 0;

        if (window.EDITOR){
            this.navState = this.defaultNavState;
        }
    }

    get category_ID(){return CATEGORY_ID.UNDEFINED}
    get thumbnail(){return null}
    get defaultNavState(){return {
        offset: new Victor(0, 0),
        zoomFac: 1,
    }}

    parseNavData(navData){
        return {
            offset: new Victor.fromObject(navData.offset),
            zoomFac: navData.zoomFac
        }
    }
    
    toSaveData(){return this}

    fromSaveData(data){
        Object.assign(this, data);
        return this;
    }

    purgeMissingReferences(){}
};