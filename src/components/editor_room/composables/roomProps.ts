import Tool_Base from './Tool_Base';
import type { iActionArguments } from '../RoomMain.vue';
import { RoomMainEventBus, ROOM_ACTION } from '../RoomMain.vue';
import { useRoomEditorStore, ROOM_TOOL_TYPE } from '@/stores/RoomEditor';
import Core from '@/core';

export type RoomPropChangeProps = { actionType: ROOM_ACTION.ROOM_PROP_CHANGE, newState: object, oldState?: object };

export function useRoomProps(args: iActionArguments){

    class Room_Props extends Tool_Base {
        constructor(){
            super();
            this.openPanel();
        }

        override click(): void {
            this.openPanel();
        }

        openPanel(): void {
            const roomEditorStore = useRoomEditorStore();
            roomEditorStore.setPropPanelState(true);
        }
    }

    function actionRoomPropChange(data: Core.ActionCallbackData, makeCommit = true): void {
        const { newState } = data as RoomPropChangeProps;
        const oldState = Object.assign({}, args.props.selectedRoom);

        Object.assign(args.props.selectedRoom, newState);

        const bgColorHasChanged = !oldState.bgColor.compare(args.props.selectedRoom.bgColor);

        if (bgColorHasChanged){
            RoomMainEventBus.onBgColorChanged.emit();
        }

        if (makeCommit){
            const commitData = { actionType: ROOM_ACTION.ROOM_PROP_CHANGE, newState, oldState } as RoomPropChangeProps;
            const bgColorGet = args.undoStore.cache.get('bg-color') as Core.Draw.Color;

            if (bgColorGet){
                type HasBGColor = { bgColor: Core.Draw.Color };
                (commitData.oldState as HasBGColor).bgColor = bgColorGet;
            }

            args.undoStore.commit(commitData);
            args.undoStore.cache.delete('bg-color');
        }
        else if(bgColorHasChanged && !args.undoStore.cache.has('bg-color')){
            args.undoStore.cache.set('bg-color', oldState.bgColor);
        }
    }

    function revertRoomPropChange(data: Core.ActionCallbackData): void {
        const { oldState } = data as RoomPropChangeProps;
        const curBG = args.props.selectedRoom.bgColor.clone();

        Object.assign(args.props.selectedRoom, oldState);

        if (!curBG.compare(args.props.selectedRoom.bgColor)){
            RoomMainEventBus.onBgColorChanged.emit();
        }
    }

    args.toolMap.set(ROOM_TOOL_TYPE.ROOM_PROPERTIES, Room_Props);
    args.actionMap.set(ROOM_ACTION.ROOM_PROP_CHANGE, actionRoomPropChange);
    args.revertMap.set(ROOM_ACTION.ROOM_PROP_CHANGE, revertRoomPropChange);

    return { changeRoomProps: actionRoomPropChange };
}
