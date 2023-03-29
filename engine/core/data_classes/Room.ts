import { Asset_Base, iAssetSaveData } from './Asset_Base';
import { NavState, getNavSaveData, parseNavSaveData, iNavSaveData } from '../NavState';
import { Camera, iCameraSaveData } from './Camera';
import { Spacial_Collection } from '../Spacial_Collection';
import { CATEGORY_ID, INSTANCE_TYPE } from '../Enums';
import { Color } from '../Draw';
import { Exit, iExitSaveData } from './Exit';
import { Game_Object } from './Game_Object';
import { iObjectInstanceSaveData, Object_Instance } from './Object_Instance';
import { Vector } from '../Vector';
import { Instance_Base } from './Instance_Base';

export interface iRoomSaveData extends iAssetSaveData {
    cameraProps: iCameraSaveData;
    instancesSerial: (iObjectInstanceSaveData | iExitSaveData)[],
    bgColor: string,
    persist: boolean,
    useGravity: boolean,
    gravity: number,
    navState: iNavSaveData,
}

export class Room extends Asset_Base {
    private static _curInstId: number = 0;

    navState: NavState = new NavState();
    camera: Camera = new Camera();
    instances: Spacial_Collection<Instance_Base> = new Spacial_Collection(2000, 64);
    bgColor: Color = new Color(255, 255, 255);
    persist: boolean = false;
    useGravity: boolean = false;
    gravity: number = 9.81;
    
    get category_ID(){return CATEGORY_ID.ROOM}
    get instanceList(){return this.instances}
    get curInstId(){return Room._curInstId++};

    clone(): Room {
        let clone = Object.assign(new Room(), this);
        clone.camera = this.camera.clone();
        clone.instances = this.instances.clone(true);
        clone.bgColor = Object.assign(new Color(), this.bgColor);
        return clone;
    }

    toSaveData(): iRoomSaveData {
        return {
            ...this.getBaseAssetData(),
            cameraProps: this.camera.toSaveData(),
            instancesSerial: this.instances.toSaveData(),
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

        this.loadBaseAssetData(data);
        this.camera = Camera.fromSaveData(data.cameraProps);
        this.navState = parseNavSaveData(data.navState);
        this.bgColor = new Color().fromHex(data.bgColor);
        this.persist = data.persist;
        this.useGravity = data.useGravity;
        this.gravity = data.gravity;

        for (let i = 0; i < instancesSerial.length; i++){
            const curInstance = instancesSerial[i];
            const newInstance: Instance_Base = (()=>{
                switch(curInstance.type){
                    case INSTANCE_TYPE.OBJECT:
                        return Object_Instance.fromSaveData(instancesSerial[i] as iObjectInstanceSaveData, objectMap);
                    case INSTANCE_TYPE.EXIT:
                    default:
                        return Exit.fromSaveData(curInstance as iExitSaveData);
                }
            })();
            
            this.addInstance(newInstance)
            Room._curInstId = Math.max(newInstance.id + 1, Room._curInstId);
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

    setInstancePosition(instRef: Instance_Base, newPos: Vector): void {
        instRef.pos.copy(newPos);
        this.instances.updatePosition(instRef.id);
    }

    hasInstance(instanceId: number): boolean {
        let doesExist = false;

        this.instances.forEach(i => doesExist ||= i.id == instanceId);

        return doesExist;
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

        bounds[2] += 16;
        bounds[3] += 16;
        bounds[1] *= -1;
        bounds[3] *= -1;

        return bounds;
    }
};