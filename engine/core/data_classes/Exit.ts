import { Vector } from '../Vector';
import { iCollisionEvent, iInstanceBaseSaveData, Instance_Base } from './Instance_Base';
import {INSTANCE_TYPE} from '../Enums';
import { Object_Instance } from './Object_Instance';
import { Game_Object } from './Game_Object';
import Engine from '@engine/Engine';
import { COLLISION_EVENT } from '../nodes/Node_Enums';
import { TRANSITION } from '@engine/transitions/Transition_Base';

export interface iExitSaveData extends iInstanceBaseSaveData {
    isEnding: boolean;
    destinationRoom: number | null;
    destinationExit: number | null;
    transition: TRANSITION;
    endingDialog: string;
}

export class Exit extends Instance_Base {
    static EXIT_ICON_ID = 'EXIT_ICON';
    static ENDING_ICON_ID = 'ENDING_ICON';
    static EXIT_ICON = [new ImageData(1, 1)];
    static ENDING_ICON = [new ImageData(1, 1)];
    static engine: Engine | null;
    static exitInstance: Object_Instance | null;
    static destExit: Exit | null;
    static resetState(): void {
        Exit.exitInstance?.clearPrevExit();
        Exit.exitInstance = null;
        Exit.destExit = null;
    }

    isEnding: boolean = false;
    destinationRoom: number | null = null;
    destinationExit: number | null = null;
    transition: TRANSITION = TRANSITION.NONE;
    endingDialog: string = '';

    static get TRANSITION_TYPES(){return TRANSITION}

    get TYPE(){return INSTANCE_TYPE.EXIT}

    get frameDataId(){return this.isEnding ? Exit.ENDING_ICON_ID : Exit.EXIT_ICON_ID}
    get frameData(){return this.isEnding ? Exit.ENDING_ICON : Exit.EXIT_ICON}

    get hasCollisionEvent(){return true};

    private _loadRoom(objInstance: Object_Instance, instDirection?: Vector){
        const EXIT_TYPES = Game_Object.EXIT_TYPES;
        const engine = Exit.engine!;
        const exitBehavior = objInstance.objRef.exitBehavior;
        const prevRoom = engine.room;
        const direction = instDirection ?? objInstance.pos.clone().subtract(objInstance.lastPos).normalize();

        engine.loadRoom(this.destinationRoom!);

        //remove object from room so it doesn't respawn on re-enter
        if (exitBehavior != EXIT_TYPES.TRANSITION_ONLY) {
            const prevRoomData = engine.getRoomData(prevRoom.id)!;
            
            if (prevRoomData.hasInstance(objInstance.id)){
                prevRoomData.removeInstance(objInstance.id);
            }
            
            objInstance.lastPos.copy(objInstance.pos);
        }

        Exit.destExit = engine.room.instances.find(e => e.id == this.destinationExit)! as Exit;

        switch(exitBehavior) {
            case EXIT_TYPES.TO_DESTINATION:
                objInstance.pos.copy(Exit.destExit.pos);
                objInstance.lastPos.copy(objInstance.pos);
                objInstance.setPrevExit(Exit.destExit, direction);
            case EXIT_TYPES.KEEP_POSITION:
                engine.addInstance(objInstance);
        }
    }

    onUpdate(): void {
        if (Exit.destExit != this) return;
        
        const overlapping = Exit.engine!.getInstancesOverlapping(this).filter(i => i.id == Exit.exitInstance?.id);

        if (!overlapping.length) {
            Exit.resetState();
        }
    }

    onCollision(event: iCollisionEvent): void {
        if (Exit.exitInstance) return;
        if (event.type != COLLISION_EVENT.START) return;
        if (this.isEnding) {
            Exit.engine!.triggerEnding(this.endingDialog);
            return;
        }
        if (this.destinationRoom == null || event.instance.TYPE != INSTANCE_TYPE.OBJECT) return;
        this.triggerExit(event.instance as Object_Instance);
    }

    triggerExit(objInstance: Object_Instance, instDirection?: Vector): void {
        Exit.exitInstance = objInstance;

        if (this.destinationRoom != null){
            Exit.engine!.transitionRoom(this.destinationRoom, this.transition, ()=>this._loadRoom(objInstance, instDirection));
        }
    }

    clone(): Exit {
        const clone = new Exit(this.id, this.pos);
        Object.assign(clone, this);
        clone.pos = this.pos.clone();
        return clone;
    }

    toSaveData(): iExitSaveData {
        return {
            ...this.getBaseSaveData(),
            isEnding: this.isEnding,
            destinationRoom: this.destinationRoom,
            destinationExit: this.destinationExit,
            transition: this.transition,
            endingDialog: this.endingDialog,
        };
    }

    static fromSaveData(data: iExitSaveData): Exit {
        return new Exit(data.id, Vector.fromObject(data.pos))._loadSaveData(data);
    }

    private _loadSaveData(data: iExitSaveData): Exit {
        this.loadBaseSaveData(data);
        this.isEnding = data.isEnding;
        this.destinationRoom = data.destinationRoom;
        this.destinationExit = data.destinationExit;
        this.transition = data.transition;
        this.endingDialog = data.endingDialog;

        return this;
    }
};