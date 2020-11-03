import Asset from './Asset';
import {CATEGORY_ID, CATEGORY_TYPE} from '../Enums';
import Instance_Collection from './Instance_Collection';

class Room extends Asset{
    constructor(){
        super();
        this.collection = new Instance_Collection(4000, 200);
    }

    get type(){return CATEGORY_TYPE.ROOM}
    get category_ID(){return CATEGORY_ID.ROOM}
    get zSortedList(){return this.collection.zSort}

    addInstance(objRef, pos){
        this.collection.addInstance(objRef, pos);
    }

    getObjectsInRadius({x, y}, radius){
        return this.collection.getObjectsInRadius({x, y}, radius);
    }
}

export default Room;