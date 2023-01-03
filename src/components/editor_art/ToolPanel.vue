<script setup lang="ts">
import HotkeyMap from '@/components/common/HotkeyMap';
import ColorPicker from '@/components/common/ColorPicker.vue';
import Tool from '@/components/common/Tool.vue';
import Svg from '@/components/common/Svg.vue';

import { computed, watch, nextTick, onMounted, onBeforeUnmount } from 'vue';
import { useI18n } from 'vue-i18n';
import { useMainStore } from '@/stores/Main';
import { useArtEditorStore } from '@/stores/ArtEditor';
import Core from '@/core';
import smallBrushIcon from '@/assets/small_brush.svg';
import mediumBrushIcon from '@/assets/medium_brush.svg';
import largeBrushIcon from '@/assets/large_brush.svg';
import brushIcon from '@/assets/brush.svg';
import bucketIcon from '@/assets/bucket.svg';
import lineIcon from '@/assets/line.svg';
import boxIcon from '@/assets/box.svg';
import boxFilledIcon from '@/assets/box_filled.svg';
import circleIcon from '@/assets/circle.svg';
import circleFilledIcon from '@/assets/circle_filled.svg';
import eraserIcon from '@/assets/eraser.svg';
import eyeDropperIcon from '@/assets/eye_dropper.svg';
import arrowIcon from '@/assets/arrow_01.svg';

const { t } = useI18n();
const mainStore = useMainStore();
const artEditorStore = useArtEditorStore();

const emit = defineEmits(['resized']);

const brushSizes = [
    {
        tool: Core.ART_TOOL_SIZE.SMALL,
        name: t('art_editor.small_brush'),
        icon: smallBrushIcon,
    },
    {
        tool: Core.ART_TOOL_SIZE.MEDIUM,
        name: t('art_editor.medium_brush'),
        icon: mediumBrushIcon,
    },
    {
        tool: Core.ART_TOOL_SIZE.LARGE,
        name: t('art_editor.large_brush'),
        icon: largeBrushIcon,
    }
];
const brushes = [
    {
        tool: Core.ART_TOOL_TYPE.BRUSH,
        name: t('art_editor.brush_tool'),
        icon: brushIcon,
    },
    {
        tool: Core.ART_TOOL_TYPE.BUCKET,
        name: t('art_editor.bucket_tool'),
        icon: bucketIcon,
    },
    {
        tool: Core.ART_TOOL_TYPE.LINE,
        name: t('art_editor.line_tool'),
        icon: lineIcon,
    },
    {
        tool: Core.ART_TOOL_TYPE.BOX,
        name: t('art_editor.box_stroke_tool'),
        icon: boxIcon,
    },
    {
        tool: Core.ART_TOOL_TYPE.BOX_FILL,
        name: t('art_editor.box_fill_tool'),
        icon: boxFilledIcon,
    },
    {
        tool: Core.ART_TOOL_TYPE.ELLIPSE,
        name: t('art_editor.circle_stroke_tool'),
        icon: circleIcon,
    },
    {
        tool: Core.ART_TOOL_TYPE.ELLIPSE_FILL,
        name: t('art_editor.circle_fill_tool'),
        icon: circleFilledIcon,
    },
    {
        tool: Core.ART_TOOL_TYPE.ERASER,
        name: t('art_editor.eraser_tool'),
        icon: eraserIcon,
    },
    {
        tool: Core.ART_TOOL_TYPE.EYE_DROPPER,
        name: t('art_editor.eye_dropper_tool'),
        icon: eyeDropperIcon,
    }
];
const hotkeyMap = new HotkeyMap();
const keyUp = hotkeyMap.keyUp.bind(hotkeyMap);
const keyDown = hotkeyMap.keyDown.bind(hotkeyMap);

const toolColor = computed({
    get(){
        return artEditorStore.getSelectedColor;
    },
    set(newCol){
        artEditorStore.selectColor(newCol);
    }
});
const toolSize = computed({
    get(){
        return artEditorStore.getSelectedSize;
    },
    set(newSize){
        artEditorStore.selectSize(newSize);
    }
});
const toolId = computed({
    get(){
        return artEditorStore.getSelectedTool;
    },
    set(newTool){
        artEditorStore.selectTool(newTool);
    }
});
const isOpen = computed({
    get(){
        return artEditorStore.isToolPanelOpen;
    },
    set(newVal: boolean){
        artEditorStore.setToolPanelState(newVal);
    }
});

watch(()=>mainStore.getInputActive, (newState)=>hotkeyMap.enabled = !newState);

onMounted(()=>{
    window.addEventListener('keydown', keyDown);
    window.addEventListener('keyup', keyUp);

    bindHotkeys();

    emit('resized');
});

onBeforeUnmount(()=>{
    window.removeEventListener('keydown', keyDown);
    window.removeEventListener('keyup', keyUp);
});

function bindHotkeys(): void {
    hotkeyMap.enabled = true;

    hotkeyMap.bindKey(['t'], toggleOpen);

    //size hotkeys
    hotkeyMap.bindKey(['1'], sizeChanged, [Core.ART_TOOL_SIZE.SMALL]);
    hotkeyMap.bindKey(['2'], sizeChanged, [Core.ART_TOOL_SIZE.MEDIUM]);
    hotkeyMap.bindKey(['3'], sizeChanged, [Core.ART_TOOL_SIZE.LARGE]);

    //layout based hotkeys
    hotkeyMap.bindKey(['b'], toolChanged, [Core.ART_TOOL_TYPE.BRUSH]);
    hotkeyMap.bindKey(['f'], toolChanged, [Core.ART_TOOL_TYPE.BUCKET]);
    hotkeyMap.bindKey(['x'], toolChanged, [Core.ART_TOOL_TYPE.LINE]);
    hotkeyMap.bindKey(['s'], toolChanged, [Core.ART_TOOL_TYPE.BOX]);
    hotkeyMap.bindKey(['alt', 's'], toolChanged, [Core.ART_TOOL_TYPE.BOX_FILL]);
    hotkeyMap.bindKey(['c'], toolChanged, [Core.ART_TOOL_TYPE.ELLIPSE]);
    hotkeyMap.bindKey(['alt', 'c'], toolChanged, [Core.ART_TOOL_TYPE.ELLIPSE_FILL]);
    hotkeyMap.bindKey(['e'], toolChanged, [Core.ART_TOOL_TYPE.ERASER]);
    hotkeyMap.bindKey(['d'], toolChanged, [Core.ART_TOOL_TYPE.EYE_DROPPER]);
}

function toggleOpen(): void {
    isOpen.value = !isOpen.value;
    nextTick(()=>{
        emit('resized');
    });
}

function colorChanged(newColor: Core.Draw.Color): void {
    toolColor.value = newColor;
}

function sizeChanged(newSize: Core.ART_TOOL_SIZE): void {
    toolSize.value = newSize;
}

function toolChanged(newTool: Core.ART_TOOL_TYPE): void {
    toolId.value = newTool
}
</script>

<template>
    <div class="toolPanel">
        <div class="tool-panel-wrapper" :class="{toolPanelWrapperClosed : !isOpen}">
            <div v-show="isOpen" class="panel-contents">
                <div class="picker-wrapper">
                    <ColorPicker
                        :width="200"
                        :color="toolColor"
                        @change-end="colorChanged"/>
                </div>
                <div class="brush-size-container">
                    <Tool
                        :key="size.tool"
                        v-for="size in brushSizes"
                        :icon="size.icon"
                        :tool="size.tool"
                        :name="size.name"
                        :curSelection="toolSize"
                        @toolClicked="sizeChanged"/>
                </div>
                <div class="tool-type">
                    <Tool
                        :key="brush.tool"
                        v-for="brush in brushes"
                        :icon="brush.icon"
                        :tool="brush.tool"
                        :name="brush.name"
                        :curSelection="toolId"
                        @toolClicked="toolChanged"/>
                </div>
            </div>
            <div class="resize-btn-wrapper">
                <button class="resize-btn" ref="collapse-button" @click="toggleOpen">
                    <Svg v-show="isOpen" :src="arrowIcon" style="transform: rotate(-90deg)"></Svg>
                    <Svg v-show="!isOpen" :src="brushIcon"></Svg>
                </button>
            </div>
        </div>
    </div>
</template>

<style scoped>
.tool-panel-wrapper{
    position: relative;
    background: var(--tool-panel-bg);
    border: 2px solid var(--border);
    border-left: none;
    border-radius: 0px var(--corner-radius) var(--corner-radius) 0px;
    height: 95%;
    top: 50%;
    transform: translateY(-50%);
    z-index: 10;
}

.toolPanelWrapperClosed{
    border: none;
}

.panel-contents{
    display: flex;
    flex-direction: column;
    align-items: center;
    align-content:flex-start;
    flex-grow: 1;
    width: 200pt;
    height: 100%;
    overflow-y: auto;
}

.picker-wrapper{
    display: flex;
    justify-content: center;
    padding: 10pt;
}

.brush-size-container{
    display: flex;
    flex-wrap: wrap;
    justify-content: center;
    border-bottom: 1px solid black;
    width: 100%;
}

.tool-type{
    display: flex;
    flex-wrap: wrap;
    justify-content: center;
}

.collapse-button{
    align-self: center;
    display: flex;
    justify-content: center;
    align-items: center;
    flex-grow: 1;
    width: 20px;
    height: 50px;
    background: none;
    border: 1px solid black;
}

.resize-btn-wrapper{
    position: absolute;
    right: 0;
    top: 50%;
    transform: translate(100%, -50%);
}

.resize-btn{
    position: relative;
    width: 30px;
    height: 70px;
    padding: 0;
    padding: 2px;
    background: var(--tool-panel-bg);
    border: 2px solid var(--border);
    border-left: none;
    border-radius: 0px var(--corner-radius) var(--corner-radius) 0px;
    z-index: 15;
}

.resize-btn > img{
    width: 100%;
    height: 100%;
}
</style>