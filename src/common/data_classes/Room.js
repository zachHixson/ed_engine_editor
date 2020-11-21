import Victor from 'victor';
import Asset from './Asset';
import Camera from './Camera';
import {CATEGORY_ID, CATEGORY_TYPE} from '../Enums';
import Instance_Collection from './Instance_Collection';

class Room extends Asset{
    constructor(){
        super();
        this.camera = new Camera();
        this.collection = new Instance_Collection(2000, 80);
        this.bgColor = "#FFFFFF";
        this.persist = false;
        this.useGravity = false;
        this.gravity = 9.81;
        this.customVars = [];
    }

    get type(){return CATEGORY_TYPE.ROOM}
    get category_ID(){return CATEGORY_ID.ROOM}
    get zSortedList(){return this.collection.zSort}

    toSaveData(){
        let sanitized = Object.assign({}, this);
        
        sanitized.cameraProps = Object.assign({}, this.camera);
        sanitized.instances = this.collection.toSaveData();

        delete sanitized.camera;
        delete sanitized.collection;

        return sanitized;
    }

    fromSaveData(room, objects, sprites){
        Object.assign(this, room);
        
        this.camera.fromSaveData(room.cameraProps);

        for (let i = 0; i < room.instances.length; i++){
            let curInstance = room.instances[i];
            let objRef = null;
            let newInstance;

            //locate object reference by ID
            for (let o = 0; o < objects.length && !objRef; o++){
                if (objects[o].ID == curInstance.objId){
                    objRef = objects[o];
                }
            }

            newInstance = this.collection.addInstance(objRef, new Victor().copy(curInstance.pos));
            delete curInstance.pos;
            delete curInstance.objId;
            Object.assign(newInstance, curInstance);
        }

        return this;
    }

    addInstance(objRef, pos){
        return this.collection.addInstance(objRef, pos);
    }

    getInstanceById(instId){
        this.collection.getInstanceById(instId);
    }

    getInstancesInRadius({x, y}, radius){
        return this.collection.getInstancesInRadius({x, y}, radius);
    }

    getAllInstances(){
        return this.collection.zSort.toArray();
    }

    removeInstance(instId, pos = null){
        return this.collection.removeInstance(instId, pos);
    }

    setInstancePosition(instRef, newPos){
        this.collection.setInstancePosition(instRef, newPos);
    }
}

export default Room;