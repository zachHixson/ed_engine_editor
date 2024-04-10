import Tool_Base from './Tool_Base';
import type { iActionArguments } from '../RoomMain.vue';
import type { imEvent } from '../RoomEditWindow.vue';
import { RoomMainEventBus } from '../RoomMain.vue';
import Core from '@/core';
import { ref, nextTick } from 'vue';

type MoveProps = {instId?: number, instRef?: Core.Instance_Base, newPos?: Core.ConstVector, oldPos?: Core.Vector};

export function useSelectMove(args: iActionArguments){
    const overlapBox = ref<HTMLDivElement>();
    const overlappingInstances = ref<Core.Instance_Base[]>([]);

    class Select_Move extends Tool_Base {
        private _down = false;
        private _newSelection = false;
        private _downOnSelection = false;
        private _worldPosDown: Core.Vector | null = null;
        private _last: Core.Vector | null = null;

        private _selectInstanceByPos(pos: Core.Vector): void {
            const nearbyInst = args.props.selectedRoom
                .getInstancesInRadius(pos, 0)
                .filter(instance => instance.pos.equalTo(pos))
                .sort((a, b) => b.zDepth - a.zDepth);
        
            if (nearbyInst.length > 0){
                args.editorSelection.value = nearbyInst[0];
            }
            else{
                args.editorSelection.value = null;
            }
        }

        override mouseDown(mEvent: imEvent): void {
            this._down = true;
            this._worldPosDown = mEvent.worldCell.clone();
            
            if (args.editorSelection.value?.pos.equalTo(mEvent.worldCell)){
                this._downOnSelection = true;
                this._last = mEvent.worldCell.clone();
            }
            else{
                this._selectInstanceByPos(mEvent.worldCell);
                this._newSelection = true;
            }
        }

        override mouseMove(mEvent: imEvent): void {
            if (
                this._down &&
                this._downOnSelection &&
                !this._last?.equalTo(mEvent.worldCell)
            ){
                actionMove({instRef: args.editorSelection.value as Core.Instance_Object, newPos: mEvent.worldCell}, false);
                this._last?.copy(mEvent.worldCell);
            }
        }

        override doubleClick(mEvent: imEvent): void {
            const instances = args.props.selectedRoom.getInstancesInRadius(mEvent.worldCell, 0)
                .filter(instance => instance.pos.equalTo(mEvent.worldCell));

            if (instances.length > 0){
                openOverlapBox(instances, mEvent.canvasPos);
            }
        }

        override mouseUp(mEvent: imEvent): void {
            if (this._worldPosDown && mEvent.worldCell.equalTo(this._worldPosDown) && !this._newSelection){
                this._selectInstanceByPos(mEvent.worldCell);
            }

            if (args.undoStore.cache.get('move_start')){
                actionMove({}, true);
            }

            this._downOnSelection = false;
            this._newSelection = false;
            this._down = false;
            this._last = null;
        }
    }

    function openOverlapBox(instances: Core.Instance_Base[], pos: Core.Vector): void {
        overlappingInstances.value = instances.sort((a, b) => b.zDepth - a.zDepth);
        
        nextTick(()=>{
            const parentBounds = overlapBox.value!.parentElement!.getBoundingClientRect();
            const boxBounds = overlapBox.value!.getBoundingClientRect();
            const parentWidth = parentBounds.right - parentBounds.left;
            const parentHeight = parentBounds.bottom - parentBounds.top;
            const boxWidth = boxBounds.right - boxBounds.left;
            const boxHeight = boxBounds.bottom - boxBounds.top;
            const x = Math.min(pos.x, parentWidth - (boxWidth * 1.5));
            const y = Math.min(pos.y, parentHeight - boxHeight);
            overlapBox.value!.style.left = x + 'px';
            overlapBox.value!.style.top = y + 'px';
        });
    }

    function actionMove({instId, instRef, newPos}: MoveProps, makeCommit = true): void {
        if (makeCommit){
            const {instRef, oldPos} = args.undoStore.cache.get('move_start');
            const data = {instId: instRef.id, instRef, newPos: instRef.pos.clone(), oldPos} satisfies MoveProps;
            args.undoStore.commit({action: Core.ROOM_ACTION.MOVE, data});
            args.undoStore.cache.delete('move_start');
            return;
        }
    
        if (!instRef){
            instRef = args.props.selectedRoom.getInstanceById(instId!)!;
        }
    
        if (!args.undoStore.cache.get('move_start')){
            args.undoStore.cache.set('move_start', {instRef, oldPos: instRef.pos.clone()});
        }
    
        args.props.selectedRoom.setInstancePosition(instRef, newPos!);
        RoomMainEventBus.onInstanceChanged.emit(instRef);
    }

    function revertMove({instRef, oldPos}: MoveProps): void {
        args.props.selectedRoom.setInstancePosition(instRef!, oldPos!);
        RoomMainEventBus.onInstanceChanged.emit(instRef!);
    }

    args.toolMap.set(Core.ROOM_TOOL_TYPE.SELECT_MOVE, Select_Move);
    args.actionMap.set(Core.ROOM_ACTION.MOVE, actionMove);
    args.revertMap.set(Core.ROOM_ACTION.MOVE, revertMove);

    return { overlapBox, overlappingInstances };
}