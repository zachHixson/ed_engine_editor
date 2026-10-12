<script lang="ts">
export const ArtCanvasEventBus = {
    onMouseWheel: new Core.Event_Emitter<(event: WheelEvent)=>void>(),
    onMouseMove: new Core.Event_Emitter<(event: MouseEvent)=>void>(),
    onMouseDown: new Core.Event_Emitter<(event: MouseEvent)=>void>(),
    onMouseUp: new Core.Event_Emitter<(event: MouseEvent)=>void>(),
    onMouseEnter: new Core.Event_Emitter<()=>void>(),
    onMouseLeave: new Core.Event_Emitter<(event: MouseEvent)=>void>(),
    onNavSetContainerDimensions: new Core.Event_Emitter<({width, height}: {width: number, height: number})=>void>(),
};
</script>

<script setup lang="ts">
import UndoPanel from '@/components/common/UndoPanel.vue';
import NavControlPanel, { NAV_TOOL_TYPE } from '@/components/common/NavControlPanel.vue';
import Art_Canvas_Renderer from './Art_Canvas_Renderer';

import { ref, watch, onBeforeMount, onMounted, onBeforeUnmount } from 'vue';
import type Tool_Base from './tools/Tool_Base';
import { useArtEditorStore } from '@/stores/ArtEditor';
import { ArtMainEventBus } from './ArtMain.vue';
import Core from '@/core';

const props = defineProps<{
    tool: Tool_Base | null,
    navState: Core.NavState,
    spriteFrame: ImageData,
    undoLength: number,
    redoLength: number,
}>();

const emit = defineEmits<{
    mouseDown: [MouseEvent],
    mouseUp: [MouseEvent],
    mouseMove: [MouseEvent],
    mouseEnter: [],
    mouseLeave: [MouseEvent],
    mouseWheel: [WheelEvent],
    navSelected: [],
    undo: [],
    redo: [],
}>();

const artEditorStore = useArtEditorStore();
const { Vec2 } = Core;

const artCanvasRef = ref<HTMLDivElement>();
const canvasRef = ref<HTMLCanvasElement>();
const navHotkeyTool = ref<NAV_TOOL_TYPE | null>(null);
const previewData: ImageData = new ImageData(Core.Sprite.DIMENSIONS, Core.Sprite.DIMENSIONS);
const maxZoom = ref(2);
const mouseCell = new Core.Vec2(-20, -20);
const devicePixelRatio = ref(window.devicePixelRatio);
let renderer: Art_Canvas_Renderer | null = null;

const CANVAS_WIDTH = Core.Sprite.DIMENSIONS * Art_Canvas_Renderer.DEFAULT_CELL_SIZE;
const contentsBounds = (()=>{
    const halfCanvas = (CANVAS_WIDTH / 2);
    return [-halfCanvas, -halfCanvas, halfCanvas, halfCanvas];
})();

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
    ArtMainEventBus.onResize.listen(resize);
});

onMounted(()=>{
    renderer = new Art_Canvas_Renderer(canvasRef.value!, props.spriteFrame, previewData, props.navState);

    canvasRef.value!.addEventListener('mousedown', mouseDown);
    canvasRef.value!.addEventListener('mouseup', mouseUp);
    canvasRef.value!.addEventListener('mousemove', mouseMove);
    canvasRef.value!.addEventListener('wheel', wheel);
    canvasRef.value!.addEventListener('mouseenter', mouseEnter);
    canvasRef.value!.addEventListener('mouseleave', mouseLeave);

    ArtMainEventBus.onUpdateFramePreviews.listen(updateSpriteTexture);

    maxZoom.value = getZoomBounds().max;
    resize();
});

onBeforeUnmount(()=>{
    ArtMainEventBus.onResize.remove(resize);
    ArtMainEventBus.onUpdateFramePreviews.remove(updateSpriteTexture);
    renderer!.destroy();
    renderer = null;
});

function mouseDown(event: MouseEvent): void {
    ArtCanvasEventBus.onMouseDown.emit(event);

    if (navHotkeyTool.value == null){
        emit('mouseDown', event);
        renderer!.mouseDown();
    }
}

function mouseUp(event: MouseEvent): void {
    if (navHotkeyTool.value == null){
        emit('mouseUp', event);
        renderer!.mouseUp();
    }

    ArtCanvasEventBus.onMouseUp.emit(event);
}

function mouseMove(event: MouseEvent): void {
    ArtCanvasEventBus.onMouseMove.emit(event);

    if (navHotkeyTool.value == null){
        updateMouseCell(event);
        emit('mouseMove', event);
        renderer!.mouseMove();
    }
}

function mouseEnter(): void {
    ArtCanvasEventBus.onMouseEnter.emit();
    emit('mouseEnter');
}

function mouseLeave(event: MouseEvent): void {
    mouseMove(event);
    ArtCanvasEventBus.onMouseLeave.emit(event);
    emit('mouseLeave', event);
}

function wheel(event: WheelEvent): void {
    ArtCanvasEventBus.onMouseWheel.emit(event);
    emit('mouseWheel', event);
}

function resize(): void {
    const wrapper = artCanvasRef.value!;
    const canvas = canvasRef.value!;

    Core.Draw.resizeHDPICanvas(
        canvas,
        Math.max(wrapper.clientWidth, 1),
        Math.max(wrapper.clientHeight, 1)
    );

    ArtCanvasEventBus.onNavSetContainerDimensions.emit({width: wrapper.clientWidth, height: wrapper.clientHeight});

    if (renderer){
        renderer.resize();
        maxZoom.value = getZoomBounds().max;
    }
}

function enableNav(navTool: NAV_TOOL_TYPE): void {
    artEditorStore.selectTool(null);
    artEditorStore.setSelectedNavTool(navTool);
    emit('navSelected');
}

function getZoomBounds(): {min: number, max: number} {
    const canvas = canvasRef.value!;
    const maxZoom = (Math.max(canvas.clientWidth, canvas.clientHeight) / CANVAS_WIDTH) * 2;
    return {min: 0.5, max: maxZoom};
}

function undo(): void {
    emit('undo');
}

function redo(): void {
    emit('redo');
}

function render(): void {
    renderer!.queueRender();
}

function updateSpriteTexture(): void {
    renderer!.updateSpriteTexture();
    render();
}

function updateMouseCell(event: MouseEvent): void {
    const mousePos = new Vec2(event.offsetX, event.offsetY).multiplyScalar(devicePixelRatio.value);
    const windowDimensions = new Vec2(canvasRef.value!.width, canvasRef.value!.height);

    //convert from pixels to clip space
    mousePos.divide(windowDimensions).subtractScalar(0.5).multiplyScalar(2);
    mousePos.y *= -1;

    //convert from clip space to world space
    mousePos.multiplyMat3(renderer!.getViewMatrix().clone().inverse().transpose());

    //convert to sprite space
    mousePos.addScalar(CANVAS_WIDTH / 2).divideScalar(CANVAS_WIDTH);
    mousePos.y = 1 - mousePos.y;
    mousePos.multiplyScalar(Core.Sprite.DIMENSIONS);
    mousePos.floor();

    mouseCell.copy(mousePos);
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
            :unitScale="Art_Canvas_Renderer.UNIT_WIDTH"
            :dpiScale="devicePixelRatio"
            :parentEventBus="ArtCanvasEventBus"
            :invert-y-axis="true"
            @navChanged="(renderer! as Art_Canvas_Renderer).navChanged()"
            @toolSelected="enableNav"
            @setHotkeyTool="navHotkeyTool = $event"/>
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
