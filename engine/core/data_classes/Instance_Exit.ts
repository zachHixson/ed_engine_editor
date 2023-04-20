import { Vector } from '../Vector';
import { iCollisionEvent, iInstanceBaseSaveData, Instance_Base } from './Instance_Base';
import {INSTANCE_TYPE} from '../Enums';
import { Instance_Object } from './Instance_Object';
import { Game_Object } from './Game_Object';
import { Camera } from './Camera';
import Engine from '@engine/Engine';
import { COLLISION_EVENT } from '../nodes/Node_Enums';
import { TRANSITION } from '@engine/transitions/Transition_Base';
import { Room } from './Room';

export interface iExitSaveData extends iInstanceBaseSaveData {
    isEnding: boolean;
    destinationRoom: number | '';
    destinationExit: number | '';
    transition: TRANSITION;
    endingDialog: string;
}

export class Instance_Exit extends Instance_Base {
    static EXIT_ICON_ID = 'EXIT_ICON';
    static ENDING_ICON_ID = 'ENDING_ICON';
    static EXIT_ICON = [new ImageData(1, 1)];
    static ENDING_ICON = [new ImageData(1, 1)];
    static engine: Engine | null;
    static exitInstance: Instance_Object | null;
    static exitCamera: Camera | null;
    static destExit: Instance_Exit | null;
    static resetState(): void {
        Instance_Exit.exitInstance?.clearPrevExit();
        Instance_Exit.exitInstance = null;
        Instance_Exit.exitCamera = null;
        Instance_Exit.destExit = null;
    }

    isEnding: boolean = false;
    destinationRoom: number | null = null;
    destinationExit: number | null = null;
    transition: TRANSITION = TRANSITION.NONE;
    endingDialog: string = '';

    static get TRANSITION_TYPES(){return TRANSITION}

    get TYPE(){return INSTANCE_TYPE.EXIT}
    get sourceId(){return -1}

    get frameDataId(){return this.isEnding ? Instance_Exit.ENDING_ICON_ID : Instance_Exit.EXIT_ICON_ID}
    get frameData(){return this.isEnding ? Instance_Exit.ENDING_ICON : Instance_Exit.EXIT_ICON}

    get hasCollisionEvent(){return true};

    private _loadRoom(objInstance: Instance_Object, instDirection?: Vector){
        const EXIT_TYPES = Game_Object.EXIT_TYPES;
        const engine = Instance_Exit.engine!;
        const exitBehavior = objInstance.objRef.exitBehavior;
        const direction = instDirection ?? objInstance.pos.clone().subtract(objInstance.lastPos).normalize();

        //remove object from room so it doesn't respawn on re-enter
        if (exitBehavior != EXIT_TYPES.TRANSITION_ONLY) {
            const prevRoomData = engine.getRoomData(engine.room.id)!;
            
            if (prevRoomData.hasInstance(objInstance.id)){
                prevRoomData.removeInstance(objInstance.id);
            }
            
            objInstance.lastPos.copy(objInstance.pos);
        }

        engine.loadRoom(this.destinationRoom!);

        Instance_Exit.destExit = engine.room.instances.find(e => e.id == this.destinationExit)! as Instance_Exit;

        switch(exitBehavior) {
            case EXIT_TYPES.TO_DESTINATION:
                objInstance.pos.copy(Instance_Exit.destExit.pos);
                objInstance.lastPos.copy(objInstance.pos);
                objInstance.setPrevExit(Instance_Exit.destExit, direction);
            case EXIT_TYPES.KEEP_POSITION:
                engine.addInstance(objInstance);
        }

        if (Instance_Exit.exitCamera){
            engine.room.camera.copyCameraSettings(Instance_Exit.exitCamera);
        }
    }

    override onUpdate(): void {
        if (Instance_Exit.destExit != this) return;
        
        const overlapping = Instance_Exit.engine!.getInstancesOverlapping(this).filter(i => i.id == Instance_Exit.exitInstance?.id);

        if (!overlapping.length) {
            Instance_Exit.resetState();
        }
    }

    override onCollision(event: iCollisionEvent): void {
        if (Instance_Exit.exitInstance) return;
        if (event.type != COLLISION_EVENT.START) return;
        if (this.isEnding) {
            Instance_Exit.engine!.triggerEnding(this.endingDialog);
            return;
        }
        if (this.destinationRoom == null || event.instance.TYPE != INSTANCE_TYPE.OBJECT) return;
        this.triggerExit(event.instance as Instance_Object);
    }

    triggerExit(objInstance: Instance_Object, instDirection?: Vector): void {
        if (this.destinationRoom != null){
            const transition = Instance_Exit.engine!.setTransition(this.transition);
            Instance_Exit.exitInstance = objInstance;
            Instance_Exit.engine!.enableInput = false;
            transition.addEventListener('load-room', ()=>this._loadRoom(objInstance, instDirection), {once:true});
            transition.addEventListener('complete', ()=>Instance_Exit.engine!.enableInput = true, {once: true});

            if (Instance_Exit.exitInstance.objRef.keepCameraSettings){
                Instance_Exit.exitCamera = Instance_Exit.engine!.room.camera;
            }

            transition.start(this.destinationRoom);
        }
    }

    override clone(): Instance_Exit {
        const clone = new Instance_Exit(this.id, this.pos);
        Object.assign(clone, this);
        clone.pos = this.pos.clone();
        return clone;
    }

    override toSaveData(): iExitSaveData {
        return {
            ...this.getBaseSaveData(),
            isEnding: this.isEnding,
            destinationRoom: this.destinationRoom === null ? '' : this.destinationRoom,
            destinationExit: this.destinationExit === null ? '' : this.destinationExit,
            transition: this.transition,
            endingDialog: this.endingDialog,
        };
    }

    override needsPurge(roomMap: Map<number, Room>): boolean {
        const destRoom = roomMap.get(this.destinationRoom!);
        const destExit = destRoom?.instances.find(i => i.id == this.destinationExit);

        if (!destRoom){
            this.destinationRoom = null;
        }

        if (!destExit){
            this.destinationExit = null;
        }

        return false;
    }

    static fromSaveData(data: iExitSaveData): Instance_Exit {
        return new Instance_Exit(data.id, Vector.fromObject(data.pos))._loadSaveData(data);
    }

    private _loadSaveData(data: iExitSaveData): Instance_Exit {
        this.loadBaseSaveData(data);
        this.isEnding = data.isEnding;
        this.destinationRoom = data.destinationRoom === '' ? null : data.destinationRoom;
        this.destinationExit = data.destinationExit === '' ? null : data.destinationExit;
        this.transition = data.transition;
        this.endingDialog = data.endingDialog;

        return this;
    }
};