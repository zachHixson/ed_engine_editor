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
import VueCanvas from '@/components/common/VueCanvas.vue';
import { AppEventBus } from '@/App.vue';

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

const { Vector, Instance_Base, ROOM_TOOL_TYPE } = Core;
type Vector = Core.Vector;
type Instance_Base = Core.Instance_Base;

type MoveProps = {instId?: number, instRef?: Instance_Base, newPos?: Vector, oldPos?: Vector};
type AddProps = {sourceId?: number, instRefList?: Instance_Base[], pos?: Vector};
type DeleteProps = {instId?: number, instRefList?: Instance_Base[]};
type InstanceChangeProps = {newState: Partial<Core.Instance_Base>, oldState?: object, instRef?: Instance_Base};
type InstanceGroupChangeProps = {add?: boolean, groupName: string, newName?: string, remove?: boolean, oldIdx?: number, instRef: Core.Instance_Object};
type InstanceVarChangeProps = {changeObj: any, instRef?: Core.Instance_Object};
type CameraChangeProps = {newState?: object, oldState?: object};
type ExitAddProps = {exitRef?: Core.Instance_Exit, pos: Vector};
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
const overlapBox = ref<HTMLDivElement>();

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
const editorSelection = ref<Instance_Base | Core.Instance_Exit | null>();
const overlappingInstances = ref<Instance_Base[]>([]);

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
    newRoom.initSpacialData();

    if (newRoom && oldRoom && newRoom.id != oldRoom.id){
        editorSelection.value = null;
        oldRoom.clearSpacialData();
    }
});
watch(isInputActive, (newVal: boolean)=>hotkeyMap.enabled = !newVal && mouse.inWindow);
watch(()=>mouse.inWindow, (newVal)=>hotkeyMap.enabled = newVal && !isInputActive.value);

//lifecycle
onMounted(()=>{
    window.addEventListener('keydown', hotkeyDown as EventListener);
    window.addEventListener('keyup', hotkeyUp as EventListener);
    AppEventBus.addEventListener('asset-deleted', refreshRoom as EventListener);

    resize();
    bindHotkeys();
    bindTools();
    bindActions();
    bindReversions();

    if (props.selectedRoom){
        props.selectedRoom.initSpacialData();
    }
});

onBeforeUnmount(()=>{
    roomEditorStore.setPropPanelState(propertiesOpen.value);

    window.removeEventListener('keydown', hotkeyDown as (e: Event)=>void);
    window.removeEventListener('keydown', hotkeyUp as (e: Event)=>void);

    props.selectedRoom.clearSpacialData();
});

//Methods
const { stepForward, stepBackward } = useUndoHelpers(undoStore, actionMap, revertMap);

function bindHotkeys(): void {
    const deleteInstance = () => {
        const id = editorSelection.value?.id;
        actionDelete({instId: id});
    }

    hotkeyMap.bindKey(['s'], toolClicked, [ROOM_TOOL_TYPE.SELECT_MOVE]);
    hotkeyMap.bindKey(['b'], toolClicked, [ROOM_TOOL_TYPE.ADD_BRUSH]);
    hotkeyMap.bindKey(['e'], toolClicked, [ROOM_TOOL_TYPE.ERASER]);
    hotkeyMap.bindKey(['c'], toolClicked, [ROOM_TOOL_TYPE.CAMERA]);
    hotkeyMap.bindKey(['x'], toolClicked, [ROOM_TOOL_TYPE.EXIT]);
    hotkeyMap.bindKey(['r'], toolClicked, [ROOM_TOOL_TYPE.ROOM_PROPERTIES]);
    hotkeyMap.bindKey(['g'], ()=>{roomEditorStore.setGridState(!roomEditorStore.getGridState)});
    hotkeyMap.bindKey(['n'], ()=>{propertiesOpen.value = !propertiesOpen.value; resize()});
    hotkeyMap.bindKey(['delete'], deleteInstance);
    hotkeyMap.bindKey(['backspace'], deleteInstance);
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
    actionMap.set(Core.ROOM_ACTION.EXIT_CHANGE, actionInstanceChange);
    actionMap.set(Core.ROOM_ACTION.EXIT_DELETE, actionDelete);
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
    revertMap.set(Core.ROOM_ACTION.EXIT_CHANGE, revertInstanceChange);
    revertMap.set(Core.ROOM_ACTION.EXIT_DELETE, revertDelete);
    revertMap.set(Core.ROOM_ACTION.CAMERA_CHANGE, revertCameraChange);
    revertMap.set(Core.ROOM_ACTION.ROOM_PROP_CHANGE, revertRoomPropChange);
}

function refreshRoom(): void {
    props.selectedRoom.clearSpacialData();
    props.selectedRoom.initSpacialData();
    RoomMainEventBus.emit('room-changed');
}

function resize(): void {
    nextTick(()=>{
        RoomMainEventBus.emit('resize');
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
    const nearbyInst = props.selectedRoom
        .getInstancesInRadius(pos, 0)
        .filter(instance => instance.pos.equalTo(pos))
        .sort((a, b) => b.zDepth - a.zDepth);

    if (nearbyInst.length > 0){
        editorSelection.value = nearbyInst[0];
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
                actionMove({instRef: editorSelection.value as Core.Instance_Object, newPos: mEvent.worldCell}, false);
                mouse.cellCache[0].copy(mEvent.worldCell);
            }
            break;
        case Core.MOUSE_EVENT.DOUBLE_CLICK:
            const instances = props.selectedRoom.getInstancesInRadius(mEvent.worldCell, 0)
                .filter(instance => instance.pos.equalTo(mEvent.worldCell));

            if (instances.length > 0){
                openOverlapBox(instances, mEvent.canvasPos);
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
                actionAdd({sourceId: props.selectedAsset.id, pos: mEvent.worldCell}, false);
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
        const exitAtCursor = props.selectedRoom.getInstancesInRadius(mEvent.worldCell, 0)
            .find(e => e.pos.equalTo(mEvent.worldCell) && e.TYPE == Core.INSTANCE_TYPE.EXIT);

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

function openOverlapBox(instances: Instance_Base[], pos: Vector): void {
    overlappingInstances.value = instances.sort((a, b) => b.zDepth - a.zDepth);
    
    nextTick(()=>{
        const parentBounds = overlapBox.value!.parentElement!.getBoundingClientRect();
        const boxBounds = overlapBox.value!.getBoundingClientRect();
        const parentWidth = parentBounds.right - parentBounds.left;
        const parentHeight = parentBounds.bottom - parentBounds.top;
        const boxWidth = boxBounds.right - boxBounds.left;
        const boxHeight = boxBounds.bottom - boxBounds.top;
        const x = Math.min(pos.x, parentWidth - (boxWidth * 1.5));
        const y = Math.min(pos.y, parentHeight - boxHeight);
        overlapBox.value!.style.left = x + 'px';
        overlapBox.value!.style.top = y + 'px';
    });
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

function actionAdd({sourceId, instRefList = [], pos}: AddProps, makeCommit = true): void {
    const cacheList = undoStore.cache.get('add_list');

    if (makeCommit){
        const data = {instRefList: cacheList};
        undoStore.commit({action: Core.ROOM_ACTION.ADD, data});
        undoStore.cache.delete('add_list');
        return;
    }

    if (sourceId){
        const newInst = (()=>{
            switch (props.selectedAsset.category_ID){
                case Core.CATEGORY_ID.SPRITE:
                    const sprite = gameDataStore.getAllSprites.find(s => s.id == sourceId)!;
                    return new Core.Instance_Sprite(props.selectedRoom.curInstId, pos, sprite);
                case Core.CATEGORY_ID.OBJECT:
                    const object = gameDataStore.getAllObjects.find(o => o.id == sourceId)!;
                    return new Core.Instance_Object(props.selectedRoom.curInstId, pos!, object);
                case Core.CATEGORY_ID.LOGIC:
                    return new Core.Instance_Logic(props.selectedRoom.curInstId, pos, sourceId);
            }
        })()!;

        instRefList.push(newInst);

        if (cacheList){
            cacheList.push(newInst);
        }
        else if (newInst){
            undoStore.cache.set('add_list', [newInst]);
        }
    }

    for (let i = 0; i < instRefList.length; i++){
        props.selectedRoom.addInstance(instRefList[i]);
        RoomMainEventBus.emit('instance-added', instRefList[i]);
    }
}

function actionDelete({instId, instRefList = []}: DeleteProps, makeCommit = true): void {
    const cacheList = undoStore.cache.get('delete_list');
    const singleInstance = !cacheList && makeCommit;

    if (makeCommit && !singleInstance){
        const data = {instRefList: cacheList};
        undoStore.commit({action: Core.ROOM_ACTION.DELETE, data})
        undoStore.cache.delete('delete_list');
        return;
    }

    if (instId != undefined){
        const instRef = props.selectedRoom.removeInstance(instId);

        if (instRef == editorSelection.value){
            editorSelection.value = null;
        }

        if (cacheList){
            cacheList.push(instRef);
        }
        else if (instRef){
            undoStore.cache.set('delete_list', [instRef]);
        }

        RoomMainEventBus.emit('instance-removed', instRef);
    }

    for (let i = 0; i < instRefList.length; i++){
        const inst = instRefList[i]
        props.selectedRoom.removeInstance(inst.id);
        RoomMainEventBus.emit('instance-removed', inst);
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
        const data = {add, groupName, newName, remove, oldIdx, instRef: editorSelection.value! as Core.Instance_Object} satisfies InstanceGroupChangeProps;
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

function actionExitAdd({exitRef, pos}: ExitAddProps, makeCommit = true): Core.Instance_Exit {
    const newExit = exitRef ?? new Core.Instance_Exit(props.selectedRoom.curInstId, pos);
    const newExitName = t('room_editor.new_exit_prefix') + newExit.id;
    props.selectedRoom.addInstance(newExit);

    newExit.name = newExitName;
    
    RoomMainEventBus.emit('instance-added', newExit);

    if (makeCommit){
        const data = {exitRef: newExit, pos: pos.clone()} satisfies ExitAddProps;
        undoStore.commit({action: Core.ROOM_ACTION.EXIT_ADD, data});
    }

    return newExit;
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

    props.selectedRoom.removeInstance(exitRef!.id);
    RoomMainEventBus.emit('instance-removed', exitRef);
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
        <div
            v-if="overlappingInstances.length > 0"
            ref="overlapBox"
            class="overlap-list"
            @mouseleave="()=>overlappingInstances = []"
            v-click-outside.any="()=>overlappingInstances = []">
            <div
                v-for="instance in overlappingInstances"
                class="overlap-item"
                @click="()=>{
                    editorSelection = instance;
                    overlappingInstances = [];
                }">
                <VueCanvas width="32" height="32" :onMounted="instance.drawThumbnail.bind(instance)" />
                {{ instance.name }}
            </div>
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
                    :selected-instance="editorSelection!"
                    :camera="selectedRoom.camera"
                    :room="selectedRoom"
                    @inst-prop-set="actionInstanceChange({newState: $event as object})"
                    @inst-group-changed="actionInstanceGroupChange($event)"
                    @inst-var-changed="actionInstanceVarChange({changeObj: $event})"
                    @cam-prop-set="actionCameraChange({newState: $event})"
                    @exit-prop-set="actionInstanceChange({newState: ($event as Partial<Core.Instance_Base>)})"
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

.roomMain > * {
    user-select: none;
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
    user-select: none;
}

.resizeBtn > *{
    width: 100%;
    height: 100%;
}

.toolSpacer{
    width: 100%;
    height: 10px;
}

.overlap-list{
    position: absolute;
    display: flex;
    flex-direction: column;
    max-height: 200px;
    background: var(--tool-panel-bg);
    border: 2px solid var(--border);
    border-radius: var(--corner-radius);
    transform: translateX(40%);
    overflow: hidden;
    overflow-y: auto;
    scrollbar-gutter: stable;
    z-index: 99;
}

.overlap-item{
    display: flex;
    flex-direction: row;
    align-items: center;
    gap: 10px;
    font-size: 1.2em;
    background: var(--tool-panel-bg);
    padding: 10px;
    user-select: none;
}

.overlap-item:hover{
    filter: brightness(1.2);
}

.overlap-item:active{
    filter: brightness(0.8);
}

.overlap-list::-webkit-scrollbar {
width: 12px;
height: 12px;
}

.overlap-list::-webkit-scrollbar-track {
background: #f5f5f5;
border-radius: 10px;
}

.overlap-list::-webkit-scrollbar-thumb {
border-radius: 10px;
background: #AAA;
}

.overlap-list::-webkit-scrollbar-thumb:hover {
background: #999;  
}

.noRoomSelected{
    flex-grow: 1;
    display: flex;
    justify-content: center;
    align-items: center;
}
</style>