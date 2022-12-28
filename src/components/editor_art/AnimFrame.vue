<script setup lang='ts'>
import { ref, computed, nextTick, onMounted } from 'vue';
import { useAssetBrowserStore } from '@/stores/AssetBrowser';
import { useArtEditorStore } from '@/stores/ArtEditor';
import Core from '@/core';

const assetBrowserStore = useAssetBrowserStore();
const artEditorStore = useArtEditorStore();

const props = defineProps<{
    sprite: Core.Sprite,
    index: number,
}>();

const emit = defineEmits([
    'selected-frame-changed',
    'frame-deleted',
    'frame-copied',
    'frame-moved',
]);

const hover = ref(false);
const canvasRef = ref<HTMLCanvasElement>();
const wrapperRef = ref<HTMLDivElement>();
const checkerBGBuff: HTMLCanvasElement = Core.Draw.createHDPICanvas(500, 500);
const pixelBuff: HTMLCanvasElement = Core.Draw.createCanvas(Core.Sprite.DIMENSIONS, Core.Sprite.DIMENSIONS);

const selectedFrameIdx = computed(()=>artEditorStore.getSelectedFrame);
const isSelected = computed(()=>selectedFrameIdx.value == props.index);
const canDelete = computed(()=>props.sprite.frames.length > 1);
const isFirst = computed(()=>props.index == 0);
const isLast = computed(()=>props.index >= props.sprite.frames.length - 1);

onMounted(()=>{
    nextTick(()=>{
        const canvas = canvasRef.value!;
        const {clientWidth, clientHeight} = wrapperRef.value!;

        Core.Draw.resizeHDPICanvas(canvas, clientWidth, clientHeight);
        Core.Draw.resizeHDPICanvas(checkerBGBuff, canvas.width, canvas.height);

        Core.Draw.drawCheckerBG(checkerBGBuff, 4, "#B5B5B5", '#CCCCCC');

        drawCanvas();
    });
});

function getSprite(): Core.Sprite {
    return assetBrowserStore.getSelectedAsset as Core.Sprite;
}

function drawCanvas(): void {
    const canvas = canvasRef.value!;
    const ctx = canvas.getContext('2d')!;
    
    ctx.drawImage(checkerBGBuff, 0, 0, canvas.width, canvas.height);

    if (props.sprite.frames[props.index]){
        const scaleFac = canvas.width / Core.Sprite.DIMENSIONS;

        props.sprite.drawToCanvas(props.index, pixelBuff);

        ctx.imageSmoothingEnabled = false;

        ctx.scale(scaleFac, scaleFac);
        ctx.drawImage(pixelBuff, 0, 0, pixelBuff.width, pixelBuff.height);
        ctx.resetTransform();
    }
}

function updateCanvas(): void {
    drawCanvas();
}

function selectFrame(idx: number = props.index): void {
    artEditorStore.selectFrame(idx);
    emit('selected-frame-changed');
}

function deleteFrame(event: MouseEvent): void {
    event.stopPropagation();
    emit('frame-deleted', props.index);
}

function copyFrame(event: MouseEvent): void {
    let selectedFrame = selectedFrameIdx.value;

    event.stopPropagation();

    if (props.index < selectedFrame){
        selectedFrame += 1;
    }
    
    props.sprite.copyFrame(props.index);
    artEditorStore.selectFrame(selectedFrame);
    emit('frame-copied', props.index);
}

function moveFrame(event: MouseEvent, dir: number): void {
    let selectFrame = selectedFrameIdx.value;

    event.stopPropagation();

    if (isSelected.value){
        selectFrame += dir;
    }
    
    props.sprite.moveFrame(props.index, dir);
    artEditorStore.selectFrame(selectFrame);
    emit('selected-frame-changed');
    emit('frame-moved', {idx: props.index, dir});
}
</script>

<template>
    <div
        class="animFrame"
        ref="wrapperRef"
        @click="selectFrame()"
        @mouseover="hover = true"
        @mouseleave="hover = false"
        :class="{selected: isSelected}">
        <canvas ref="canvasRef">
            //Error loading HTML5 canvas
        </canvas>
        <button
            class="button deleteFrame"
            v-show="canDelete && hover"
            @click="deleteFrame"
            v-tooltip="$t('art_editor.delete_frame')">
            <img class="btnIcon" src="@/assets/trash.svg" style="fill: none"/>
        </button>
        <button
            class="button copyFrame"
            v-show="hover"
            @click="copyFrame">
            <img class="btnIcon" src="@/assets/copy.svg"/>
        </button>
        <button
            class="button moveUp"
            v-show="hover && !isFirst"
            @click="moveFrame($event, -1)">
            <img  class="btnIcon" src="@/assets/arrow_01.svg"/>
        </button>
        <button
            class="button moveDown"
            v-show="hover && !isLast"
            @click="moveFrame($event, 1)">
            <img class="btnIcon" src="@/assets/arrow_01.svg" style="transform: rotate(-180deg)"/>
        </button>
    </div>
</template>

<style scoped>
.animFrame{
    position: relative;
    width: 100px;
    height: 100px;
    border: 4px solid var(--border);
    border-radius: 10px;
    background: #CC0000;
    overflow: hidden;
}

.animFrame:hover:not(.selected){
    border-color: var(--button-hover);
}

.selected{
    border-color: var(--selection);
}

.button{
    position: absolute;
    display: flex;
    justify-content: center;
    align-items: center;
    width: 20px;
    height: 20px;
    background: var(--button-norm);
    border: none;
}

.btnIcon{
    width: 15px;
    height: 15px;
    fill: var(--button-icon);
    stroke: var(--button-icon);
}

.button:hover{
    background: var(--button-hover);
}

.deleteFrame{
    right: 0;
    top: 0;
}

.copyFrame{
    right: 0;
    bottom: 0;
}

.moveUp{
    left: 0;
    top: 0;
}

.moveDown{
    left: 0;
    bottom: 0;
}
</style>