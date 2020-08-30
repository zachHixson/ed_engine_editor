import Asset from './Asset';
import {CATEGORY_ID, CATEGORY_TYPE} from '../Enums';

class Game_Object extends Asset{
    constructor(){
        super();
    }

    get type(){return CATEGORY_TYPE.OBJECT}
    get category_ID(){return CATEGORY_ID.OBJECT}
}

export default Game_Object;