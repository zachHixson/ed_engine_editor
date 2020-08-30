import Asset from './Asset';
import {CATEGORY_ID, CATEGORY_TYPE} from '../Enums';

class Room extends Asset{
    constructor(){
        super();
    }

    get type(){return CATEGORY_TYPE.ROOM}
    get category_ID(){return CATEGORY_ID.ROOM}
}

export default Room;