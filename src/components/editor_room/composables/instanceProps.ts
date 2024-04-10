import type { iActionArguments } from '../RoomMain.vue';
import { RoomMainEventBus } from '../RoomMain.vue';
import Core from '@/core';

type InstanceChangeProps = {newState: Partial<Core.Instance_Base>, oldState?: object, instRef?: Core.Instance_Base};
type InstanceGroupChangeProps = {add?: boolean, groupName: string, newName?: string, remove?: boolean, oldIdx?: number, instRef: Core.Instance_Object};

export function useInstanceProps(args: iActionArguments){
    function actionInstanceChange({newState, instRef}: InstanceChangeProps, makeCommit = true): void {
        const curInstance = (instRef ?? args.editorSelection.value)! as Core.Instance_Base;
        const oldState = Object.assign({}, curInstance);
    
        Object.assign(curInstance, newState);
        
        RoomMainEventBus.onInstanceChanged.emit(curInstance);
    
        if (makeCommit){
            let data = {newState, oldState, instRef: curInstance} satisfies InstanceChangeProps;
            args.undoStore.commit({action: Core.ROOM_ACTION.INSTANCE_CHANGE, data});
        }
    }
    
    function actionInstanceGroupChange(
        {add, groupName, newName, remove, oldIdx, instRef}: InstanceGroupChangeProps, makeCommit = true
    ): void{
        let groups;
    
        if (instRef){
            groups = instRef.groups;
        }
        else{
            groups = args.editorSelection.value!.groups;
        }
    
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
            const data = {add, groupName, newName, remove, oldIdx, instRef: args.editorSelection.value! as Core.Instance_Object} satisfies InstanceGroupChangeProps;
            args.undoStore.commit({action: Core.ROOM_ACTION.INSTANCE_GROUP_CHANGE, data});
        }
    }

    function revertInstanceChange({oldState, instRef}: InstanceChangeProps): void {
        Object.assign(instRef!, oldState);
        RoomMainEventBus.onInstanceChanged.emit(instRef!);
    }
    
    function revertInstanceGroupChange({add, groupName, newName, remove, oldIdx, instRef}: InstanceGroupChangeProps): void {
        const groups = instRef.groups;
    
        if (add){
            const idx = instRef.groups.indexOf(groupName);
            groups.splice(idx, 1);
        }
        else if (newName){
            const idx = instRef.groups.indexOf(newName);
            groups[idx] = groupName;
        }
        else if (remove){
            groups.splice(oldIdx!, 0, groupName);
        }
    }

    args.actionMap.set(Core.ROOM_ACTION.INSTANCE_CHANGE, actionInstanceChange);
    args.actionMap.set(Core.ROOM_ACTION.INSTANCE_GROUP_CHANGE, actionInstanceGroupChange);
    args.revertMap.set(Core.ROOM_ACTION.INSTANCE_CHANGE, revertInstanceChange);
    args.revertMap.set(Core.ROOM_ACTION.INSTANCE_GROUP_CHANGE, revertInstanceGroupChange);

    return {
        changeInstanceProps: actionInstanceChange,
        changeInstanceGroups: actionInstanceGroupChange,
    }
}