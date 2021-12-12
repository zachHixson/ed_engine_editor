import ID_Generator from '@/common/ID_Generator';
import {CATEGORY_ID, CATEGORY_TYPE} from '../Enums';
import Victor from 'victor';

class Asset{
    constructor(){
        this.id = ID_Generator.newID();
        this.name = this.id;

        if (window.EDITOR){
            this.navState = this.defaultNavState;
        }
    }

    get type(){return CATEGORY_TYPE.UNDEFINED}
    get category_ID(){return CATEGORY_ID.UNDEFINED}
    get thumbnailData(){return null}
    get defaultNavState(){return {
        offset: new Victor(0, 0),
        zoomFac: 1,
    }}
    
    toSaveData(){return this}

    fromSaveData(data){
        Object.assign(this, data);
        this.navState = {
            offset: new Victor.fromObject(data.navState.offset),
            zoomFac: data.navState.zoomFac
        }
        return this;
    }

    purgeMissingReferences(){}
}

export default Asset;