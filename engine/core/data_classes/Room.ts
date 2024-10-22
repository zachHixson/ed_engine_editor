import { Asset_Base, sAssetSaveData } from './Asset_Base';
import { NavState, tNavSaveData } from '../NavState';
import { Camera, sCameraSaveData } from './Camera';
import { Spacial_Collection } from '../Spacial_Collection';
import { CATEGORY_ID, INSTANCE_TYPE } from '../Enums';
import { Color } from '../Draw';
import { Instance_Exit, sExitSaveData } from './Instance_Exit';
import { Sprite } from './Sprite';
import { Game_Object } from './Game_Object';
import { sObjectInstanceSaveData, Instance_Object } from './Instance_Object';
import { ConstVector, Vector } from '../Vector';
import { Instance_Base, sInstanceBaseSaveData } from './Instance_Base';
import { Linked_List } from '../Linked_List';
import { Instance_Sprite, sInstanceSpriteSaveData } from './Instance_Sprite';
import { Instance_Logic, sInstanceLogicSaveData } from './Instance_Logic';
import { iEngineLogic } from '../LogicInterfaces';
import { iEditorLogic } from '../LogicInterfaces';
import { Struct, GetKeyTypesFrom } from '../Struct';

export const sRoomSaveData = [
    ...sAssetSaveData,
    ['cameraData', Struct.getDataType<GetKeyTypesFrom<typeof sCameraSaveData>>()],
    ['instanceList', Struct.getDataType<GetKeyTypesFrom<typeof sInstanceBaseSaveData>[]>()],
    ['bgCol', String()],
    ['persist', Struct.getDataType<0 | 1>()],
    ['gravOn', Struct.getDataType<0 | 1>()],
    ['gravStrength', Number()],
    ['navData', Struct.getDataType<tNavSaveData>()],
] as const;

export class Room extends Asset_Base {
    private static _curInstId: number = 0;

    private _instances: Linked_List<Instance_Base> = new Linked_List();
    private _spacialCollection: Spacial_Collection<Instance_Base> | null = null;

    navState: NavState = new NavState();
    camera: Camera = new Camera();
    bgColor: Color = new Color(255, 255, 255);
    persist: boolean = false;
    useGravity: boolean = false;
    gravity: number = 9.81;
    
    get category_ID(){return CATEGORY_ID.ROOM}
    get curInstId(){return Room._curInstId++}
    get instances(){return this._instances}

    clone(): Room {
        let clone = Object.assign(new Room(), this) as Room;
        clone.camera = this.camera.clone();
        clone._instances = this.instances.map(i => i.clone());
        clone.bgColor = Object.assign(new Color(), this.bgColor);
        return clone;
    }

    toSaveData(): GetKeyTypesFrom<typeof sRoomSaveData> {
        return [
            ...this.getBaseAssetData(),
            this.camera.toSaveData(),
            this.instances.toArray().map(i => i.toSaveData()),
            this.bgColor.toHex().replace('#', ''),
            +this.persist as (0 | 1),
            +this.useGravity as (0 | 1),
            this.gravity,
            this.navState.toSaveData(),
        ];
    }

    static fromSaveData(data: GetKeyTypesFrom<typeof sRoomSaveData>, assetMap: Map<CATEGORY_ID, Map<number, Asset_Base | iEngineLogic>>): Room {
        return new Room()._loadSaveData(data, assetMap);
    }

    private _loadSaveData(data: GetKeyTypesFrom<typeof sRoomSaveData>, assetMap: Map<CATEGORY_ID, Map<number, Asset_Base | iEngineLogic>>){
        const dataObj = Struct.objFromArr(sRoomSaveData, data);

        if (!dataObj){
            throw new Error('Error loading room from save data');
        }

        const instancesSerial = dataObj.instanceList;

        this.loadBaseAssetData(data);
        this.camera = Camera.fromSaveData(dataObj.cameraData);
        this.bgColor = new Color().fromHex(dataObj.bgCol);
        this.persist = !!dataObj.persist;
        this.useGravity = !!dataObj.gravOn;
        this.gravity = dataObj.gravStrength;
        this.navState = NavState.fromSaveData(dataObj.navData);

        for (let i = 0; i < instancesSerial.length; i++){
            const curInstance = instancesSerial[i];
            const newInstance: Instance_Base = (()=>{
                switch(curInstance[2]){
                    case INSTANCE_TYPE.SPRITE:
                        return Instance_Sprite.fromSaveData(
                            instancesSerial[i] as unknown as GetKeyTypesFrom<typeof sInstanceSpriteSaveData>,
                            assetMap.get(CATEGORY_ID.SPRITE) as Map<number, Sprite>
                        );
                    case INSTANCE_TYPE.OBJECT:
                        return Instance_Object.fromSaveData(
                            instancesSerial[i] as unknown as [string, unknown][],
                            assetMap.get(CATEGORY_ID.OBJECT) as Map<number, Game_Object>
                        );
                    case INSTANCE_TYPE.EXIT:
                        return Instance_Exit.fromSaveData(curInstance as unknown as GetKeyTypesFrom<typeof sExitSaveData>);
                    case INSTANCE_TYPE.LOGIC:
                        const logicInstance = Instance_Logic.fromSaveData(
                            curInstance as unknown as [string, unknown][],
                            assetMap.get(CATEGORY_ID.OBJECT) as Map<number, Game_Object>
                        );
                        const logicMap = assetMap.get(CATEGORY_ID.LOGIC);

                        if (logicMap){
                            logicInstance.setLogic(assetMap.get(CATEGORY_ID.LOGIC) as Map<number, iEngineLogic>);
                        }
                        
                        return logicInstance;
                }
            })()!;
            
            this.addInstance(newInstance)
            Room._curInstId = Math.max(newInstance.id + 1, Room._curInstId);
        }

        return this;
    }

    private _noSpacialDataError(): void {
        console.error('ERROR: Cannot perform spacial operations without initializing spacial data');
    }

    purgeMissingReferences(assetMap: Map<CATEGORY_ID, Map<number, Asset_Base | iEditorLogic>>){
        this._instances.forEach(instance => {
            let typeMap;

            switch(instance.TYPE){
                case INSTANCE_TYPE.SPRITE: typeMap = assetMap.get(CATEGORY_ID.SPRITE)!; break;
                case INSTANCE_TYPE.OBJECT: typeMap = assetMap.get(CATEGORY_ID.OBJECT)!; break;
                case INSTANCE_TYPE.LOGIC: typeMap = assetMap.get(CATEGORY_ID.LOGIC)!; break;
                case INSTANCE_TYPE.EXIT: typeMap = assetMap.get(CATEGORY_ID.ROOM)!; break;
            }

            if (instance.needsPurge(typeMap)){
                this.removeInstance(instance.id);

                if (this.camera.followObjId == instance.id){
                    this.camera.followObjId = null;
                }
            }
        });
    }

    initSpacialData(): void {
        this._spacialCollection = new Spacial_Collection(2000, 64);
        this._instances.forEach(i => this._spacialCollection!.add(i));
    }

    clearSpacialData(): void {
        this._spacialCollection = null;
    }

    addInstance(newInstance: Instance_Base): void {
        this.instances.push(newInstance);
        this._spacialCollection?.add(newInstance);
    }

    getInstanceById(instId: number): Instance_Base | null {
        return this.instances.find(i => i.id == instId) ?? null;
    }

    getInstancesInRadius(pos: Vector, radius: number): Instance_Base[] {
        if (!this._spacialCollection) {
            this._noSpacialDataError();
            return [];
        }

        return this._spacialCollection.getByRadius(pos, radius);
    }

    removeInstance(instId: number): Instance_Base | null {
        const instance = this._instances.remove(i => i.id == instId);

        this._spacialCollection?.remove(instId);

        return instance;
    }

    setInstancePosition(instRef: Instance_Base, newPos: ConstVector): void {
        instRef.setPosition(newPos);
        this._spacialCollection?.updatePosition(instRef.id);
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