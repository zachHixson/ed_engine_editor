import Tool_Base from './Tool_Base';
import type { iActionArguments } from '../RoomMain.vue';
import { RoomMainEventBus } from '../RoomMain.vue';
import Core from '@/core';

type RoomPropChangeProps = {newState: object, oldState?: object};

export function useRoomProps(args: iActionArguments){
    
    class Room_Props extends Tool_Base {}

    function actionRoomPropChange({newState}: RoomPropChangeProps, makeCommit = true): void {
        const oldState = Object.assign({}, args.props.selectedRoom);
    
        Object.assign(args.props.selectedRoom, newState);
    
        const bgColorHasChanged = !oldState.bgColor.compare(args.props.selectedRoom.bgColor);
    
        if (bgColorHasChanged){
            RoomMainEventBus.emit('bgColorChanged');
        }
    
        if (makeCommit){
            const data = {newState, oldState} satisfies RoomPropChangeProps;
    
            if (args.undoStore.cache.has('bg-color')){
                data.oldState.bgColor = args.undoStore.cache.get('bg-color').clone();
            }
    
            args.undoStore.commit({action: Core.ROOM_ACTION.ROOM_PROP_CHANGE, data});
            args.undoStore.cache.delete('bg-color');
        }
        else if(bgColorHasChanged && !args.undoStore.cache.has('bg-color')){
            args.undoStore.cache.set('bg-color', oldState.bgColor);
        }
    }
    
    function revertRoomPropChange({oldState}: RoomPropChangeProps): void {
        const curBG = args.props.selectedRoom.bgColor.clone();
    
        Object.assign(args.props.selectedRoom, oldState);
    
        if (!curBG.compare(args.props.selectedRoom.bgColor)){
            RoomMainEventBus.emit('bgColorChanged');
        }
    }

    args.toolMap.set(Core.ROOM_TOOL_TYPE.ROOM_PROPERTIES, Room_Props);
    args.actionMap.set(Core.ROOM_ACTION.ROOM_PROP_CHANGE, actionRoomPropChange);
    args.revertMap.set(Core.ROOM_ACTION.ROOM_PROP_CHANGE, revertRoomPropChange);

    return { changeRoomProps: actionRoomPropChange };
}