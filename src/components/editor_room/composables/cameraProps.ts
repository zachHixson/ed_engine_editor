import Tool_Base from './Tool_Base';
import type { iActionArguments } from '../RoomMain.vue';
import type { imEvent } from '../RoomEditWindow.vue';
import { RoomMainEventBus } from '../RoomMain.vue';
import Core from '@/core';

type CameraChangeProps = {newState?: Partial<Core.Camera>, oldState?: Partial<Core.Camera>};

export function useCameraProps(args: iActionArguments){
    
    class Camera_Tool extends Tool_Base {
        private _down = false;

        override mouseDown(mEvent: imEvent): void {
            this._down = true;
            this.mouseMove(mEvent);
        }

        override mouseMove(mEvent: imEvent): void {
            if (this._down){
                actionCameraChange({newState: {pos: mEvent.worldCell.addScalar(8)}}, false);
            }
        }

        override mouseUp(): void {
            this._down = false;
            actionCameraChange({}, true);
        }
    }

    function actionCameraChange({newState}: CameraChangeProps, makeCommit = true): void {
        const oldState = Object.assign({}, args.props.selectedRoom.camera);

        if (newState?.pos && !args.undoStore.cache.has('camera-start-pos')){
            args.undoStore.cache.set('camera-start-pos', {pos: args.props.selectedRoom.camera.pos});
        }

        newState ??= Object.assign({}, args.props.selectedRoom.camera);
        Object.assign(args.props.selectedRoom.camera, newState);
        RoomMainEventBus.emit('camera-changed');
    
        if (makeCommit){
            const cacheGet = (args.undoStore.cache.get('camera-start-pos') ?? oldState) as Partial<Core.Camera>;
            const data = {newState, oldState: cacheGet} satisfies CameraChangeProps;
            args.undoStore.commit({action: Core.ROOM_ACTION.CAMERA_CHANGE, data});
            args.undoStore.cache.delete('camera-start-pos');
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