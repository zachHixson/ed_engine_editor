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
    watch,
    onMounted,
    onBeforeUnmount
} from 'vue';
import { useRoomEditorStore } from '@/stores/RoomEditor';
import { RoomMainEventBus } from './RoomMain.vue';
import Core from '@/core';

const roomEditorStore = useRoomEditorStore();

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
const RoomEditWindowEventBus = {
    onMouseDown: new Core.Event_Emitter<(event: MouseEvent)=>void>(),
    onMouseUp: new Core.Event_Emitter<(event: MouseEvent)=>void>(),
    onMouseMove: new Core.Event_Emitter<(event: MouseEvent)=>void>(),
    onDblClick: new Core.Event_Emitter<(event: MouseEvent)=>void>(),
    onMouseWheel: new Core.Event_Emitter<(event: MouseEvent)=>void>(),
    onMouseEnter: new Core.Event_Emitter<()=>void>(),
    onMouseLeave: new Core.Event_Emitter<()=>void>(),
    onNavSetContainerDimensions: new Core.Event_Emitter<({width, height}: {width: number, height: number})=>void>,
};
const devicePixelRatio = window.devicePixelRatio;
const contentsBounds = ref([0, 0, 0, 0]);
let renderer: Room_Edit_Renderer;
let unitWidth = 1;
let navHotkeyTool: Core.NAV_TOOL_TYPE | null = null;

//template refs
const canvasEl = ref<HTMLCanvasElement>();
const editWindowRef = ref<HTMLDivElement>();
const navControlPanel = ref();

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
    RoomMainEventBus.onResize.listen(resize);
    RoomMainEventBus.onBgColorChanged.listen(bgColorChanged);
    RoomMainEventBus.onInstanceAdded.listen(instanceAdded);
    RoomMainEventBus.onInstanceRemoved.listen(instanceRemoved);
    RoomMainEventBus.onInstanceChanged.listen(instanceChanged);
    RoomMainEventBus.onCameraChanged.listen(cameraChanged);
    RoomMainEventBus.onRoomChanged.listen(roomChange)
    RoomMainEventBus.onGridStateChanged.listen(toggleGrid);

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
    RoomMainEventBus.onResize.remove(resize);
    RoomMainEventBus.onBgColorChanged.remove(bgColorChanged);
    RoomMainEventBus.onInstanceAdded.remove(instanceAdded);
    RoomMainEventBus.onInstanceRemoved.remove(instanceRemoved);
    RoomMainEventBus.onInstanceChanged.remove(instanceChanged);
    RoomMainEventBus.onCameraChanged.remove(cameraChanged);
    RoomMainEventBus.onRoomChanged.remove(roomChange)
    RoomMainEventBus.onGridStateChanged.remove(toggleGrid);
});

function mouseDown(event: MouseEvent): void {
    RoomEditWindowEventBus.onMouseDown.emit(event);
    emitMouseEvent(event, Core.MOUSE_EVENT.DOWN);
}

function mouseUp(event: MouseEvent): void {
    RoomEditWindowEventBus.onMouseUp.emit(event);
    emitMouseEvent(event, Core.MOUSE_EVENT.UP);
}

function mouseMove(event: MouseEvent): void {
    RoomEditWindowEventBus.onMouseMove.emit(event);
    emitMouseEvent(event, Core.MOUSE_EVENT.MOVE);
    renderer.mouseMove(event);
}

function mouseClick(event: MouseEvent): void {
    emitMouseEvent(event, Core.MOUSE_EVENT.CLICK);
}

function mouseDblClick(event: MouseEvent): void {
    RoomEditWindowEventBus.onDblClick.emit(event);
    emitMouseEvent(event, Core.MOUSE_EVENT.DOUBLE_CLICK);
}

function mouseWheel(event: MouseEvent): void {
    RoomEditWindowEventBus.onMouseWheel.emit(event);
}

function mouseEnter(event: MouseEvent): void {
    RoomEditWindowEventBus.onMouseEnter.emit();
}

function mouseLeave(event: MouseEvent): void {
    RoomEditWindowEventBus.onMouseLeave.emit();
    emitMouseEvent(event, Core.MOUSE_EVENT.LEAVE);
    mouseUp(event);
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

    RoomEditWindowEventBus.onNavSetContainerDimensions.emit({width: wrapper.clientWidth, height: wrapper.clientHeight})

    renderer?.resize();
}

function emitMouseEvent(event: MouseEvent, type: Core.MOUSE_EVENT): void {
    if (event.button == 0 && roomEditorStore.getSelectedNavTool == null && navHotkeyTool == null){
        const canvasPos = new Core.Vector(event.offsetX, event.offsetY);
        const worldCell = renderer.getMouseWorldCell();
        
        emit('mouse-event', {type, canvasPos, worldCell} satisfies imEvent);
    }
}

function instanceAdded(instance: Core.Instance_Base): void {
    contentsBounds.value = props.selectedRoom.getContentsBounds();
    renderer.addInstance(instance, true);
}

function instanceRemoved(instance: Core.Instance_Base): void {
    contentsBounds.value = props.selectedRoom.getContentsBounds();
    renderer.removeInstance(instance);
}

function instanceChanged(instance: Core.Instance_Base): void {
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
            @click="mouseClick"
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
    user-select: none;
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