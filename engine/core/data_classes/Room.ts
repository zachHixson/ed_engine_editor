import { Asset_Base } from './Asset_Base';
import { Camera } from './Camera';
import { Spacial_Collection } from '../Spacial_Collection';
import { CATEGORY_ID } from '../Enums';
import { Color } from '../Draw';
import { Instance_Base } from './Instance_Base';
import { Exit } from './Exit';
import { iAnyObj } from '../interfaces';
import { Game_Object } from './Game_Object';
import { Object_Instance } from './Object_Instance';
import { Vector } from '../Vector';

export class Room extends Asset_Base {
    private _curInstId: number = 0;
    private _curExitId: number = 0;

    camera: Camera = new Camera();
    instances: Spacial_Collection<Object_Instance> = new Spacial_Collection(2000, 64);
    exits: Spacial_Collection<Exit> = new Spacial_Collection(2000, 64);
    bgColor: Color = new Color(255, 255, 255);
    persist: boolean = false;
    useGravity: boolean = false;
    gravity: number = 9.81;
    
    get category_ID(){return CATEGORY_ID.ROOM}
    get instanceList(){return this.instances}
    get exitsList(){return this.exits}
    get curInstId(){return this._curInstId++};
    get curExitId(){return this._curExitId++};

    clone(): Room {
        let clone = Object.assign(new Room(), this);
        clone.camera = this.camera.clone();
        clone.instances = this.instances.clone(true);
        clone.exits = this.exits.clone(true);
        clone.bgColor = Object.assign(new Color(), this.bgColor);
        return clone;
    }

    toSaveData(): iAnyObj {
        let sanitized = Object.assign({}, this) as any;
        
        sanitized.cameraProps = Object.assign({}, this.camera);
        sanitized.instancesSerial = this.instances.toSaveData();
        sanitized.exitsSerial = this.exits.toSaveData();
        sanitized.bgColor = this.bgColor.toHex().replace('#', '');

        delete sanitized.camera;
        delete sanitized.instances;
        delete sanitized.exits;

        return sanitized;
    }

    fromSaveData(room: iAnyObj, objectList: Game_Object[]){
        this.navState = this.parseNavData(room.navState);
        this.camera = new Camera().fromSaveData(room.cameraProps);
        this.bgColor = new Color().fromHex(room.bgColor);

        delete room.cameraProps;
        delete room.instancesSerial;
        delete room.exitsSerial;

        Object.assign(this, room);

        for (let i = 0; i < room.instancesSerial.length; i++){
            const curInstance = room.instancesSerial[i];
            const objRef = objectList.find(o => o.id == curInstance.objId)!;
            const newInstance = new Object_Instance(curInstance.id, Vector.fromObject(curInstance.pos), objRef)
                .fromSaveData(curInstance);
            
            this.addInstance(newInstance)
            this._curInstId = Math.max(newInstance.id + 1, this._curInstId);
        }

        for (let i = 0; i < room.exitsSerial.length; i++){
            let curExitData = room.exitsSerial[i];
            let newExit = new Exit(curExitData.id).fromSaveData(curExitData);
            this._curExitId = Math.max(newExit.id + 1, this._curExitId);
            this.exits.add(newExit);
        }

        return this;
    }

    purgeMissingReferences(objects: Game_Object[], rooms: Room[]){
        this.instances.forEach(i => {
            const foundObj = objects.find(o => o.id == i.objRef.id);

            if (!foundObj){
                this.removeInstance(i.id);
            }
        });

        this.exits.forEach(e => {
            const foundRoom = rooms.find(r => r.id == e.destinationRoom);

            if (!foundRoom){
                e.destinationRoom = null;
                e.destinationExit = null;
            }
        });
    }

    addInstance(newInstance: Object_Instance): void {
        this.instances.add(newInstance);
    }

    getInstanceById(instId: number): Object_Instance | null {
        return this.instances.getById(instId);
    }

    getInstancesInRadius(pos: Vector, radius: number): Object_Instance[] {
        return this.instances.getByRadius(pos, radius);
    }

    getAllInstances(): Object_Instance[] {
        return this.instances.toArray();
    }

    removeInstance(instId: number): Object_Instance | null {
        return this.instances.remove(instId);
    }

    setInstancePosition(instRef: Object_Instance, newPos: Vector): void {
        instRef.pos.copy(newPos);
        this.instances.updatePosition(instRef.id);
    }

    addExit(newExit: Exit): void {
        this.exits.add(newExit);
    }

    getExitById(exitId: number): Exit | null {
        return this.exits.getById(exitId);
    }

    getExitsAtPosition(pos: Vector): Exit[] {
        return this.exits.getByRadius(pos, 0);
    }

    getAllExits(): Exit[] {
        return this.exits.toArray();
    }

    removeExit(exitId: number): Exit | null {
        return this.exits.remove(exitId);
    }

    getContentsBounds(): number[] {
        const bounds = new Array(4);

        bounds[0] = this.camera.pos.x;
        bounds[1] = this.camera.pos.y;
        bounds[2] = this.camera.pos.x;
        bounds[3] = this.camera.pos.y;

        this.instances.forEach(i =>{
            bounds[0] = Math.min(i.pos.x, bounds[0]);
            bounds[1] = Math.min(i.pos.y, bounds[1]);
            bounds[2] = Math.max(i.pos.x, bounds[2]);
            bounds[3] = Math.max(i.pos.y, bounds[3]);
        });
        this.exits.forEach(i =>{
            bounds[0] = Math.min(i.pos.x, bounds[0]);
            bounds[1] = Math.min(i.pos.y, bounds[1]);
            bounds[2] = Math.max(i.pos.x, bounds[2]);
            bounds[3] = Math.max(i.pos.y, bounds[3]);
        });

        bounds[2] += 16;
        bounds[3] += 16;
        bounds[1] *= -1;
        bounds[3] *= -1;

        return bounds;
    }
};