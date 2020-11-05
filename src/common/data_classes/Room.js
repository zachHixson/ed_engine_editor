import Victor from 'victor';
import Asset from './Asset';
import {CATEGORY_ID, CATEGORY_TYPE} from '../Enums';
import Instance_Collection from './Instance_Collection';

class Room extends Asset{
    constructor(){
        super();
        this.camera = {
            pos: new Victor(0, 0)
        };
        this.collection = new Instance_Collection(4000, 200);
    }

    get type(){return CATEGORY_TYPE.ROOM}
    get category_ID(){return CATEGORY_ID.ROOM}
    get zSortedList(){return this.collection.zSort}

    addInstance(objRef, pos){
        this.collection.addInstance(objRef, pos);
    }

    getInstanceById(instId){
        this.collection.getInstanceById(instId);
    }

    getInstancesInRadius({x, y}, radius){
        return this.collection.getInstancesInRadius({x, y}, radius);
    }

    removeInstance(instId, pos = null){
        this.collection.removeInstance(instId, pos);
    }

    setInstancePosition(instRef, newPos){
        this.collection.setInstancePosition(instRef, newPos);
    }
}

export default Room;