<script lang="ts">
import type Tool_Base from './composables/Tool_Base';
import type { Ref } from 'vue';

export const RoomMainEventBus = new Core.Event_Bus();

export type tActionMap = Map<Core.ROOM_ACTION, (data: any, commit?: boolean)=>void>;
export type tToolMap = Map<Core.ROOM_TOOL_TYPE, typeof Tool_Base>;

export interface iActionArguments {
    props: {
        selectedAsset: Core.Asset_Base;
        selectedRoom: Core.Room;
    };
    toolMap: tToolMap;
    actionMap: tActionMap;
    revertMap: tActionMap;
    undoStore: Undo_Store<iActionStore>;
    editorSelection: Ref<Core.Instance_Base | null>;
}
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
import { useAdd } from './composables/add';
import { useSelectMove } from './composables/selectMove';
import { useDelete } from './composables/delete';
import { useCameraProps } from './composables/cameraProps';
import { useInstanceProps } from './composables/instanceProps';
import { useRoomProps } from './composables/roomProps';
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

const { ROOM_TOOL_TYPE } = Core;

//define stores
const { t } = useI18n();
const mainStore = useMainStore();
const roomEditorStore = useRoomEditorStore();

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
const toolMap: tToolMap = new Map();
const actionMap: tActionMap = new Map();
const revertMap: tActionMap = new Map();
const mouse = reactive({
    down: false,
    wpLastDown: new Core.Vector(0, 0),
    downOnSelection: false,
    newSelection: false,
    cellCache: new Array<Core.Vector>(),
    inWindow: false,
});
const editorSelection = ref<Core.Instance_Base | null>(null);
let curTool: Tool_Base | null = null;

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
const actionArgs: iActionArguments = {
    props,
    toolMap,
    actionMap,
    revertMap,
    undoStore,
    editorSelection: editorSelection as Ref<Core.Instance_Base | null>,
}
const { stepForward, stepBackward } = useUndoHelpers(undoStore, actionMap, revertMap);
const { overlapBox, overlappingInstances } = useSelectMove(actionArgs);
const { deleteInstance } = useDelete(actionArgs);
const { changeCameraProps } = useCameraProps(actionArgs);
const { changeInstanceProps, changeInstanceGroups } = useInstanceProps(actionArgs);
const { changeRoomProps } = useRoomProps(actionArgs);
useAdd(actionArgs);

function bindHotkeys(): void {
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

function toolClicked(tool: Core.ROOM_TOOL_TYPE): void {
    const toolClass = toolMap.get(tool)!;
    curTool = new toolClass();
    roomEditorStore.setSelectedTool(tool);
    roomEditorStore.setSelectedNavTool(null);
}

function mouseEvent(mEvent: imEvent): void {
    if (mEvent.type == Core.MOUSE_EVENT.DOWN){
        mouse.down = true;
        mouse.wpLastDown.copy(mEvent.worldCell);
    }
    else if (mEvent.type == Core.MOUSE_EVENT.UP){
        mouse.down = false;
    }
    
    switch(mEvent.type){
        case Core.MOUSE_EVENT.DOWN:
            curTool?.mouseDown(mEvent);
            break;
        case Core.MOUSE_EVENT.UP:
            curTool?.mouseUp(mEvent);
            break;
        case Core.MOUSE_EVENT.MOVE:
            curTool?.mouseMove(mEvent);
            break;
        case Core.MOUSE_EVENT.CLICK:
            curTool?.click(mEvent);
            break;
        case Core.MOUSE_EVENT.DOUBLE_CLICK:
            curTool?.doubleClick(mEvent);
            break;
    }
}

function toggleGrid(): void {
    const newState = !roomEditorStore.getGridState;
    roomEditorStore.setGridState(newState);
    RoomMainEventBus.emit('grid-state-changed', newState);
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
                    editorSelection = instance as Core.Instance_Base;
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
            :editorSelection="(editorSelection as Core.Instance_Base)"
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
                    :selected-instance="(editorSelection as Core.Instance_Base)"
                    :camera="selectedRoom.camera"
                    :room="selectedRoom"
                    @inst-prop-set="changeInstanceProps({newState: $event as object})"
                    @inst-group-changed="changeInstanceGroups($event)"
                    @inst-var-changed="()=>{}"
                    @cam-prop-set="changeCameraProps({newState: $event})"
                    @exit-prop-set="changeInstanceProps({newState: ($event as Partial<Core.Instance_Base>)})"
                    @room-prop-set="changeRoomProps({newState: $event})"
                    @room-bg-changed="changeRoomProps({newState: $event}, false)"
                    @room-bg-change-end="changeRoomProps({newState: $event}, true)"/>
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