<script lang="ts">
export const ArtMainEventBus = new Core.Event_Bus();
</script>

<script setup lang="ts">
import Undo_Store from '@/components/common/Undo_Store';
import ToolPanel from './ToolPanel.vue';
import ArtCanvas from './ArtCanvas.vue';
import AnimationPanel from './AnimationPanel.vue';
import type Tool_Base from './tools/Tool_Base';
import Brush from './tools/Brush';
import Bucket from './tools/Bucket';
import Line_Brush from './tools/Line_Brush';
import Box_Brush from './tools/Box_Brush';
import Ellipse_Brush from './tools/Ellipse_Brush';
import Eraser from './tools/Eraser';
import Eye_Dropper from './tools/Eye_Dropper';

import { ref, reactive, computed, watch, nextTick, onMounted, onBeforeUnmount } from 'vue';
import { useArtEditorStore } from '@/stores/ArtEditor';
import Core from '@/core';
import Move from './tools/Move';

type iSpriteUndoData = {spriteData: ImageData[]}

const artEditorStore = useArtEditorStore();

const props = defineProps<{
    selectedAsset: Core.Sprite;
}>();

const emit = defineEmits(['asset-changed']);

const undoStore = reactive(new Undo_Store<iSpriteUndoData>(32));
const toolMap: Map<Core.ART_TOOL_TYPE, ()=>Tool_Base> = new Map();
const tool = ref<Tool_Base | null>(null);

const selectedFrameIdx = computed({
    get(){
        return Math.min(props.selectedAsset.frames.length - 1, artEditorStore.getSelectedFrame);
    },
    set(newIdx){
        artEditorStore.selectFrame(newIdx);
    }
});
const undoLength = computed(()=>undoStore.undoLength);
const redoLength = computed(()=>undoStore.redoLength);

watch(()=>props.selectedAsset, ()=>{
    undoStore.clear();

    if (props.selectedAsset && props.selectedAsset.category_ID == Core.CATEGORY_ID.SPRITE){
        const selectedFrame = artEditorStore.getSelectedFrame;

        if (props.selectedAsset.frames.length < selectedFrame + 1){
            artEditorStore.selectFrame(selectedFrameIdx.value);
        }
    }
});
watch(()=>artEditorStore.getSelectedColor, (newColor)=>tool.value!.setToolColor(newColor));
watch(()=>artEditorStore.getSelectedSize, (newSize)=>tool.value!.setToolSize(newSize));
watch(()=>artEditorStore.getSelectedTool, (newTool)=>toolSelected(newTool!));

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
    toolMap.set(Core.ART_TOOL_TYPE.MOVE, ()=>new Move());
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
    render();
    commitFullState();
    props.selectedAsset.updateFrame(selectedFrameIdx.value);
    emit('asset-changed', props.selectedAsset.id);
}

function render(): void {
    ArtMainEventBus.emit('update-frame-previews');
}

function framesMoved(): void {
    commitFullState();
    emit('asset-changed', props.selectedAsset.id);
}

function frameAdded(): void {
    commitFullState();
}

function toolSelected(newTool: Core.ART_TOOL_TYPE): void {
    if (newTool){
        artEditorStore.setSelectedNavTool(null);
        tool.value = getTool(newTool);
        tool.value.setToolSize(artEditorStore.getSelectedSize);
        tool.value.setToolColor(artEditorStore.getSelectedColor);
        tool.value.setCommitCallback(spriteDataChanged);
        tool.value.setRenderCallback(render);
    }
    else{
        tool.value = null;
    }
}

function getTool(newTool: Core.ART_TOOL_TYPE): Tool_Base {
    const getter = toolMap.get(newTool);

    if (getter){
        return getter();
    }
    else{
        console.warn("Warning: Unkown brush: \"" + newTool + ".\" Defaulting to standard brush");
        return new Brush();
    }
}

function mouseDown(event: MouseEvent): void {
    if (tool.value){
        tool.value.mouseDown(event);
    }
}

function mouseUp(event: MouseEvent): void {
    if (tool.value){
        tool.value.mouseUp(event);
    }
}

function mouseMove(event: MouseEvent): void {
    if (tool.value){
        tool.value.mouseMove(event);
    }
}

function mouseLeave(event: MouseEvent): void {
    if (tool.value){
        tool.value.mouseLeave(event);
    }
}

function commitFullState(): void {
    undoStore.commit(packageUndoData());
}

function undo(): void {
    const prevStep = undoStore.stepBack() as any;

    if (prevStep && prevStep.spriteData){
        props.selectedAsset.setFramesFromArray(prevStep.spriteData);
    }
    else{
        props.selectedAsset.setFramesFromArray(undoStore.initialState!.spriteData);
    }

    if (selectedFrameIdx.value > props.selectedAsset.frames.length - 1){
        selectedFrameIdx.value--;
    }
    
    nextTick(()=>{
        ArtMainEventBus.emit('update-frame-previews');
        emit('asset-changed', props.selectedAsset.id);
    });
}

function redo(): void {
    const nextStep = undoStore.stepForward();

    if (nextStep && nextStep.spriteData){
        props.selectedAsset.setFramesFromArray(nextStep.spriteData);
    }

    nextTick(()=>{
        ArtMainEventBus.emit('update-frame-previews');
        emit('asset-changed', props.selectedAsset.id);
    });
}

function packageUndoData(): iSpriteUndoData {
    return {
        spriteData: props.selectedAsset.getFramesCopy()
    }
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
            :tool="(tool as Tool_Base | null)"
            :navState="selectedAsset.navState!"
            :spriteFrame="selectedAsset.frames[selectedFrameIdx]"
            :undoLength="undoLength"
            :redoLength="redoLength"
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
            @resized="resize"
            @frame-added="frameAdded()"
            @frame-deleted="commitFullState()"
            @frame-moved="framesMoved"
            @frame-copied="commitFullState()" />
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

.artMain > * {
    user-select: none;
}
</style>