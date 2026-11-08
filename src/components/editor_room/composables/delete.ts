import Tool_Base from './Tool_Base';
import type { iActionArguments } from '../RoomMain.vue';
import type { imEvent } from '../RoomEditWindow.vue';
import { RoomMainEventBus, ROOM_ACTION } from '../RoomMain.vue';
import { useRoomEditorStore, ROOM_TOOL_TYPE } from '@/stores/RoomEditor';
import Core from '@/core';

export type DeleteProps = {actionType: ROOM_ACTION.DELETE, instId?: number, instRefList?: Core.Instance_Base[]};

export function useDelete(args: iActionArguments){

    const roomEditorStore = useRoomEditorStore();

    class Erase_Brush extends Tool_Base {
        private _down = false;
        private _last: Core.Vec2 | null = null;

        private deleteInstancesInCell(instances: Core.Instance_Base[]): void {
            const filteredInstances = roomEditorStore.eraserSelectedType && args.props.selectedAsset ?
                instances.filter(i => i.sourceId == args.props.selectedAsset.id) : instances;

            if (filteredInstances.length <= 0) return;

            if (roomEditorStore.eraserTopOnly){
                const data = {actionType: ROOM_ACTION.DELETE, instId: filteredInstances[0].id} as DeleteProps;
                filteredInstances.sort((a, b) => b.zDepth - a.zDepth);
                actionDelete(data, false);
            }
            else{
                filteredInstances.forEach(i => {
                    const data = {actionType: ROOM_ACTION.DELETE, instId: i.id} as DeleteProps;
                    actionDelete(data, false);
                });
            }
        }

        override mouseDown(mEvent: imEvent): void {
            this._down = true;
            this.mouseMove(mEvent);
        }

        override mouseMove(mEvent: imEvent): void {
            const removedFromCell = this._last?.equalTo(mEvent.worldCell) ?? false;

            if (!removedFromCell && this._down){
                const instances = args.props.selectedRoom.getInstancesInRadius(mEvent.worldCell, 0)
                    .filter((i) => i.pos.equalTo(mEvent.worldCell));

                this.deleteInstancesInCell(instances);
                this._last = mEvent.worldCell;
            }
        }

        override mouseUp(): void {
            this._down = false;
            this._last = null;
            actionDelete({actionType: ROOM_ACTION.DELETE}, true);
        }
    }

    function actionDelete(data: Core.ActionCallbackData, makeCommit = true): void {
        const { instId, instRefList = [] } = data as DeleteProps;
        const cacheList = args.undoStore.cache.get('delete_list') as unknown[];
        const singleInstance = !cacheList && makeCommit;

        if (makeCommit && !singleInstance){
            const commitData = {actionType: ROOM_ACTION.DELETE, instRefList: cacheList} as DeleteProps;
            args.undoStore.commit(commitData);
            args.undoStore.cache.delete('delete_list');
            return;
        }

        if (instId != undefined){
            const instRef = args.props.selectedRoom.removeInstance(instId)!;

            if (instRef == args.editorSelection.value){
                args.editorSelection.value = null;
            }

            if (cacheList){
                cacheList.push(instRef);
            }
            else if (instRef){
                args.undoStore.cache.set('delete_list', [instRef]);
            }

            RoomMainEventBus.onInstanceRemoved.emit(instRef);
        }

        for (let i = 0; i < instRefList.length; i++){
            const inst = instRefList[i]
            args.props.selectedRoom.removeInstance(inst.id);
            RoomMainEventBus.onInstanceRemoved.emit(inst);
        }
    }

    function revertDelete(data: Core.ActionCallbackData): void {
        const { instRefList = [] } = data as DeleteProps;

        for (let i = 0; i < instRefList.length; i++){
            const instRef = instRefList[i];
            args.props.selectedRoom.addInstance(instRef);
            RoomMainEventBus.onInstanceAdded.emit(instRef);
        }
    }

    args.toolMap.set(ROOM_TOOL_TYPE.ERASER, Erase_Brush);
    args.actionMap.set(ROOM_ACTION.DELETE, actionDelete);
    args.revertMap.set(ROOM_ACTION.DELETE, revertDelete);

    return { deleteInstance: actionDelete };
}
