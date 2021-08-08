import Asset from './Asset.js';
import {CATEGORY_TYPE, CATEGORY_ID} from '../Enums';

class Logic extends Asset{
    constructor(){
        super();
    }

    get type(){return CATEGORY_TYPE.LOGIC}
    get category_ID(){return CATEGORY_ID.LOGIC}
}

export default Logic;