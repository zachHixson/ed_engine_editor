import ID_Generator from '@/common/ID_Generator';
import {CATEGORY_ID, CATEGORY_TYPE} from '../Enums';

class Asset{
    constructor(){
        this.ID = ID_Generator.newID();
        this.name = this.ID;
    }

    get type(){return CATEGORY_TYPE.UNDEFINED}
    get category_ID(){return CATEGORY_ID.UNDEFINED}
    get thumbnailData(){return null}
    
    toSaveData(){return this}

    fromSaveData(data){
        Object.assign(this, data);
        return this;
    }

    purgeMissingReferences(){}
}

export default Asset;