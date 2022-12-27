<script lang="ts">
export const ArtMainEventBus = new Event_Bus();
</script>

<script setup lang="ts">
import Undo_Store from '@/components/common/Undo_Store';
import ToolPanel from './ToolPanel.vue';
import ArtCanvas from './ArtCanvas.vue';
import AnimationPanel from './AnimationPanel.vue';
import Tool_Base from './tools/Tool_Base';
import Brush from './tools/Brush';
import Bucket from './tools/Bucket';
import Line_Brush from './tools/Line_Brush';
import Box_Brush from './tools/Box_Brush';
import Ellipse_Brush from './tools/Ellipse_Brush';
import Eraser from './tools/Eraser';
import Eye_Dropper from './tools/Eye_Dropper';

import { ref, computed, watch, nextTick, onMounted, onBeforeUnmount } from 'vue';
import { useArtEditorStore } from '@/stores/ArtEditor';
import { Event_Bus } from '@/components/common/Event_Listener';
import Core from '@/core';

type iSpriteUndoData = {spriteData: ImageData[]}

const artEditorStore = useArtEditorStore();

const props = defineProps<{
    selectedAsset: Core.Sprite;
}>();

const emit = defineEmits(['asset-changed']);

const undoStore = new Undo_Store<iSpriteUndoData>(32);
const toolMap: Map<Core.ART_TOOL_TYPE, ()=>Tool_Base> = new Map();
let frameIDs = props.selectedAsset.frameIDs;
let tool: Tool_Base | null = null;

const selectedFrameIdx = computed({
    get(){
        return artEditorStore.getSelectedFrame;
    },
    set(newIdx){
        artEditorStore.selectFrame(newIdx);
    }
});
const selectedSize = computed(()=>artEditorStore.getSelectedSize);
const selectedTool = computed(()=>artEditorStore.getSelectedTool);

watch(props.selectedAsset, ()=>{
    undoStore.clear();

    if (props.selectedAsset && props.selectedAsset.category_ID == Core.CATEGORY_ID.SPRITE){
        const selectedFrame = artEditorStore.getSelectedFrame;

        updateFrameIDs()

        if (props.selectedAsset.frames.length < selectedFrame + 1){
            artEditorStore.selectFrame(0);
        }
    }
});
watch(artEditorStore.getSelectedColor, (newColor)=>tool.setToolColor(newColor));
watch(selectedSize, (newSize)=>tool.setToolSize(newSize));
watch(selectedTool, (newTool)=>toolSelected(newTool!));

onMounted(()=>{
    const maxFrame = props.selectedAsset.frames.length - 1;
    const selectedFrame = Math.min(selectedFrameIdx.value, maxFrame);
    
    selectedFrameIdx.value = selectedFrame;
    window.addEventListener('resize', resize);
    undoStore.setInitialState(packageUndoData());

    toolMap.set(Core.ART_TOOL_TYPE.BRUSH, ()=> new Brush());
    toolMap.set(Core.ART_TOOL_TYPE.BUCKET, ()=> new Bucket());
    toolMap.set(Core.ART_TOOL_TYPE.LINE, ()=> new Line_Brush());
    toolMap.set(Core.ART_TOOL_TYPE.BOX, ()=> new Box_Brush());
    toolMap.set(Core.ART_TOOL_TYPE.BOX_FILL, ()=> new Box_Brush(true));
    toolMap.set(Core.ART_TOOL_TYPE.ELLIPSE, ()=> new Ellipse_Brush());
    toolMap.set(Core.ART_TOOL_TYPE.ELLIPSE_FILL, ()=> new Ellipse_Brush(true));
    toolMap.set(Core.ART_TOOL_TYPE.ERASER, ()=> new Eraser());
    toolMap.set(Core.ART_TOOL_TYPE.EYE_DROPPER, ()=> new Eye_Dropper());

    toolSelected(artEditorStore.getSelectedTool!);
});

onBeforeUnmount(()=> {
    window.removeEventListener('resize', resize);
});

function resize(): void {
    ArtMainEventBus.emit('resize');
}

function spriteDataChanged(): void {
    ArtMainEventBus.emit('update-frame-previews');
    commitFullState();
    props.selectedAsset.updateFrame(selectedFrameIdx.value);
    updateFrameIDs();
    emit('asset-changed', props.selectedAsset.id);
}

function selectedFrameChanged(): void {
    updateFrameIDs();
}

function frameAdded(): void {
    commitFullState();
    updateFrameIDs();
}

function toolSelected(newTool: Core.ART_TOOL_TYPE): void {
    if (newTool){
        artEditorStore.setSelectedNavTool(null);
        tool = getTool(newTool);
        tool.setToolSize(artEditorStore.getSelectedSize);
        tool.setToolColor(artEditorStore.getSelectedColor);
        tool.setCommitCallback(spriteDataChanged);
    }
    else{
        tool = null;
    }
}

function getTool(newTool: Core.ART_TOOL_TYPE): Tool_Base {
    let getter = toolMap.get(newTool);

    if (getter){
        return getter();
    }
    else{
        console.warn("Warning: Unkown brush: \"" + newTool + ".\" Defaulting to standard brush");
        return new Brush();
    }
}

function mouseDown(event: MouseEvent): void {
    if (tool){
        tool.mouseDown(event);
    }
}

function mouseUp(event: MouseEvent): void {
    if (tool){
        tool.mouseUp(event);
    }
}

function mouseMove(event: MouseEvent): void {
    if (tool){
        tool.mouseMove(event);
    }
}

function mouseLeave(event: MouseEvent): void {
    if (tool){
        tool.mouseLeave(event);
    }
}

function commitFullState(): void {
    undoStore.commit(packageUndoData());
}

function undo(): void {
    let prevStep = undoStore.stepBack() as any;

    if (prevStep && prevStep.spriteData){
        props.selectedAsset.setFramesFromArray(prevStep.spriteData);
    }
    else{
        props.selectedAsset.setFramesFromArray(undoStore.initialState!.spriteData);
    }

    if (selectedFrameIdx.value > props.selectedAsset.frames.length - 1){
        selectedFrameIdx.value--;
    }

    updateFrameIDs();
    
    nextTick(()=>{
        ArtMainEventBus.emit('update-frame-previews');
    });
}

function redo(): void {
    let nextStep = undoStore.stepForward();

    if (nextStep && nextStep.spriteData){
        props.selectedAsset.setFramesFromArray(nextStep.spriteData);
    }

    updateFrameIDs();

    nextTick(()=>{
        ArtMainEventBus.emit('update-frame-previews');
    });
}

function packageUndoData(): iSpriteUndoData {
    return {
        spriteData: props.selectedAsset.getFramesCopy()
    }
}

function updateFrameIDs(): void {
    frameIDs = props.selectedAsset.frameIDs;
}
</script>

<template>
    <div class="artMain">
        <ToolPanel
            class="toolPanel"
            @resized="resize"/>
        <ArtCanvas
            class="artCanvas"
            ref="artCanvas"
            :tool="tool"
            :navState="selectedAsset.navState"
            :spriteFrame="selectedAsset.frames[selectedFrameIdx]"
            :debugSprite="selectedAsset"
            :undoLength="undoStore.undoLength"
            :redoLength="undoStore.redoLength"
            @mouse-down="mouseDown"
            @mouse-up="mouseUp"
            @mouse-move="mouseMove"
            @mouse-leave="mouseLeave"
            @undo="undo()"
            @redo="redo()" />
        <AnimationPanel
            class="animPanel"
            ref="animPanel"
            :sprite="selectedAsset"
            :frameIDs="frameIDs"
            @resized="resize"
            @selectedFrameChanged="selectedFrameChanged()"
            @frameAdded="frameAdded()"
            @frameDeleted="commitFullState()"
            @frameMoved="commitFullState()"
            @frameCopied="commitFullState()" />
    </div>
</template>

<style scoped>
.artMain{
    position: relative;
    display: flex;
    flex-direction: row;
    justify-content: space-between;
    width: 100%;
    height: 100%;
    margin:none;
    padding:none;
    overflow: hidden;
    background: white;
}
</style>