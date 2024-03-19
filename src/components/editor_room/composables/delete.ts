import Tool_Base from './Tool_Base';
import type { iActionArguments } from '../RoomMain.vue';
import type { imEvent } from '../RoomEditWindow.vue';
import { RoomMainEventBus } from '../RoomMain.vue';
import { useRoomEditorStore } from '@/stores/RoomEditor';
import Core from '@/core';

type DeleteProps = {instId?: number, instRefList?: Core.Instance_Base[]};

export function useDelete(args: iActionArguments){

    const roomEditorStore = useRoomEditorStore();
    
    class Erase_Brush extends Tool_Base {
        private _down = false;
        private _last: Core.Vector | null = null;

        private deleteInstancesInCell(instances: Core.Instance_Base[]): void {
            const filteredInstances = roomEditorStore.eraserSelectedType && args.props.selectedAsset ?
                instances.filter(i => i.sourceId == args.props.selectedAsset.id) : instances;

            if (filteredInstances.length <= 0) return;

            if (roomEditorStore.eraserTopOnly){
                filteredInstances.sort((a, b) => b.zDepth - a.zDepth);
                actionDelete({instId: filteredInstances[0].id}, false);
            }
            else{
                filteredInstances.forEach(i => actionDelete({instId: i.id}, false));
            }
        }

        override mouseDown(mEvent: imEvent): void {
            this._down = true;
            this.mouseMove(mEvent);
        }

        override mouseMove(mEvent: imEvent): void {
            let removedFromCell = this._last?.equalTo(mEvent.worldCell) ?? false;

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
            actionDelete({}, true);
        }
    }

    function actionDelete({instId, instRefList = []}: DeleteProps, makeCommit = true): void {
        const cacheList = args.undoStore.cache.get('delete_list');
        const singleInstance = !cacheList && makeCommit;
    
        if (makeCommit && !singleInstance){
            const data = {instRefList: cacheList};
            args.undoStore.commit({action: Core.ROOM_ACTION.DELETE, data})
            args.undoStore.cache.delete('delete_list');
            return;
        }
    
        if (instId != undefined){
            const instRef = args.props.selectedRoom.removeInstance(instId);
    
            if (instRef == args.editorSelection.value){
                args.editorSelection.value = null;
            }
    
            if (cacheList){
                cacheList.push(instRef);
            }
            else if (instRef){
                args.undoStore.cache.set('delete_list', [instRef]);
            }
    
            RoomMainEventBus.emit('instance-removed', instRef);
        }
    
        for (let i = 0; i < instRefList.length; i++){
            const inst = instRefList[i]
            args.props.selectedRoom.removeInstance(inst.id);
            RoomMainEventBus.emit('instance-removed', inst);
        }
    }

    function revertDelete({instRefList = []}: DeleteProps): void {
        for (let i = 0; i < instRefList.length; i++){
            const instRef = instRefList[i];
            args.props.selectedRoom.addInstance(instRef);
            RoomMainEventBus.emit('instance-added', instRef);
        }
    }

    args.toolMap.set(Core.ROOM_TOOL_TYPE.ERASER, Erase_Brush);
    args.actionMap.set(Core.ROOM_ACTION.DELETE, actionDelete);
    args.revertMap.set(Core.ROOM_ACTION.DELETE, revertDelete);

    return { deleteInstance: actionDelete };
}