<script lang="ts">
export const ArtCanvasEventBus = new Event_Bus();
</script>

<script setup lang="ts">
import UndoPanel from '@/components/common/UndoPanel.vue';
import NavControlPanel from '@/components/common/NavControlPanel.vue';
import Art_Canvas_Renderer from './Art_Canvas_Renderer';

import { ref, computed, watch, onBeforeMount, onMounted, onBeforeUnmount } from 'vue';
import type Tool_Base from './tools/Tool_Base';
import { useArtEditorStore } from '@/stores/ArtEditor';
import { Event_Bus } from '@/components/common/Event_Listener';
import { ArtMainEventBus } from './ArtMain.vue';
import Core from '@/core';

const DEFAULT_CELL_SIZE = 20;

const props = defineProps<{
    tool: Tool_Base | null,
    navState: Core.iNavState,
    spriteFrame: ImageData,
    undoLength: number,
    redoLength: number,
}>();

const emit = defineEmits([
    'mouse-down',
    'mouse-up',
    'mouse-move',
    'mouse-enter',
    'mouse-leave',
    'mouse-wheel',
    'nav-selected',
    'undo',
    'redo',
]);

const artEditorStore = useArtEditorStore();
const { Vector } = Core;

const artCanvasRef = ref<HTMLDivElement>();
const canvasRef = ref<HTMLCanvasElement>();
const navHotkeyTool = ref<Core.NAV_TOOL_TYPE | null>(null);
const previewData: ImageData = new ImageData(Core.Sprite.DIMENSIONS, Core.Sprite.DIMENSIONS);
const maxZoom = ref(2);
const mouseCell = new Core.Vector(-20, -20);
const unitScale = ref(1);
const devicePixelRatio = ref(window.devicePixelRatio);
let renderer: Art_Canvas_Renderer | null = null;

const CANVAS_WIDTH = Core.Sprite.DIMENSIONS * DEFAULT_CELL_SIZE;
const UNIT_WIDTH = DEFAULT_CELL_SIZE / Core.Sprite.DIMENSIONS;
const contentsBounds = (()=>{
    const halfCanvas = (CANVAS_WIDTH / 2);
    return [-halfCanvas, -halfCanvas, halfCanvas, halfCanvas];
})();

//const tool = computed();
//const toolSize = computed();
//const spriteFrame = computed();

watch(()=>props.tool, (newTool)=>{
    if (newTool){
        newTool.beforeDestroy();
        newTool.setPixelBuff(props.spriteFrame);
        newTool.setPreviewBuff(previewData);
        newTool.setMouseCell(mouseCell);
        newTool.updateCursorBuff();
        renderer!.mouseMove();
    }
});
watch(()=>artEditorStore.getSelectedSize, ()=>{
    if (props.tool){
        props.tool.updateCursorBuff();
        renderer!.mouseMove();
    }
});
watch(()=>props.spriteFrame, ()=>{
    renderer!.setSprite(props.spriteFrame, props.navState);
    props.tool && props.tool.setPixelBuff(props.spriteFrame);
    previewData.data.fill(0);
});

onBeforeMount(()=>{
    ArtMainEventBus.addEventListener('resize', resize);
});

onMounted(()=>{
    renderer = new Art_Canvas_Renderer(canvasRef.value!, props.spriteFrame, previewData, props.navState);

    canvasRef.value!.addEventListener('mousedown', mouseDown);
    canvasRef.value!.addEventListener('mouseup', mouseUp);
    canvasRef.value!.addEventListener('mousemove', mouseMove);
    canvasRef.value!.addEventListener('wheel', wheel);
    canvasRef.value!.addEventListener('mouseenter', mouseEnter);
    canvasRef.value!.addEventListener('mouseleave', mouseLeave);

    maxZoom.value = getZoomBounds().max;
    resize();
});

onBeforeUnmount(()=>{
    ArtMainEventBus.removeEventListener('resize', resize);
    renderer = null;
});

function mouseDown(event: MouseEvent): void {
    ArtCanvasEventBus.emit('mouse-down', event);

    if (navHotkeyTool.value == null){
        emit('mouse-down', event);
        renderer!.mouseDown();
    }
}

function mouseUp(event: MouseEvent): void {
    if (navHotkeyTool.value == null){
        emit('mouse-up', event);
        renderer!.mouseUp();
    }

    ArtCanvasEventBus.emit('mouse-up');
}

function mouseMove(event: MouseEvent): void {
    ArtCanvasEventBus.emit('mouse-move', event);

    if (navHotkeyTool.value == null){
        updateMouseCell(event);
        emit('mouse-move', event);
        renderer!.mouseMove();
    }
}

function mouseEnter(event: MouseEvent): void {
    ArtCanvasEventBus.emit('mouse-enter');
    emit('mouse-enter');
}

function mouseLeave(event: MouseEvent): void {
    mouseMove(event);
    ArtCanvasEventBus.emit('mouse-leave');
    emit('mouse-leave', event);
}

function wheel(event: WheelEvent): void {
    ArtCanvasEventBus.emit('mouse-wheel', event);
    emit('mouse-wheel', event);
}

function resize(): void {
    const wrapper = artCanvasRef.value!;
    const canvas = canvasRef.value!;

    Core.Draw.resizeHDPICanvas(
        canvas,
        Math.max(wrapper.clientWidth, 1),
        Math.max(wrapper.clientHeight, 1)
    );

    ArtCanvasEventBus.emit('nav-set-container-dimensions', {width: wrapper.clientWidth, height: wrapper.clientHeight});

    if (renderer){
        renderer.resize();
        maxZoom.value = getZoomBounds().max;
    }
}

function enableNav(navTool: Core.NAV_TOOL_TYPE): void {
    artEditorStore.selectTool(null);
    artEditorStore.setSelectedNavTool(navTool);
    emit('nav-selected');
}

function getZoomBounds(): {min: number, max: number} {
    const canvas = canvasRef.value!;
    let maxZoom = (Math.max(canvas.clientWidth, canvas.clientHeight) / CANVAS_WIDTH) * 2;
    return {min: 0.5, max: maxZoom};
}

function undo(): void {
    emit('undo');
}

function redo(): void {
    emit('redo');
}

function updateMouseCell(event: MouseEvent): void {
    const CELL_SIZE = (CANVAS_WIDTH / Core.Sprite.DIMENSIONS) * props.navState.zoomFac;
    const newMCell = new Vector(event.offsetX, event.offsetY).multiplyScalar(devicePixelRatio.value);
    const windowHalfWidth = new Vector(canvasRef.value!.width / 2, canvasRef.value!.height / 2);
    const canvasHalfWidth = new Vector(CANVAS_WIDTH / 2, CANVAS_WIDTH / 2);
    const scaledOffset = props.navState.offset.clone().multiplyScalar(props.navState.zoomFac);

    canvasHalfWidth.multiplyScalar(props.navState.zoomFac);

    newMCell.subtract(windowHalfWidth);
    newMCell.add(canvasHalfWidth);
    newMCell.subtract(scaledOffset);
    newMCell.divideScalar(CELL_SIZE);

    newMCell.floor();

    mouseCell.copy(newMCell);
}
</script>

<template>
    <div id="artCanvas" ref="artCanvasRef">
        <UndoPanel class="undoPanel" :undoLength="undoLength" :redoLength="redoLength" @undo="undo()" @redo="redo()"/>
        <canvas id="canvas" class="canvas" ref="canvasRef">
            //Error loading HTML5 canvas, check browser compatibility
        </canvas>
        <NavControlPanel
            class="navControlPanel"
            ref="navControlPanelRef"
            :navState="navState"
            :selectedNavTool="artEditorStore.getSelectedNavTool"
            :maxZoom="maxZoom"
            :contentsBounds="contentsBounds"
            :unitScale="UNIT_WIDTH"
            :dpiScale="devicePixelRatio"
            :parentEventBus="ArtCanvasEventBus"
            @nav-changed="renderer!.navChanged()"
            @tool-selected="enableNav"
            @set-hotkey-tool="navHotkeyTool = $event"/>
    </div>
</template>

<style scoped>
.artCanvas{
    position: relative;
    box-sizing: border-box;
    width: 100%;
    height: 100%;
    margin: none;
    padding: none;
    overflow: hidden;
    max-width: 100vw;
}

.undoPanel{
    position: absolute;
    top: 0;
    left: 0;
    z-index: 1000;
}

.canvas{
    position: absolute;
    box-sizing: border-box;
}

.navControlPanel{
    position: absolute;
    top: 0;
    right: 0;
    z-index: 1000;
}
</style>