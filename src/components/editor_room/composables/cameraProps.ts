import Tool_Base from './Tool_Base';
import type { iActionArguments } from '../RoomMain.vue';
import type { imEvent } from '../RoomEditWindow.vue';
import { RoomMainEventBus } from '../RoomMain.vue';
import Core from '@/core';

type CameraChangeProps = {newState?: object, oldState?: object};

export function useCameraProps(args: iActionArguments){
    
    class Camera_Tool extends Tool_Base {
        private _down = false;

        override mouseDown(mEvent: imEvent): void {
            this._down = true;
            this.mouseMove(mEvent);
        }

        override mouseMove(mEvent: imEvent): void {
            if (this._down){
                actionCameraChange({newState: {pos: mEvent.worldCell.addScalar(8)}});
            }
        }

        override mouseUp(mEvent: imEvent): void {
            this._down = false;
        }
    }

    function actionCameraChange({newState}: CameraChangeProps, makeCommit = true): void {
        const oldState = Object.assign({}, args.props.selectedRoom.camera);
    
        Object.assign(args.props.selectedRoom.camera, newState);
        
        RoomMainEventBus.emit('camera-changed');
    
        if (makeCommit){
            const data = {newState, oldState} satisfies CameraChangeProps;
            args.undoStore.commit({action: Core.ROOM_ACTION.CAMERA_CHANGE, data});
        }
    }

    function revertCameraChange({oldState}: CameraChangeProps): void {
        Object.assign(args.props.selectedRoom.camera, oldState);
        RoomMainEventBus.emit('camera-changed');
    }

    args.toolMap.set(Core.ROOM_TOOL_TYPE.CAMERA, Camera_Tool);
    args.actionMap.set(Core.ROOM_ACTION.CAMERA_CHANGE, actionCameraChange);
    args.revertMap.set(Core.ROOM_ACTION.CAMERA_CHANGE, revertCameraChange);

    return { changeCameraProps: actionCameraChange };
}