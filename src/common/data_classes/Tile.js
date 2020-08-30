import Asset from './Asset';
import {CATEGORY_ID, CATEGORY_TYPE} from '../Enums';

class Tile extends Asset{
    constructor(){
        super();
    }

    get type(){return CATEGORY_TYPE.TILE}
    get category_ID(){return CATEGORY_ID.TILE}
}

export default Tile;