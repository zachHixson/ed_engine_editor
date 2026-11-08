import type { iGroupChangedProps } from '@/components/common/GroupList.vue';
import type { iActionArguments } from '../RoomMain.vue';
import { RoomMainEventBus, ROOM_ACTION } from '../RoomMain.vue';
import Core from '@/core';

export type InstanceChangeProps = { actionType: ROOM_ACTION.INSTANCE_CHANGE, newState: Partial<Core.Instance_Base>, oldState?: object, instRef?: Core.Instance_Base };
export type InstanceGroupChangeProps = { actionType: ROOM_ACTION.INSTANCE_GROUP_CHANGE } & iGroupChangedProps;

export function useInstanceProps(args: iActionArguments){
    function actionInstanceChange(data: Core.ActionCallbackData, makeCommit = true): void {
        const { newState, instRef } = data as InstanceChangeProps;
        const curInstance = (instRef ?? args.editorSelection.value)! as Core.Instance_Base;
        const oldState = Object.assign({}, curInstance);

        Object.assign(curInstance, newState);

        RoomMainEventBus.onInstanceChanged.emit(curInstance);

        if (makeCommit){
            const data = { actionType: ROOM_ACTION.INSTANCE_CHANGE, newState, oldState, instRef: curInstance } as Core.ActionCallbackData;
            args.undoStore.commit(data);
        }
    }

    function actionInstanceGroupChange(data: Core.ActionCallbackData, makeCommit = true): void {
        const { add, groupName, newName, remove, oldIdx, instRef } = data as InstanceGroupChangeProps;
        const curInstRef = instRef ?? args.editorSelection.value;

        let groups: Array<string>;

        if (!curInstRef) {
            throw new Error('No valid instance to get groups from');
        }

        groups = curInstRef.groups;

        if (add){
            groups.push(groupName);
        }
        else if (newName){
            const idx = groups.indexOf(groupName);
            groups[idx] = newName;
        }
        else if (remove){
            const idx = groups.indexOf(groupName);
            groups.splice(idx, 1);
        }

        if (makeCommit){
            const data = { actionType: ROOM_ACTION.INSTANCE_GROUP_CHANGE, add, groupName, newName, remove, oldIdx, instRef: curInstRef } as InstanceGroupChangeProps;
            args.undoStore.commit(data);
        }
    }

    function revertInstanceChange(data: Core.ActionCallbackData): void {
        const { oldState, instRef } = data as InstanceChangeProps;

        Object.assign(instRef!, oldState);
        RoomMainEventBus.onInstanceChanged.emit(instRef!);
    }

    function revertInstanceGroupChange(data: Core.ActionCallbackData): void {
        const { add, groupName, newName, remove, oldIdx, instRef } = data as InstanceGroupChangeProps;

        if (!instRef) {
            throw new Error('No instRef available for reverting InstanceGroupChange');
        }

        const groups = instRef.groups;

        if (add){
            const idx = groups.indexOf(groupName);
            groups.splice(idx, 1);
        }
        else if (newName){
            const idx = groups.indexOf(newName);
            groups[idx] = groupName;
        }
        else if (remove){
            groups.splice(oldIdx!, 0, groupName);
        }
    }

    args.actionMap.set(ROOM_ACTION.INSTANCE_CHANGE, actionInstanceChange);
    args.actionMap.set(ROOM_ACTION.INSTANCE_GROUP_CHANGE, actionInstanceGroupChange);
    args.revertMap.set(ROOM_ACTION.INSTANCE_CHANGE, revertInstanceChange);
    args.revertMap.set(ROOM_ACTION.INSTANCE_GROUP_CHANGE, revertInstanceGroupChange);

    return {
        changeInstanceProps: actionInstanceChange,
        changeInstanceGroups: actionInstanceGroupChange,
    }
}
