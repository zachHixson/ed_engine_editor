<script lang="ts">
export const RoomMainEventBus = new Core.Event_Bus();
</script>

<script setup lang="ts">
import Undo_Store, { type iActionStore, useUndoHelpers} from '@/components/common/Undo_Store';
import RoomEditWindow from './RoomEditWindow.vue';
import Properties from './Properties.vue';
import Tool from '@/components/common/Tool.vue';
import HotkeyMap from '@/components/common/HotkeyMap';
import Svg from '@/components/common/Svg.vue';

import {
    ref,
    reactive,
    computed,
    watch,
    nextTick,
    onMounted,
    onBeforeUnmount
} from 'vue';
import { useI18n } from 'vue-i18n';
import { useMainStore } from '@/stores/Main';
import { useRoomEditorStore } from '@/stores/RoomEditor';
import { useGameDataStore } from '@/stores/GameData';
import Core from '@/core';
import type { imEvent } from './RoomEditWindow.vue';

import arrowIcon from '@/assets/arrow_01.svg';
import gridIcon from '@/assets/grid.svg';
import selectMoveIcon from '@/assets/select_move.svg';
import brushAddIcon from '@/assets/brush_add.svg';
import eraserIcon from '@/assets/eraser.svg';
import cameraIcon from '@/assets/camera.svg';
import exitIcon from '@/assets/exit.svg';
import gearIcon from '@/assets/gear.svg';

const { Vector, ROOM_TOOL_TYPE } = Core;
type Vector = Core.Vector;

type MoveProps = {instId?: number, instRef?: Core.Object_Instance, newPos?: Vector, oldPos?: Vector};
type AddProps = {objId?: number, instRefList?: Core.Object_Instance[], pos?: Vector};
type DeleteProps = {instId?: number, instRefList?: Core.Object_Instance[]};
type InstanceChangeProps = {newState: Partial<Core.Object_Instance>, oldState?: object, instRef?: Core.Instance_Base};
type InstanceGroupChangeProps = {add?: boolean, groupName: string, newName?: string, remove?: boolean, oldIdx?: number, instRef: Core.Instance_Base};
type InstanceVarChangeProps = {changeObj: any, instRef?: Core.Object_Instance};
type CameraChangeProps = {newState?: object, oldState?: object};
type ExitAddProps = {exitRef?: Core.Exit, pos: Vector};
type ExitChangeProps = {newState: Partial<Core.Exit>, oldState?: object, exitRef?: Core.Exit};
type ExitDeleteProps = {exitId: number, exitRef?: Core.Exit};
type RoomPropChangeProps = {newState: object, oldState?: object};

//define stores
const { t } = useI18n();
const mainStore = useMainStore();
const roomEditorStore = useRoomEditorStore();
const gameDataStore = useGameDataStore();

const props = defineProps<{
    selectedAsset: Core.Asset_Base;
    selectedRoom: Core.Room;
}>();

//define dom refs
const editWindow = ref<any>();

//define component data
const tools = [
    {
        tool: ROOM_TOOL_TYPE.SELECT_MOVE,
        text: t('room_editor.select_move'),
        icon: selectMoveIcon,
    },
    {
        tool: ROOM_TOOL_TYPE.ADD_BRUSH,
        text: t('room_editor.add_brush'),
        icon: brushAddIcon,
    },
    {
        tool: ROOM_TOOL_TYPE.ERASER,
        text: t('room_editor.eraser'),
        icon: eraserIcon,
    },
    {
        tool: ROOM_TOOL_TYPE.CAMERA,
        text: t('room_editor.camera'),
        icon: cameraIcon,
    },
    {
        tool: ROOM_TOOL_TYPE.EXIT,
        text: t('room_editor.exit'),
        icon: exitIcon,
    },
    {
        tool: ROOM_TOOL_TYPE.ROOM_PROPERTIES,
        text: t('room_editor.room_props'),
        icon: gearIcon,
    }
];
const undoStore = reactive(new Undo_Store<iActionStore>(32, false)) as Undo_Store<iActionStore>;
const hotkeyMap = new HotkeyMap();
const hotkeyDown = hotkeyMap.keyDown.bind(hotkeyMap);
const hotkeyUp = hotkeyMap.keyUp.bind(hotkeyMap);
const toolMap = new Map<Core.ROOM_TOOL_TYPE, (mEvent: imEvent)=>void>();
const actionMap = new Map<Core.ROOM_ACTION, (data?: any | object, commit?: boolean)=>void>();
const revertMap = new Map<Core.ROOM_ACTION, (data?: any | object, commit?: boolean)=>void>();
const mouse = reactive({
    down: false,
    wpLastDown: new Vector(0, 0),
    downOnSelection: false,
    newSelection: false,
    cellCache: new Array<Vector>(),
    inWindow: false,
});
const editorSelection = ref<Core.Object_Instance | Core.Exit | null>();

//computed properties
const propertiesOpen = computed<boolean>({
    get(): boolean {
        return roomEditorStore.getPropPanelState;
    },
    set(newVal: boolean): void {
        roomEditorStore.setPropPanelState(newVal);
    }
});
const isRoomSelected = computed<boolean>(()=>props.selectedRoom != null);
const cssBG = computed<string>(()=>{
    const color =  props.selectedRoom?.bgColor.toHex() ?? '#FFFFFF'
    return 'background:' + color;
});
const isInputActive = computed<boolean>(()=>mainStore.getInputActive);
const undoLength = computed<number>(()=>undoStore.undoLength);
const redoLength = computed<number>(()=>undoStore.redoLength);

//watchers
watch(()=>props.selectedRoom, (newRoom, oldRoom)=>{
    if (newRoom && oldRoom && newRoom.id != oldRoom.id){
        editorSelection.value = null;
    }
});
watch(isInputActive, (newVal: boolean)=>hotkeyMap.enabled = !newVal && mouse.inWindow);
watch(()=>mouse.inWindow, (newVal)=>hotkeyMap.enabled = newVal && !isInputActive.value);

//lifecycle
onMounted(()=>{
    window.addEventListener('keydown', hotkeyDown as EventListener);
    window.addEventListener('keyup', hotkeyUp as EventListener);

    resize();
    bindHotkeys();
    bindTools();
    bindActions();
    bindReversions();
});

onBeforeUnmount(()=>{
    roomEditorStore.setPropPanelState(propertiesOpen.value);

    window.removeEventListener('keydown', hotkeyDown as (e: Event)=>void);
    window.removeEventListener('keydown', hotkeyUp as (e: Event)=>void);
});

//Methods
const { stepForward, stepBackward } = useUndoHelpers(undoStore, actionMap, revertMap);

function bindHotkeys(): void {
    const deleteEntity = () => {
        const type = editorSelection.value?.TYPE;
        const id = editorSelection.value?.id;

        if (type == Core.INSTANCE_TYPE.INSTANCE){
            actionDelete({instId: id});
        }
        else if (type == Core.INSTANCE_TYPE.EXIT){
            actionExitDelete({exitId: id!});
        }
    }

    hotkeyMap.bindKey(['s'], toolClicked, [ROOM_TOOL_TYPE.SELECT_MOVE]);
    hotkeyMap.bindKey(['b'], toolClicked, [ROOM_TOOL_TYPE.ADD_BRUSH]);
    hotkeyMap.bindKey(['e'], toolClicked, [ROOM_TOOL_TYPE.ERASER]);
    hotkeyMap.bindKey(['c'], toolClicked, [ROOM_TOOL_TYPE.CAMERA]);
    hotkeyMap.bindKey(['x'], toolClicked, [ROOM_TOOL_TYPE.EXIT]);
    hotkeyMap.bindKey(['r'], toolClicked, [ROOM_TOOL_TYPE.ROOM_PROPERTIES]);
    hotkeyMap.bindKey(['g'], ()=>{roomEditorStore.setGridState(!roomEditorStore.getGridState)});
    hotkeyMap.bindKey(['n'], ()=>{propertiesOpen.value = !propertiesOpen.value; resize()});
    hotkeyMap.bindKey(['delete'], deleteEntity);
    hotkeyMap.bindKey(['backspace'], deleteEntity);
}

function bindTools(): void {
    toolMap.set(ROOM_TOOL_TYPE.SELECT_MOVE, toolSelectMove);
    toolMap.set(ROOM_TOOL_TYPE.ADD_BRUSH, toolAddBrush);
    toolMap.set(ROOM_TOOL_TYPE.ERASER, toolEraser);
    toolMap.set(ROOM_TOOL_TYPE.EXIT, toolExit);
    toolMap.set(ROOM_TOOL_TYPE.CAMERA, toolCamera);
}

function bindActions(): void {
    actionMap.set(Core.ROOM_ACTION.MOVE, actionMove);
    actionMap.set(Core.ROOM_ACTION.ADD, actionAdd);
    actionMap.set(Core.ROOM_ACTION.DELETE, actionDelete);
    actionMap.set(Core.ROOM_ACTION.INSTANCE_CHANGE, actionInstanceChange);
    actionMap.set(Core.ROOM_ACTION.INSTANCE_GROUP_CHANGE, actionInstanceGroupChange);
    actionMap.set(Core.ROOM_ACTION.INSTANCE_VAR_CHANGE, actionInstanceVarChange);
    actionMap.set(Core.ROOM_ACTION.EXIT_ADD, actionExitAdd);
    actionMap.set(Core.ROOM_ACTION.EXIT_CHANGE, actionExitChange);
    actionMap.set(Core.ROOM_ACTION.EXIT_DELETE, actionExitDelete);
    actionMap.set(Core.ROOM_ACTION.CAMERA_CHANGE, actionCameraChange);
    actionMap.set(Core.ROOM_ACTION.ROOM_PROP_CHANGE, actionRoomPropChange);
}

function bindReversions(): void {
    revertMap.set(Core.ROOM_ACTION.MOVE, revertMove);
    revertMap.set(Core.ROOM_ACTION.ADD, revertAdd);
    revertMap.set(Core.ROOM_ACTION.DELETE, revertDelete);
    revertMap.set(Core.ROOM_ACTION.INSTANCE_CHANGE, revertInstanceChange);
    revertMap.set(Core.ROOM_ACTION.INSTANCE_GROUP_CHANGE, revertInstanceGroupChange);
    revertMap.set(Core.ROOM_ACTION.INSTANCE_VAR_CHANGE, revertInstanceVarChange);
    revertMap.set(Core.ROOM_ACTION.EXIT_ADD, revertExitAdd);
    revertMap.set(Core.ROOM_ACTION.EXIT_CHANGE, revertExitChange);
    revertMap.set(Core.ROOM_ACTION.EXIT_DELETE, revertExitDelete);
    revertMap.set(Core.ROOM_ACTION.CAMERA_CHANGE, revertCameraChange);
    revertMap.set(Core.ROOM_ACTION.ROOM_PROP_CHANGE, revertRoomPropChange);
}

function resize(): void {
    nextTick(()=>{
        RoomMainEventBus.emit('resized');
    });
}

function bgColorChanged(): void {
    RoomMainEventBus.emit('bgColorChanged');
}

function toolClicked(tool: Core.ROOM_TOOL_TYPE): void {
    roomEditorStore.setSelectedTool(tool);
    roomEditorStore.setSelectedNavTool(null);
}

function selectInstanceByPos(pos: Vector): void {
    const nearbyInst = props.selectedRoom.getInstancesInRadius(pos, 0);

    if (nearbyInst.length > 0){
        const instInCell = [];
        let selectedInListIdx = -1;

        //get instances in same cell
        for (let i = 0; i < nearbyInst.length; i++){
            if (pos.equalTo(nearbyInst[i].pos)){
                instInCell.push(nearbyInst[i]);
            }
        }

        //search instances in cell for selected instance
        for (let i = 0; i < instInCell.length && selectedInListIdx < 0; i++){
            if (editorSelection.value?.id == instInCell[i].id){
                selectedInListIdx = i;
            }
        }

        //if selected instance is in current cell, then select next item in cell
        if (selectedInListIdx >= 0){
            editorSelection.value = instInCell[++selectedInListIdx % instInCell.length];
        }
        else{
            editorSelection.value = instInCell[0];
        }
    }
    else{
        editorSelection.value = null;
    }
}

function mouseEvent(mEvent: imEvent): void {
    const toolScript = toolMap.get(roomEditorStore.getSelectedTool!);

    if (mEvent.type == Core.MOUSE_EVENT.DOWN){
        mouse.down = true;
        mouse.wpLastDown.copy(mEvent.worldCell);
    }
    else if (mEvent.type == Core.MOUSE_EVENT.UP){
        mouse.down = false;
    }
    
    if (toolScript){
        toolScript(mEvent);
    }
}

function toolSelectMove(mEvent: imEvent): void {
    switch(mEvent.type){
        case Core.MOUSE_EVENT.DOWN:
            if (editorSelection.value == null){
                selectInstanceByPos(mEvent.worldCell);
                mouse.newSelection = true;
            }
            else if (editorSelection.value.pos.equalTo(mEvent.worldCell)){
                mouse.downOnSelection = true;
                mouse.cellCache.push(mEvent.worldCell.clone());
            }
            break;
        case Core.MOUSE_EVENT.MOVE:
            if (
                mouse.down &&
                mouse.downOnSelection &&
                !mouse.cellCache[0].equalTo(mEvent.worldCell)
            ){
                actionMove({instRef: editorSelection.value as Core.Object_Instance, newPos: mEvent.worldCell}, false);
                mouse.cellCache[0].copy(mEvent.worldCell);
            }
            break;
        case Core.MOUSE_EVENT.UP:
            if (mEvent.worldCell.equalTo(mouse.wpLastDown) && !mouse.newSelection){
                selectInstanceByPos(mEvent.worldCell);
            }

            if (undoStore.cache.get('move_start')){
                actionMove({}, true);
            }

            mouse.downOnSelection = false;
            mouse.newSelection = false;
            mouse.cellCache = [];
            break;
    }
}

function toolAddBrush(mEvent: imEvent): void {
    switch(mEvent.type){
        case Core.MOUSE_EVENT.MOVE:
        case Core.MOUSE_EVENT.DOWN:
            let hasVisited = false;

            //check if cell has already been visited
            for (let i = 0; i < mouse.cellCache.length; i++){
                hasVisited ||= mouse.cellCache[i].equalTo(mEvent.worldCell);
            }

            if (!hasVisited && mouse.down){
                if (mouse.down && props.selectedAsset?.category_ID == Core.CATEGORY_ID.OBJECT){
                    actionAdd({objId: props.selectedAsset.id, pos: mEvent.worldCell}, false);
                }
                
                mouse.cellCache.push(mEvent.worldCell.clone());
            }

            break;
        case Core.MOUSE_EVENT.UP:
            actionAdd({}, true);
            mouse.cellCache = [];
            break;
    }
}

function toolEraser(mEvent: imEvent): void {
    switch(mEvent.type){
        case Core.MOUSE_EVENT.MOVE:
        case Core.MOUSE_EVENT.DOWN:
            let removedFromCell = false;

            if (mouse.cellCache.length > 0){
                removedFromCell ||= mouse.cellCache[0].equalTo(mEvent.worldCell);
            }

            if (!removedFromCell && mouse.down){
                let instances = props.selectedRoom.getInstancesInRadius(mEvent.worldCell, 0);
                instances = instances.filter((i) => i.pos.equalTo(mEvent.worldCell));
                instances.sort((a, b) => a.zDepth - b.zDepth);

                if (instances.length > 0){
                    actionDelete({instId: instances[0].id}, false);
                }

                mouse.cellCache[0] = mEvent.worldCell;
            }
            break;
        case Core.MOUSE_EVENT.UP:
            actionDelete({}, true);
    }
}

function toolCamera(mEvent: imEvent): void {
    switch(mEvent.type){
        case Core.MOUSE_EVENT.MOVE:
        case Core.MOUSE_EVENT.DOWN:
            if (mouse.down){
                actionCameraChange({newState: {pos: mEvent.worldCell.addScalar(8)}});
            }
            break;
    }
}

function toolExit(mEvent: imEvent): void {
    if (mEvent.type == Core.MOUSE_EVENT.DOWN){
        const exitAtCursor = props.selectedRoom.getExitsAtPosition(mEvent.worldCell)
            .find((e: Core.Exit) => e.pos.equalTo(mEvent.worldCell));

        if (exitAtCursor){
            editorSelection.value = exitAtCursor;
        }
        else{
            editorSelection.value = actionExitAdd({pos: mEvent.worldCell});
        }
    }
}

function toggleGrid(): void {
    const newState = !roomEditorStore.getGridState;
    roomEditorStore.setGridState(newState);
    RoomMainEventBus.emit('grid-state-changed', newState);
}

function actionMove({instId, instRef, newPos}: MoveProps, makeCommit = true): void {
    if (makeCommit){
        const {instRef, oldPos} = undoStore.cache.get('move_start');
        const data = {instId: instRef.id, instRef, newPos: instRef.pos.clone(), oldPos} satisfies MoveProps;
        undoStore.commit({action: Core.ROOM_ACTION.MOVE, data});
        undoStore.cache.delete('move_start');
        return;
    }

    if (!instRef){
        instRef = props.selectedRoom.getInstanceById(instId!)!;
    }

    if (!undoStore.cache.get('move_start')){
        undoStore.cache.set('move_start', {instRef, oldPos: instRef.pos.clone()});
    }

    props.selectedRoom.setInstancePosition(instRef, newPos!);
    RoomMainEventBus.emit('instance-changed', instRef);
}

function actionAdd({objId, instRefList = [], pos}: AddProps, makeCommit = true): void {
    const object = gameDataStore.getAllObjects.find((o) => o.id == objId);
    const cacheList = undoStore.cache.get('add_list');
    let newInst;

    if (makeCommit){
        const data = {instRefList: cacheList};
        undoStore.commit({action: Core.ROOM_ACTION.ADD, data});
        undoStore.cache.delete('add_list');
        return;
    }

    if (objId){
        newInst = new Core.Object_Instance(props.selectedRoom.curInstId, pos!, object!);
        instRefList.push(newInst);
    }

    for (let i = 0; i < instRefList.length; i++){
        props.selectedRoom.addInstance(instRefList[i]);
    }

    RoomMainEventBus.emit('instance-added', newInst);

    if (cacheList){
        cacheList.push(newInst);
    }
    else if (newInst){
        undoStore.cache.set('add_list', [newInst]);
    }
}

function actionDelete({instId, instRefList = []}: DeleteProps, makeCommit = true): void {
    const cacheList = undoStore.cache.get('delete_list');
    const singleInstance = !cacheList && makeCommit;
    let instRef;

    if (makeCommit && !singleInstance){
        const data = {instRefList: cacheList};
        undoStore.commit({action: Core.ROOM_ACTION.DELETE, data})
        undoStore.cache.delete('delete_list');
        return;
    }

    if (instId != undefined){
        instRef = props.selectedRoom.removeInstance(instId);

        if (instRef == editorSelection.value){
            editorSelection.value = null;
        }
    }

    for (let i = 0; i < instRefList.length; i++){
        let inst = instRefList[i]
        props.selectedRoom.removeInstance(inst.id);
    }

    RoomMainEventBus.emit('instance-removed', instRef);

    if (cacheList){
        cacheList.push(instRef);
    }
    else if (instRef){
        undoStore.cache.set('delete_list', [instRef]);
    }

    if (singleInstance){
        actionDelete({}, true);
    }
}

function actionInstanceChange({newState, instRef}: InstanceChangeProps, makeCommit = true): void {
    const curInstance = (instRef ?? editorSelection.value)!;
    const oldState = Object.assign({}, curInstance);

    Object.assign(curInstance, newState);
    
    RoomMainEventBus.emit('instance-changed', curInstance);

    if (makeCommit){
        let data = {newState, oldState, instRef: curInstance} satisfies InstanceChangeProps;
        undoStore.commit({action: Core.ROOM_ACTION.INSTANCE_CHANGE, data});
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
        groups = editorSelection.value!.groups;
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
        const data = {add, groupName, newName, remove, oldIdx, instRef: editorSelection.value!} satisfies InstanceGroupChangeProps;
        undoStore.commit({action: Core.ROOM_ACTION.INSTANCE_GROUP_CHANGE, data});
    }
}

function actionInstanceVarChange({changeObj, instRef}: InstanceVarChangeProps, makeCommit = true): void {
    //
}

function actionCameraChange({newState}: CameraChangeProps, makeCommit = true): void {
    const oldState = Object.assign({}, props.selectedRoom.camera);

    Object.assign(props.selectedRoom.camera, newState);
    
    RoomMainEventBus.emit('camera-changed');

    if (makeCommit){
        const data = {newState, oldState} satisfies CameraChangeProps;
        undoStore.commit({action: Core.ROOM_ACTION.CAMERA_CHANGE, data});
    }
}

function actionExitAdd({exitRef, pos}: ExitAddProps, makeCommit = true): Core.Exit {
    const newExit = exitRef ?? new Core.Exit(props.selectedRoom.curExitId, pos);
    const newExitName = t('room_editor.new_exit_prefix') + newExit.id;
    props.selectedRoom.addExit(newExit);

    newExit.name = newExitName;
    
    RoomMainEventBus.emit('instance-added', newExit);

    if (makeCommit){
        const data = {exitRef: newExit, pos: pos.clone()} satisfies ExitAddProps;
        undoStore.commit({action: Core.ROOM_ACTION.EXIT_ADD, data});
    }

    return newExit;
}

function actionExitChange({newState}: ExitChangeProps, makeCommit = true): void {
    const selected = editorSelection.value! as Core.Exit;
    const oldState = Object.assign({}, editorSelection.value);

    Object.assign(selected, newState);

    RoomMainEventBus.emit('instance-changed', editorSelection);

    if (makeCommit){
        const data = {newState, oldState, exitRef: selected} satisfies ExitChangeProps;
        undoStore.commit({action: Core.ROOM_ACTION.EXIT_CHANGE, data});
    }
}

function actionExitDelete({exitId}: ExitDeleteProps, makeCommit = true): void {
    const exitRef = props.selectedRoom.removeExit(exitId)!;
    editorSelection.value = null;

    RoomMainEventBus.emit('instance-removed', exitRef);

    if (makeCommit){
        let data = {exitId, exitRef} satisfies ExitDeleteProps;
        undoStore.commit({action: Core.ROOM_ACTION.EXIT_DELETE, data});
    }
}

function actionRoomPropChange({newState}: RoomPropChangeProps, makeCommit = true): void {
    const oldState = Object.assign({}, props.selectedRoom);

    Object.assign(props.selectedRoom, newState);

    if (!oldState.bgColor.compare(props.selectedRoom.bgColor)){
        bgColorChanged();
    }

    if (makeCommit){
        let data = {newState, oldState} satisfies RoomPropChangeProps;
        undoStore.commit({action: Core.ROOM_ACTION.ROOM_PROP_CHANGE, data});
    }
}

function revertMove({instRef, oldPos}: MoveProps): void {
    props.selectedRoom.setInstancePosition(instRef!, oldPos!);
    RoomMainEventBus.emit('instance-changed', instRef);
}

function revertAdd({instRefList = []}: AddProps): void {
    for (let i = 0; i < instRefList.length; i++){
        const instRef = instRefList[i];

        if (instRef.id == editorSelection.value?.id){
            editorSelection.value = null;
        }

        props.selectedRoom.removeInstance(instRef.id);
        RoomMainEventBus.emit('instance-removed', instRef);
    }
}

function revertDelete({instRefList = []}: DeleteProps): void {
    for (let i = 0; i < instRefList.length; i++){
        const instRef = instRefList[i];
        props.selectedRoom.addInstance(instRef);
        RoomMainEventBus.emit('instance-added', instRef);
    }
}

function revertInstanceChange({oldState, instRef}: InstanceChangeProps): void {
    Object.assign(instRef!, oldState);
    RoomMainEventBus.emit('instance-changed', instRef);
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

function revertInstanceVarChange({changeObj, instRef}: InstanceVarChangeProps): void {
    //
}

function revertCameraChange({oldState}: CameraChangeProps): void {
    Object.assign(props.selectedRoom.camera, oldState);
    RoomMainEventBus.emit('camera-changed');
}

function revertExitAdd({exitRef}: ExitAddProps): void {
    if (exitRef!.id == editorSelection.value?.id){
        editorSelection.value = null;
    }

    props.selectedRoom.removeExit(exitRef!.id);
    RoomMainEventBus.emit('instance-changed', exitRef);
}

function revertExitDelete({exitRef}: ExitDeleteProps): void {
    const exit = new Core.Exit(-1);
    Object.assign(exit, exitRef);
    props.selectedRoom.addExit(exit);
    RoomMainEventBus.emit('instance-changed', exitRef);
}

function revertExitChange({oldState, exitRef}: ExitChangeProps): void {
    Object.assign(exitRef!, oldState);
    RoomMainEventBus.emit('instance-changed', exitRef);
}

function revertRoomPropChange({oldState}: RoomPropChangeProps): void {
    const oldBG = props.selectedRoom.bgColor;

    Object.assign(props.selectedRoom, oldState);

    if (!oldBG.compare(props.selectedRoom.bgColor)){
        bgColorChanged();
    }
}
</script>

<template>
    <div class="roomMain" :style="cssBG">
        <div v-if="selectedRoom" class="toolPanel">
            <Tool
                :key="tool.tool"
                v-for="tool in tools"
                :icon="tool.icon"
                :name="tool.text"
                :tool="tool.tool"
                :curSelection="roomEditorStore.getSelectedTool"
                @tool-clicked="toolClicked"/>
            <div class="toolSpacer"></div>
            <Tool
                :tool="0"
                :icon="gridIcon"
                :name="$t('room_editor.toggle_grid')"
                :toggled="roomEditorStore.getGridState"
                @tool-clicked="toggleGrid"/>
        </div>
        <RoomEditWindow
            v-if="isRoomSelected"
            ref="editWindow"
            class="editWindow"
            :selectedRoom="selectedRoom"
            :editorSelection="editorSelection!"
            :undoLength="undoLength"
            :redoLength="redoLength"
            @mouse-event="mouseEvent"
            @undo="stepBackward"
            @redo="stepForward"
            @mouseenter.native="mouse.inWindow = true"
            @mouseleave.native="mouse.inWindow = false"/>
        <div v-else class="noRoomSelected">{{$t('room_editor.no_room_selected')}}</div>
        <div v-if="selectedRoom" class="propertyPanel" :class="{propertiesClosed : !propertiesOpen}">
            <div class="resizeBtnWrapper">
                <button class="resizeBtn" @click="propertiesOpen = !propertiesOpen; resize()">
                    <Svg v-show="propertiesOpen" :src="arrowIcon" style="transform: rotate(90deg)"></Svg>
                    <Svg v-show="!propertiesOpen" :src="gearIcon" style="transform: rotate(-90deg)"></Svg>
                </button>
            </div>
            <div v-show="propertiesOpen" class="propertiesContents">
                <Properties
                    ref="props"
                    :selectedTool="roomEditorStore.getSelectedTool"
                    :selectedEntity="editorSelection!"
                    :camera="selectedRoom.camera"
                    :room="selectedRoom"
                    @inst-prop-set="actionInstanceChange({newState: $event as object})"
                    @inst-group-changed="actionInstanceGroupChange($event)"
                    @inst-var-changed="actionInstanceVarChange({changeObj: $event})"
                    @cam-prop-set="actionCameraChange({newState: $event})"
                    @exit-prop-set="actionExitChange({newState: ($event as Partial<Core.Exit>)})"
                    @exit-delete="actionExitDelete({exitId: ($event.id as number)})"
                    @room-prop-set="actionRoomPropChange({newState: $event})"/>
            </div>
        </div>
    </div>
</template>

<style scoped>
.roomMain{
    display: flex;
    flex-direction: row;
    justify-content: space-between;
    align-items: center;
    width: 100%;
    height: 100%;
    overflow: hidden;
}

.toolPanel{
    position: relative;
    display: flex;
    flex-direction: column;
    width: auto;
    height: 95%;
    padding: 0;
    margin: 0;
    background: var(--tool-panel-bg);
    border: 2px solid var(--border);
    border-left: none;
    border-radius: 0px var(--corner-radius) var(--corner-radius) 0px;
}

.propertyPanel{
    position: relative;
    display: flex;
    flex-direction: row;
    height: 95%;
    background: var(--tool-panel-bg);
    border: 2px solid var(--border);
    border-right: none;
    border-radius: var(--corner-radius) 0px 0px var(--corner-radius);
    z-index: 5;
}

.propertiesContents{
    width: 250px;
}

.propertiesClosed{
    border: none;
}

.resizeBtnWrapper{
    position: absolute;
    left: 0;
    top: 50%;
    transform: translateY(-50%);
}

.resizeBtn{
    position: relative;
    left: -100%;
    display: flex;
    justify-content: center;
    align-items: center;
    align-self: center;
    width: 30px;
    height: 70px;
    background: var(--tool-panel-bg);
    border: 2px solid var(--border);
    border-right: none;
    border-radius: var(--corner-radius) 0px 0px var(--corner-radius);
}

.resizeBtn > *{
    width: 100%;
    height: 100%;
}

.toolSpacer{
    width: 100%;
    height: 10px;
}

.noRoomSelected{
    flex-grow: 1;
    display: flex;
    justify-content: center;
    align-items: center;
}
</style>