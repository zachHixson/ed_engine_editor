import { Asset_Base, iAssetSaveData } from './Asset_Base';
import { NavState, getNavSaveData, parseNavSaveData, iNavSaveData } from '../NavState';
import { Camera, iCameraSaveData } from './Camera';
import { Spacial_Collection } from '../Spacial_Collection';
import { CATEGORY_ID } from '../Enums';
import { Color } from '../Draw';
import { Exit, iExitSaveData } from './Exit';
import { Game_Object } from './Game_Object';
import { iObjectInstanceSaveData, Object_Instance } from './Object_Instance';
import { Vector } from '../Vector';
import { Instance_Base } from './Instance_Base';

export interface iRoomSaveData extends iAssetSaveData {
    _curInstId: number,
    _curExitId: number,
    cameraProps: iCameraSaveData;
    instancesSerial: iObjectInstanceSaveData[],
    exitsSerial: iExitSaveData[],
    bgColor: string,
    persist: boolean,
    useGravity: boolean,
    gravity: number,
    navState: iNavSaveData,
}

export class Room extends Asset_Base {
    private _curInstId: number = 0;
    private _curExitId: number = 0;

    navState: NavState = new NavState();
    camera: Camera = new Camera();
    instances: Spacial_Collection<Instance_Base> = new Spacial_Collection(2000, 64);
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

    toSaveData(): iRoomSaveData {
        return {
            ...this.getBaseAssetData(),
            _curInstId: this._curInstId,
            _curExitId: this._curExitId,
            cameraProps: this.camera.toSaveData(),
            instancesSerial: this.instances.toSaveData() as iObjectInstanceSaveData[],
            exitsSerial: this.exits.toSaveData() as iExitSaveData[],
            bgColor: this.bgColor.toHex().replace('#', ''),
            persist: this.persist,
            useGravity: this.useGravity,
            gravity: this.gravity,
            navState: getNavSaveData(this.navState),
        } satisfies iRoomSaveData;
    }

    static fromSaveData(data: iRoomSaveData, objectMap: Map<number, Game_Object>): Room {
        return new Room()._loadSaveData(data, objectMap);
    }

    private _loadSaveData(data: iRoomSaveData, objectMap: Map<number, Game_Object>){
        const instancesSerial = data.instancesSerial;
        const exitsSerial = data.exitsSerial;

        this.loadBaseAssetData(data);
        this._curInstId = data._curInstId;
        this._curExitId = data._curExitId;
        this.camera = Camera.fromSaveData(data.cameraProps);
        this.navState = parseNavSaveData(data.navState);
        this.bgColor = new Color().fromHex(data.bgColor);
        this.persist = data.persist;
        this.useGravity = data.useGravity;
        this.gravity = data.gravity;

        for (let i = 0; i < instancesSerial.length; i++){
            const newInstance = Object_Instance.fromSaveData(instancesSerial[i], objectMap);
            
            this.addInstance(newInstance)
            this._curInstId = Math.max(newInstance.id + 1, this._curInstId);
        }

        for (let i = 0; i < exitsSerial.length; i++){
            const curExitData = exitsSerial[i];
            const newExit = Exit.fromSaveData(curExitData);

            this._curExitId = Math.max(newExit.id + 1, this._curExitId);
            this.exits.add(newExit);
        }

        return this;
    }

    purgeMissingReferences(objects: Game_Object[], rooms: Room[]){
        // this.instances.forEach(i => {
        //     const foundObj = objects.find(o => o.id == i.objRef.id);

        //     if (!foundObj){
        //         this.removeInstance(i.id);
        //     }
        // });

        // this.exits.forEach(e => {
        //     const foundRoom = rooms.find(r => r.id == e.destinationRoom);

        //     if (!foundRoom){
        //         e.destinationRoom = null;
        //         e.destinationExit = null;
        //     }
        // });
    }

    addInstance(newInstance: Instance_Base): void {
        this.instances.add(newInstance);
    }

    getInstanceById(instId: number): Instance_Base | null {
        return this.instances.getById(instId);
    }

    getInstancesInRadius(pos: Vector, radius: number): Instance_Base[] {
        return this.instances.getByRadius(pos, radius);
    }

    getAllInstances(): Instance_Base[] {
        return this.instances.toArray();
    }

    removeInstance(instId: number): Instance_Base | null {
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