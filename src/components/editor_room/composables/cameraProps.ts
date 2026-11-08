import Tool_Base from './Tool_Base';
import type { iActionArguments } from '../RoomMain.vue';
import type { imEvent } from '../RoomEditWindow.vue';
import { RoomMainEventBus, ROOM_ACTION } from '../RoomMain.vue';
import { ROOM_TOOL_TYPE } from '@/stores/RoomEditor';
import Core from '@/core';

export type CameraChangeProps = {actionType: ROOM_ACTION.CAMERA_CHANGE, newState?: Partial<Core.Camera>, oldState?: Partial<Core.Camera>};

export function useCameraProps(args: iActionArguments){

    class Camera_Tool extends Tool_Base {
        private _down = false;

        override mouseDown(mEvent: imEvent): void {
            this._down = true;
            this.mouseMove(mEvent);
        }

        override mouseMove(mEvent: imEvent): void {
            if (this._down){
                const data = {actionType: ROOM_ACTION.CAMERA_CHANGE, newState: {pos: mEvent.worldCell.addScalar(8)}} as CameraChangeProps;
                actionCameraChange(data, false);
            }
        }

        override mouseUp(): void {
            this._down = false;
            actionCameraChange({actionType: ROOM_ACTION.CAMERA_CHANGE}, true);
        }
    }

    function actionCameraChange(data: Core.ActionCallbackData, makeCommit = true): void {
        const camData = data as CameraChangeProps;
        const oldState = Object.assign({}, args.props.selectedRoom.camera);

        if (camData.newState?.pos && !args.undoStore.cache.has('camera-start-pos')){
            args.undoStore.cache.set('camera-start-pos', {pos: args.props.selectedRoom.camera.pos});
        }

        camData.newState ??= Object.assign({}, args.props.selectedRoom.camera);
        Object.assign(args.props.selectedRoom.camera, camData.newState);
        RoomMainEventBus.onCameraChanged.emit();

        if (makeCommit){
            const cacheGet = (args.undoStore.cache.get('camera-start-pos') ?? oldState) as Partial<Core.Camera>;
            const commitData = {actionType: ROOM_ACTION.CAMERA_CHANGE, newState: camData.newState, oldState: cacheGet} as CameraChangeProps;
            args.undoStore.commit(commitData);
            args.undoStore.cache.delete('camera-start-pos');
        }
    }

    function revertCameraChange(data: Core.ActionCallbackData): void {
        const { oldState } = data as CameraChangeProps;
        Object.assign(args.props.selectedRoom.camera, oldState);
        RoomMainEventBus.onCameraChanged.emit();
    }

    args.toolMap.set(ROOM_TOOL_TYPE.CAMERA, Camera_Tool);
    args.actionMap.set(ROOM_ACTION.CAMERA_CHANGE, actionCameraChange);
    args.revertMap.set(ROOM_ACTION.CAMERA_CHANGE, revertCameraChange);

    return { changeCameraProps: actionCameraChange };
}
