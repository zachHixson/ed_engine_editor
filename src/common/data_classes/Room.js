import Asset from './Asset';
import {CATEGORY_ID, CATEGORY_TYPE} from '../Enums';
import Instance_Collection from './Instance_Collection';

class Room extends Asset{
    constructor(){
        super();
        this.collection = new Instance_Collection(8192, 16);
    }

    get type(){return CATEGORY_TYPE.ROOM}
    get category_ID(){return CATEGORY_ID.ROOM}
    get zSortedList(){return this.collection.zSort}

    add(objRef, pos){
        this.collection.addInstance(objRef, pos);
    }
}

export default Room;