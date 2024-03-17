<script lang="ts">
export const AnimationPanelEventBus = new Core.Event_Bus();
</script>

<script setup lang="ts">
import AnimFrame from './AnimFrame.vue';
import AnimationPlayer from '@/components/common/AnimationPlayer.vue';
import HotkeyMap from '@/components/common/HotkeyMap';
import DragList from '@/components/common/DragList.vue';
import Svg from '@/components/common/Svg.vue';

import {ref, computed, watch, nextTick, onMounted, onBeforeUnmount } from 'vue';
import { useI18n } from 'vue-i18n';
import { useMainStore } from '@/stores/Main';
import { useArtEditorStore } from '@/stores/ArtEditor';
import { ArtMainEventBus } from './ArtMain.vue';
import Core from '@/core';
import arrowIcon from '@/assets/arrow_01.svg';
import animationIcon from '@/assets/animation.svg';
import plusIcon from '@/assets/plus.svg';


const { t } = useI18n();
const mainStore = useMainStore();
const artEditorStore = useArtEditorStore();

const props = defineProps<{
    sprite: Core.Sprite,
}>();

const emit = defineEmits([
    'resized',
    'frame-added',
    'frame-deleted',
    'frame-moved',
    'frame-copied',
    'selected-frame-changed',
]);

const frameListRef = ref<HTMLDivElement>();
const isOpen = ref(artEditorStore.isAnimPanelOpen);
const hotkeyMap = new HotkeyMap();
const hotkeyDown = hotkeyMap.keyDown.bind(hotkeyMap);
const hotkeyUp = hotkeyMap.keyUp.bind(hotkeyMap);

const selectedFrameIdx = computed({
    get(){
        return artEditorStore.getSelectedFrame;
    },
    set(newIdx){
        artEditorStore.selectFrame(newIdx);
    }
});
const animFrames = computed(()=>props.sprite.frames);

watch(()=>mainStore.getInputActive, (newState: boolean)=>hotkeyMap.enabled = !newState);

onMounted(()=>{
    window.addEventListener('keydown', hotkeyDown);
    window.addEventListener('keyup', hotkeyUp);

    ArtMainEventBus.addEventListener('update-frame-previews', updateFramePreviews);

    hotkeyMap.enabled = true;
    bindHotkeys();
});

onBeforeUnmount(()=>{
    window.removeEventListener('keydown', hotkeyDown);
    window.removeEventListener('keyup', hotkeyUp);

    ArtMainEventBus.removeEventListener('update-frame-previews', updateFramePreviews);
    
    artEditorStore.setAnimPanelState(isOpen.value);
});

function bindHotkeys(): void {
    const prevFrame = () => {
        if (selectedFrameIdx.value > 0){
            const newIdx = selectedFrameIdx.value - 1;
            artEditorStore.selectFrame(newIdx);
            selectedFrameChanged(newIdx);
        }
    }
    const nextFrame = () => {
        if (selectedFrameIdx.value < props.sprite.frames.length - 1){
            const newIdx = selectedFrameIdx.value + 1;
            artEditorStore.selectFrame(newIdx);
            selectedFrameChanged(newIdx);
        }
    }

    hotkeyMap.bindKey(['n'], toggleOpen);
    hotkeyMap.bindKey(['arrowleft'], prevFrame);
    hotkeyMap.bindKey(['arrowright'], nextFrame);
    hotkeyMap.bindKey(['arrowdown'], ()=>AnimationPanelEventBus.emit('play-animation'));
    hotkeyMap.bindKey(['escape'], ()=>AnimationPanelEventBus.emit('stop-animation'));
}

function toggleOpen(): void {
    isOpen.value = !isOpen.value;

    nextTick(()=>{
        AnimationPanelEventBus.emit('frame-data-changed');
        emit('resized');
    })
}

function updateFramePreviews(range: number[] = [0, props.sprite.frames.length - 1]): void {
    if (isOpen.value){
        AnimationPanelEventBus.emit('frame-data-changed', range);

        if (range.length == 1){
            range = [range[0], range[0] + 1];
        }

        for (let i = range[0]; i <= range[1]; i++){
            props.sprite.updateFrame(i);
        }
    }
}

function addFrame(): void {
    let newFrameIdx = props.sprite.addFrame();
    artEditorStore.selectFrame(newFrameIdx);
    emit('frame-added');

    nextTick(()=>{
        const frameList = frameListRef.value;

        if (frameList){
            frameList.scrollTop = frameList.scrollHeight - frameList.clientHeight;
        }
    });
}

function deleteFrame(idx: number): void {
    props.sprite.deleteFrame(idx);
    selectedFrameIdx.value = Math.min(selectedFrameIdx.value, props.sprite.frames.length - 1);
    emit('frame-deleted');
}

function frameMoved({idx, dir}: {idx: number, dir: number}): void {
    let start = idx;
    let endMin = idx + 1;

    if (dir < 0){
        start = Math.max(idx - 1, 0);
        endMin = idx + 1;
    }

    updateFramePreviews([
        start,
        Math.min(endMin, props.sprite.frames.length - 1)
    ]);
    
    emit('frame-moved');
}

function frameCopied(frameIdx: number): void {
    updateFramePreviews([frameIdx + 1]);
    emit('frame-copied');
}

function selectedFrameChanged(newIdx: number): void {
    emit('selected-frame-changed', newIdx);
}

function frameOrderChanged(event: {itemIdx: number, newIdx: number}): void {
    const {itemIdx, newIdx} = event;
    const movedFrame = props.sprite.frames[itemIdx];
    const shiftForward = itemIdx > newIdx;
    const compFunc = shiftForward ? (i: number) => i > newIdx : (i: number) => i < newIdx;
    const dir = shiftForward ? -1 : 1;

    for (let i = itemIdx; compFunc(i); i += dir){
        props.sprite.frames[i] = props.sprite.frames[i + dir];
        props.sprite.updateFrame(i);

        if (selectedFrameIdx.value == i && i != itemIdx){
            selectedFrameIdx.value -= dir;
        }
    }

    props.sprite.frames[newIdx] = movedFrame;
    props.sprite.updateFrame(newIdx);

    if (itemIdx == selectedFrameIdx.value){
        nextTick(()=>{
            selectedFrameIdx.value = newIdx;
        });
    }

    updateFramePreviews([
        0,
        props.sprite.frames.length - 1
    ]);

    emit('frame-moved');
}
</script>

<template>
    <div class="animPanel" :class="{animPanelClosed : !isOpen}">
        <div class="resizeBtnWrapper">
            <button ref="collapseBtn" class="resizeBtn" @click="toggleOpen">
                <Svg v-show="isOpen" class="arrow" :src="arrowIcon" style="transform: rotate(90deg)"></Svg>
                <Svg v-show="!isOpen" class="arrow" :src="animationIcon"></Svg>
            </button>
        </div>
        <div v-show="isOpen" ref="contents" class="panelContents">
            <div class="animPlayerWrapper">
                <AnimationPlayer
                    ref="animPlayer"
                    :sprite="sprite"
                    :fps="12"
                    :startFrame="0"
                    :loop="true"
                    :parent-event-bus="AnimationPanelEventBus"/>
            </div>
            <div v-if="isOpen" ref="frameListRef" class="scrollWrapper">
                <DragList
                    @order-changed="frameOrderChanged">
                    <AnimFrame
                        v-for="(frame, idx) in animFrames"
                        class="animFrame"
                        :key="sprite.id.toString() + idx"
                        :index="idx"
                        :sprite="sprite"
                        @selectedFrameChanged="selectedFrameChanged"
                        @frameDeleted="deleteFrame"
                        @frameCopied="frameCopied"
                        @frameMoved="frameMoved"/>
                </DragList>
                <button class="addFrame" @click="addFrame()" v-tooltip="t('art_editor.add_frame')">
                    <Svg class="icon" :src="plusIcon"></Svg>
                </button>
            </div>
        </div>
    </div>
</template>

<style scoped>
.animPanel{
    position: relative;
    display: flex;
    flex-direction: row;
    height: 95%;
    top: 50%;
    transform: translateY(-50%);
    background: var(--tool-panel-bg);
    border: 2px solid var(--border);
    border-right: none;
    border-radius: var(--corner-radius) 0px 0px var(--corner-radius);
}

.animPanelClosed{
    border: none;
}

.panelContents{
    display: flex;
    flex-direction: column;
    width: 100%;
}

.animPlayerWrapper{
    display: flex;
    justify-content: center;
    border-bottom: 1px solid black;
    padding: 10px;
}

.scrollWrapper{
    display: flex;
    flex-direction: column;
    align-items: flex-end;
    width: auto;
    padding: 5px;
    overflow-y: auto;
    overflow-anchor: none;
    scrollbar-gutter: stable both-edges;
}

.animFrame{
    margin-top: 5px;
}

.addFrame{
    width: 50px;
    height: 50px;
    flex-shrink: 0;
    margin-top: 5px;
    background: var(--button-norm);
    border: 2px solid var(--border);
    border-radius: var(--corner-radius);
}

.addFrame:hover{
    background: var(--button-hover);
}

.addFrame > .icon{
    width: 25px;
    height: 25px;
    fill: var(--button-icon);
    stroke: var(--button-icon);
    margin: auto;
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
    width: 30px;
    height: 70px;
    padding: 0;
    align-self: center;
    padding: 2px;
    background: var(--tool-panel-bg);
    border: 2px solid var(--border);
    border-right: none;
    border-radius: var(--corner-radius) 0px 0px var(--corner-radius);
}

.resizeBtn > .arrow{
    width: 100%;
    height: 100%;
    fill: var(--button-icon);
    stroke: var(--button-icon);
}
</style>