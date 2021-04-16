import Victor from 'victor';
import Asset from './Asset';
import Camera from './Camera';
import {CATEGORY_ID, CATEGORY_TYPE} from '../Enums';
import Spacial_Collection from './Spacial_Collection';
import Instance from './Instance';
import Exit from './Exit';

class Room extends Asset{
    constructor(){
        super();
        this.camera = new Camera();
        this.instances = new Spacial_Collection(2000, 80);
        this.exits = new Spacial_Collection(2000, 80);
        this.bgColor = "#FFFFFF";
        this.persist = false;
        this.useGravity = false;
        this.gravity = 9.81;
        this.customVars = [];
    }

    get type(){return CATEGORY_TYPE.ROOM}
    get category_ID(){return CATEGORY_ID.ROOM}
    get zSortedList(){return this.instances.zSort}
    get exitsList(){return this.exits.zSort}

    toSaveData(){
        let sanitized = Object.assign({}, this);
        
        sanitized.cameraProps = Object.assign({}, this.camera);
        sanitized.instancesSerial = this.instances.toSaveData();
        sanitized.exitsSerial = this.exits.toSaveData();

        delete sanitized.camera;
        delete sanitized.instances;
        delete sanitized.exits;

        return sanitized;
    }

    fromSaveData(room, objectList){
        Object.assign(this, room);
        this.camera = new Camera().fromSaveData(room.cameraProps);

        for (let i = 0; i < room.instancesSerial.length; i++){
            let curInstance = room.instancesSerial[i];
            let objRef = objectList.find(o => o.ID == curInstance.objId);
            let newInstance;

            newInstance = this.addInstance(objRef, Victor.fromObject(curInstance.pos));
            delete curInstance.pos;
            delete curInstance.objId;
            Object.assign(newInstance, curInstance);
        }

        for (let i = 0; i < room.exitsSerial.length; i++){
            let curExitData = room.exitsSerial[i];
            let newExit = new Exit().fromSaveData(curExitData);
            this.exits.add(newExit, newExit.pos);
        }

        delete this.cameraProps;
        delete this.instancesSerial;
        delete this.exitsSerial;

        return this;
    }

    addInstance(objRef, pos){
        let newInstance = new Instance(this.instances.curInstId, objRef, pos);
        return this.instances.add(newInstance, pos);
    }

    getInstanceById(instId){
        return this.instances.getById(instId);
    }

    getInstancesInRadius({x, y}, radius){
        return this.instances.getByRadius({x, y}, radius);
    }

    getAllInstances(){
        return this.instances.zSort.toArray();
    }

    removeInstance(instId, pos = null){
        return this.instances.remove(instId, pos);
    }

    setInstancePosition(instRef, newPos){
        this.instances.setPositionByRef(instRef, newPos);
    }

    addExit(pos){
        let newExit = new Exit(pos);
        return this.exits.add(newExit, pos);
    }

    getExitById(exitId){
        return this.exits.getById(exitId);
    }

    getExitsAtPosition({x, y}){
        return this.exits.getByRadius({x, y}, 0);
    }

    getAllExits(){
        return this.exits.zSort.toArray();
    }

    removeExit(exitId, pos = null){
        return this.exits.remove(exitId, pos);
    }
}

export default Room;