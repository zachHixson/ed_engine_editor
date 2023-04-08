<script lang="ts">
export interface imEvent{
    type: Core.MOUSE_EVENT,
    canvasPos: Core.Vector,
    worldCell: Core.Vector,
}
</script>

<script setup lang="ts">
import NavControlPanel from '@/components/common/NavControlPanel.vue';
import UndoPanel from '@/components/common/UndoPanel.vue';
import Room_Edit_Renderer from './Room_Edit_Renderer';

import {
    ref,
    computed,
    watch,
    onMounted,
    onBeforeUnmount
} from 'vue';
import { useRoomEditorStore } from '@/stores/RoomEditor';
import { useGameDataStore } from '@/stores/GameData';
import { RoomMainEventBus } from './RoomMain.vue';
import Core from '@/core';
import type { Instance_Base } from '@engine/core/core';

const roomEditorStore = useRoomEditorStore();
const gameDataStore = useGameDataStore();

const props = defineProps<{
    selectedRoom: Core.Room,
    editorSelection: Core.Instance_Base | null,
    undoLength: number,
    redoLength: number
}>();

const emit = defineEmits([
    'mouse-event',
    'mouse-down',
    'mouse-up',
    'mouse-move',
    'mouse-enter',
    'mouse-leave',
    'mouse-wheel',
    'nav-set-container-dimentions',
    'undo',
    'redo',
]);

//define data
const RoomEditWindowEventBus = new Core.Event_Bus();
const devicePixelRatio = window.devicePixelRatio;
const contentsBounds = ref([0, 0, 0, 0]);
let renderer: Room_Edit_Renderer;
let unitWidth = 1;
let navHotkeyTool: Core.NAV_TOOL_TYPE | null = null;

//template refs
const canvasEl = ref<HTMLCanvasElement>();
const editWindowRef = ref<HTMLDivElement>();
const navControlPanel = ref();

const checkAssetDeletion = computed(()=>gameDataStore.getAllObjects.length + gameDataStore.getAllSprites.length);

watch(()=>props.editorSelection, ()=>setSelection());
watch(()=>roomEditorStore.getGridState, (newVal)=>renderer.setGridVisibility(newVal));
watch(()=>props.selectedRoom, (newRoom)=>roomChange(newRoom));

onMounted(()=>{
    renderer = new Room_Edit_Renderer(
        canvasEl.value ?? document.createElement('canvas'),
        props.selectedRoom.navState!
    );
    contentsBounds.value = props.selectedRoom.getContentsBounds();
    unitWidth = renderer.UNIT_WIDTH;
    resize();

    //bind events
    window.addEventListener('resize', resize);
    canvasEl.value!.addEventListener('wheel', mouseWheel);
    canvasEl.value!.addEventListener('mouseenter', mouseEnter);
    canvasEl.value!.addEventListener('mouseleave', mouseLeave);
    RoomMainEventBus.addEventListener('resize', resize);
    RoomMainEventBus.addEventListener('bgColorChanged', bgColorChanged);
    RoomMainEventBus.addEventListener('instance-added', instanceAdded);
    RoomMainEventBus.addEventListener('instance-removed', instanceRemoved);
    RoomMainEventBus.addEventListener('instance-changed', instanceChanged);
    RoomMainEventBus.addEventListener('camera-changed', cameraChanged);
    RoomMainEventBus.addEventListener('room-changed', roomChange);
    RoomMainEventBus.addEventListener('grid-state-changed', toggleGrid);

    if (props.selectedRoom){
        roomChange();
    }

    renderer.setGridVisibility(roomEditorStore.getGridState);
});

onBeforeUnmount(()=>{
    window.removeEventListener('resize', resize);
    canvasEl.value!.removeEventListener('wheel', mouseWheel);
    canvasEl.value!.removeEventListener('mouseenter', mouseEnter);
    canvasEl.value!.removeEventListener('mouseleave', mouseLeave);
    RoomMainEventBus.removeEventListener('resize', resize);
    RoomMainEventBus.removeEventListener('bgColorChanged', bgColorChanged);
    RoomMainEventBus.removeEventListener('instance-added', instanceAdded);
    RoomMainEventBus.removeEventListener('instance-removed', instanceRemoved);
    RoomMainEventBus.removeEventListener('instance-changed', instanceChanged);
    RoomMainEventBus.removeEventListener('camera-changed', cameraChanged);
    RoomMainEventBus.removeEventListener('room-changed', roomChange);
    RoomMainEventBus.removeEventListener('grid-state-changed', toggleGrid);
});

function mouseDown(event: MouseEvent): void {
    RoomEditWindowEventBus.emit('mouse-down', event);
    emitMouseEvent(event, Core.MOUSE_EVENT.DOWN);
}

function mouseUp(event: MouseEvent): void {
    RoomEditWindowEventBus.emit('mouse-up', event);
    emitMouseEvent(event, Core.MOUSE_EVENT.UP);
}

function mouseMove(event: MouseEvent): void {
    RoomEditWindowEventBus.emit('mouse-move', event);
    emitMouseEvent(event, Core.MOUSE_EVENT.MOVE);
    renderer.mouseMove(event);
}

function mouseDblClick(event: MouseEvent): void {
    RoomEditWindowEventBus.emit('mouse-double-click', event);
    emitMouseEvent(event, Core.MOUSE_EVENT.DOUBLE_CLICK);
}

function mouseWheel(event: MouseEvent): void {
    RoomEditWindowEventBus.emit('mouse-wheel', event);
}

function mouseEnter(event: MouseEvent): void {
    RoomEditWindowEventBus.emit('mouse-enter', event);
    //renderer.enableCursor = true;
}

function mouseLeave(event: MouseEvent): void {
    RoomEditWindowEventBus.emit('mouse-leave');
    emitMouseEvent(event, Core.MOUSE_EVENT.LEAVE);
    //renderer.enableCursor = false;
    renderer.mouseMove(event);
}

function roomChange(newRoom?: Core.Room): void {
    renderer.setRoomRef(props.selectedRoom);
    contentsBounds.value = props.selectedRoom.getContentsBounds();
}

function toggleGrid(state: boolean): void {
    renderer!.setGridVisibility(state);
}

function resize(): void {
    const wrapper = editWindowRef.value as HTMLElement;
    const width = Math.max(wrapper.clientWidth, 1);
    const height = Math.max(wrapper.clientHeight, 1);

    Core.Draw.resizeHDPICanvas(canvasEl.value!, width, height);

    RoomEditWindowEventBus.emit('nav-set-container-dimensions', {width: wrapper.clientWidth, height: wrapper.clientHeight});

    renderer?.resize();
}

function emitMouseEvent(event: MouseEvent, type: Core.MOUSE_EVENT): void {
    if (event.button == 0 && roomEditorStore.getSelectedNavTool == null && navHotkeyTool == null){
        const canvasPos = new Core.Vector(event.offsetX, event.offsetY);
        const worldCell = renderer.getMouseWorldCell();
        
        emit('mouse-event', {type, canvasPos, worldCell} satisfies imEvent);
    }
}

function instanceAdded(instance: Instance_Base): void {
    contentsBounds.value = props.selectedRoom.getContentsBounds();
    renderer.addInstance(instance);
}

function instanceRemoved(instance: Instance_Base): void {
    contentsBounds.value = props.selectedRoom.getContentsBounds();
    renderer.removeInstance(instance);
}

function instanceChanged(instance: Instance_Base): void {
    contentsBounds.value = props.selectedRoom.getContentsBounds();
    renderer.updateInstance(instance);
    setSelection();
}

function setSelection(): void {
    renderer.setSelection(props.editorSelection!);
}

function cameraChanged(): void {
    contentsBounds.value = props.selectedRoom.getContentsBounds();
    renderer.cameraChanged();
}

function bgColorChanged(): void {
    renderer.bgColorChanged();
}

function navToolSelected(tool: Core.NAV_TOOL_TYPE): void {
    roomEditorStore.setSelectedTool(null);
    roomEditorStore.setSelectedNavTool(tool);
}
</script>

<template>
    <div ref="editWindowRef" class="editWindow">
        <UndoPanel
            class="undoPanel"
            :undoLength="undoLength"
            :redoLength="redoLength"
            @undo="emit('undo')"
            @redo="emit('redo')"/>
        <NavControlPanel
            ref="navControlPanel"
            class="navControlPanel"
            :navState="selectedRoom.navState!"
            :selectedNavTool="roomEditorStore.getSelectedNavTool"
            :contentsBounds="contentsBounds"
            :unitScale="unitWidth"
            :dpiScale="devicePixelRatio"
            :maxZoom="2"
            :parentEventBus="RoomEditWindowEventBus"
            :invert-y-axis="true"
            @nav-changed="renderer.navChanged()"
            @tool-selected="navToolSelected"
            @hotkey-tool-selected="navHotkeyTool = $event"/>
        <canvas
            ref="canvasEl"
            class="canvas"
            @mousedown="mouseDown"
            @mouseup="mouseUp"
            @mousemove="mouseMove"
            @dblclick="mouseDblClick">//Canvas Error</canvas>
    </div>
</template>

<style scoped>
.editWindow{
    position: relative;
    box-sizing: border-box;
    width: 100%;
    height: 100%;
    margin: 0px;
    padding: 0px;
    background: #6666FF;
}

.canvas{
    position: absolute;
    box-sizing: border-box;
}

.navControlPanel{
    position: absolute;
    top: 0;
    right: 0;
    z-index: 5;
}

.undoPanel{
    position: absolute;
    top: 0;
    left: 0;
    z-index: 5;
}
</style>