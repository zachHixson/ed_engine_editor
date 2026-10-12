import type { iGroupChangedProps } from '@/components/common/GroupList.vue';
import type { iActionArguments } from '../RoomMain.vue';
import { RoomMainEventBus, ROOM_ACTION } from '../RoomMain.vue';
import Core from '@/core';

type InstanceChangeProps = {newState: Partial<Core.Instance_Base>, oldState?: object, instRef?: Core.Instance_Base};

export function useInstanceProps(args: iActionArguments){
    function actionInstanceChange({newState, instRef}: InstanceChangeProps, makeCommit = true): void {
        const curInstance = (instRef ?? args.editorSelection.value)! as Core.Instance_Base;
        const oldState = Object.assign({}, curInstance);

        Object.assign(curInstance, newState);

        RoomMainEventBus.onInstanceChanged.emit(curInstance);

        if (makeCommit){
            const data: InstanceChangeProps = {newState, oldState, instRef: curInstance};
            args.undoStore.commit({action: ROOM_ACTION.INSTANCE_CHANGE, data});
        }
    }

    function actionInstanceGroupChange(
        {add, groupName, newName, remove, oldIdx, instRef}: iGroupChangedProps, makeCommit = true
    ): void {
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
            const data: iGroupChangedProps = {add, groupName, newName, remove, oldIdx, instRef: curInstRef};
            args.undoStore.commit({action: ROOM_ACTION.INSTANCE_GROUP_CHANGE, data});
        }
    }

    function revertInstanceChange({oldState, instRef}: InstanceChangeProps): void {
        Object.assign(instRef!, oldState);
        RoomMainEventBus.onInstanceChanged.emit(instRef!);
    }

    function revertInstanceGroupChange({add, groupName, newName, remove, oldIdx, instRef}: iGroupChangedProps): void {
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
