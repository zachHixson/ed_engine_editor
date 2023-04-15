import Tool_Base from './Tool_Base';
import type { iActionArguments } from '../RoomMain.vue';
import type { imEvent } from '../RoomEditWindow.vue';
import { RoomMainEventBus } from '../RoomMain.vue';
import Core from '@/core';

type DeleteProps = {instId?: number, instRefList?: Core.Instance_Base[]};

export function useDelete(args: iActionArguments){
    
    class Erase_Brush extends Tool_Base {
        private _down = false;
        private _cellCache = new Array<Core.Vector>();

        override mouseDown(mEvent: imEvent): void {
            this._down = true;
            this.mouseMove(mEvent);
        }

        override mouseMove(mEvent: imEvent): void {
            let removedFromCell = false;

            if (this._cellCache.length > 0){
                removedFromCell ||= this._cellCache[0].equalTo(mEvent.worldCell);
            }

            if (!removedFromCell && this._down){
                let instances = args.props.selectedRoom.getInstancesInRadius(mEvent.worldCell, 0);
                instances = instances.filter((i) => i.pos.equalTo(mEvent.worldCell));
                instances.sort((a, b) => a.zDepth - b.zDepth);

                if (instances.length > 0){
                    actionDelete({instId: instances[0].id}, false);
                }

                this._cellCache[0] = mEvent.worldCell;
            }
        }

        override mouseUp(): void {
            this._down = false;
            actionDelete({}, true);
        }
    }

    const deleteInstance = () => {
        const id = args.editorSelection.value?.id;
        actionDelete({instId: id});
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
    
        if (singleInstance){
            actionDelete({}, true);
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

    return { deleteInstance };
}