<script lang="ts">
export interface imEvent{
    type: Core.MOUSE_EVENT,
    canvasPos: Core.Vector,
    cell: Core.Vector,
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
    defineProps,
    defineEmits,
    onMounted,
    onBeforeUnmount
} from 'vue';
import { useRoomEditorStore } from '@/stores/RoomEditor';
import { useGameDataStore } from '@/stores/GameData';
import Core from '@/core';
import { RoomMainEventBus } from './RoomMain.vue';
import { Event_Bus } from '@/components/common/Event_Listener';

const roomEditorStore = useRoomEditorStore();
const gameDataStore = useGameDataStore();

const props = defineProps<{
    selectedRoom: Core.Room,
    editorSelection: Core.Object_Instance | Core.Exit | null,
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
    'nav-set-container-dimentions'
]);

//define data
const RoomEditWindowEventBus = new Event_Bus();
const devicePixelRatio = window.devicePixelRatio;
let renderer: Room_Edit_Renderer;
let contentsBounds = ref<number[]>([0, 0, 0, 0]);
let loadedImages = 0;
let unitWidth = 1;
let navHotkeyTool: Core.NAV_TOOL_TYPE | null = null;

//template refs
const canvasEl = ref<HTMLCanvasElement>();
const editWindow = ref<HTMLDivElement>();
const navControlPanel = ref();
const canvasImages = ref();
const camera_icon = ref();
const noSprite_icon = ref();
const exit_icon = ref();
const end_icon = ref();

const checkAssetDeletion = computed(()=>gameDataStore.getAllObjects.length + gameDataStore.getAllSprites.length);
const gridEnabled = computed(()=>roomEditorStore.getGridState);
const editorSelection = computed(()=>props.editorSelection);

watch(props.selectedRoom, ()=>roomChange());
watch(editorSelection, ()=>setSelection());
watch(gridEnabled, (newVal)=>renderer.setGridVisibility(newVal));
watch(checkAssetDeletion, (newVal, oldVal)=> (newVal < oldVal) && renderer.drawObjects());

onMounted(()=>{
    const icons = {
        cameraIcon: camera_icon.value,
        noSpriteSVG: noSprite_icon.value,
        exitSVG: exit_icon.value,
        endSVG: end_icon.value
    };

    renderer = new Room_Edit_Renderer(
        canvasEl.value ?? document.createElement('canvas'),
        props.selectedRoom.navState!,
        icons
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
    RoomMainEventBus.addEventListener('instances-changed', instancesChanged);
    RoomMainEventBus.addEventListener('camera-changed', cameraChanged);

    if (props.selectedRoom){
        roomChange();
    }
});

onBeforeUnmount(()=>{
    window.removeEventListener('resize', resize);
    RoomMainEventBus.removeEventListener('resize', resize);
    RoomMainEventBus.removeEventListener('bgColorChanged', bgColorChanged);
    RoomMainEventBus.removeEventListener('instances-changed', instancesChanged);
    RoomMainEventBus.removeEventListener('camera-changed', cameraChanged);
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

function mouseWheel(event: MouseEvent): void {
    RoomEditWindowEventBus.emit('mouse-wheel', event);
}

function mouseEnter(event: MouseEvent): void {
    RoomEditWindowEventBus.emit('mouse-enter', event);
    renderer.enableCursor = true;
}

function mouseLeave(event: MouseEvent): void {
    RoomEditWindowEventBus.emit('mouse-leave');
    emitMouseEvent(event, Core.MOUSE_EVENT.LEAVE);
    renderer.enableCursor = false;
    renderer.mouseMove(event);
}

function roomChange(): void {
   renderer.setRoomRef(props.selectedRoom);
   contentsBounds.value = props.selectedRoom.getContentsBounds();
}

function resize(): void {
    const wrapper = editWindow.value as HTMLElement;
    const width = Math.max(wrapper.clientWidth, 1);
    const height = Math.max(wrapper.clientHeight, 1);

    Core.Draw.resizeHDPICanvas(canvasEl.value!, width, height);

    RoomEditWindowEventBus.emit('nav-set-container-dimentions', {width: wrapper.clientWidth, height: wrapper.clientHeight});

    renderer?.resize();
}

function emitMouseEvent(event: MouseEvent, type: Core.MOUSE_EVENT): void {
    if (event.which == 1 && roomEditorStore.getSelectedNavTool == null && navHotkeyTool == null){
        const canvasPos = new Core.Vector(event.offsetX, event.offsetY);
        const cell = renderer.getMouseCell();
        const worldCell = renderer.getMouseWorldCell();
        
        emit('mouse-event', {type, canvasPos, cell, worldCell} satisfies imEvent);
    }
}

function instancesChanged(): void {
    contentsBounds.value = props.selectedRoom.getContentsBounds();
    renderer.instancesChanged();
}

function setSelection(): void {
    renderer.setSelection(props.editorSelection!);
}

function cameraChanged(): void {
    contentsBounds.value = props.selectedRoom.getContentsBounds();
    renderer.instancesChanged();
}

function bgColorChanged(): void {
    renderer.bgColorChanged();
}

function checkImageLoading(): void {
    loadedImages++;
    
    if (loadedImages >= canvasImages.value?.children.length){
        renderer.fullRedraw();
    }
}

function navToolSelected(tool: Core.NAV_TOOL_TYPE): void {
    roomEditorStore.setSelectedTool(null);
    roomEditorStore.setSelectedNavTool(tool);
}
</script>

<template>
    <div ref="editWindow" class="editWindow">
        <UndoPanel
            class="undoPanel"
            :undoLength="undoLength"
            :redoLength="redoLength"
            @undo="$emit('undo')"
            @redo="$emit('redo')"/>
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
            @nav-changed="renderer.navChange()"
            @tool-selected="navToolSelected"
            @hotkey-tool-selected="navHotkeyTool = $event"/>
        <canvas
            ref="canvasEl"
            class="canvas"
            @mousedown="mouseDown"
            @mouseup="mouseUp"
            @mousemove="mouseMove">//Canvas Error</canvas>
        <div ref="canvasImages" style="display: none">
            <img ref="camera_icon" src="@/assets/camera_location.svg" @load="checkImageLoading()"/>
            <img ref="noSprite_icon" src="@/assets/object_icon.svg" @load="checkImageLoading()"/>
            <img ref="exit_icon" src="@/assets/exit.svg" @load="checkImageLoading()"/>
            <img ref="end_icon" src="@/assets/end.svg" @load="checkImageLoading()"/>
        </div>
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