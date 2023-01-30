<script lang="ts">
export interface iRenameEventProps {
    asset: Core.Asset_Base,
    oldName: string,
}
</script>

<script setup lang="ts">
import Svg from '@/components/common/Svg.vue';

import {
    ref,
    computed,
    nextTick,
    getCurrentInstance,
    onMounted,
    onBeforeUnmount
} from 'vue';
import { useAssetBrowserStore } from '@/stores/AssetBrowser';
import type Core from '@/core';

import renameIcon from '@/assets/rename.svg';
import trashicon from '@/assets/trash.svg';

const assetBrowserStore = useAssetBrowserStore();

const props = defineProps<{
    asset: Core.Asset_Base,
    defaultIcon: string,
    assetBrowserEventBus: Core.Event_Bus;
}>();

const emit = defineEmits(['delete-asset', 'select-asset', 'renamed']);

const assetRef = ref<HTMLElement>();
const renameTextRef = ref<HTMLInputElement>();
const thumbnailRef = ref<HTMLCanvasElement>();
const isRenaming = ref(false);
const oldName = ref<string | null>(null);
const thumbnail = ref<HTMLCanvasElement | null>(null);
const isVisible = ref(false);
let observer: IntersectionObserver | null = null;

const isSelected = computed(()=>{
    const selectedAsset = assetBrowserStore.getSelectedAsset;
    const selectedRoom = assetBrowserStore.getSelectedRoom;
    let isSelected = false;

    isSelected ||= (selectedAsset) ? selectedAsset.id == props.asset.id : false;
    isSelected ||= (selectedRoom) ? selectedRoom.id == props.asset.id : false;

    return !!isSelected;
});

onMounted(()=>{
    const thisEl = getCurrentInstance()?.subTree.el as HTMLElement;
    const { parentElement } = thisEl;
    const observableOptions = {
        root: parentElement,
        rootMargin: '0px',
        threshold: 1.0
    };

    observer = new IntersectionObserver((entry)=>{
        isVisible.value = entry[0].isIntersecting;
        drawThumbnail();
    }, observableOptions);
    observer.observe(thisEl);
    assetRef.value!.addEventListener('dblclick', rename);
    drawThumbnail();
});

onBeforeUnmount(()=>document.removeEventListener('keydown', onEnterPress));

function deleteAsset(event: MouseEvent): void {
    event.stopPropagation();
    isRenaming.value = false;
    emit('delete-asset', props.asset);
}

function selectAsset(event: MouseEvent): void {
    event.preventDefault();
    emit('select-asset', props.asset);
}

function rename(): void {
    isRenaming.value = true;
    oldName.value = props.asset.name;
    document.addEventListener('keydown', onEnterPress);
    nextTick(()=>{
        renameTextRef.value!.focus();
        renameTextRef.value!.select();
    });
}

function stopRenaming(): void {
    if (isRenaming.value){
        isRenaming.value = false;
        emit('renamed', {asset: props.asset, oldName: oldName.value});
        document.removeEventListener('keydown', onEnterPress);
    }
}

function onEnterPress(event: KeyboardEvent): void {
    if (event.key == 'Enter'){
        stopRenaming();
    }
}

function drawThumbnail(): void {
    thumbnail.value = props.asset.thumbnail;

    if (thumbnail.value && isVisible.value){
        const thumbnailCanvas = thumbnailRef.value!;
        const canvas = thumbnailCanvas;
        const ctx = canvas.getContext('2d')!;
        const scaleFac = canvas.width / thumbnail.value.width;

        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.scale(scaleFac, scaleFac);
        ctx.drawImage(thumbnail.value, 0, 0, thumbnail.value.width, thumbnail.value.height);
        ctx.resetTransform();
    }
}
</script>

<template>
    <div ref="assetRef" class="asset" :class="{selected : isSelected}" @click="selectAsset">
        <div class="leftFloat" v-click-outside="stopRenaming">
            <canvas v-show="thumbnail" class="thumbnail" ref="thumbnailRef" width="20" height="20">Error</canvas>
            <Svg v-if="!thumbnail" class="thumbnail assetIcon" :src="props.defaultIcon"></Svg>
            <div v-show="isRenaming">
                <input class="nameBox" ref="renameTextRef" v-model="asset.name" type="text" v-input-active/>
            </div>
            <div class="nameBox" v-show="!isRenaming">{{asset.name}}</div>
        </div>
        <div class="rightFloat">
            <button class="rightButton" @click="(event)=>{event.stopPropagation(); isRenaming ? stopRenaming() : rename();}">
                <Svg class="rightIcon" style="width:30px; height:30px;" :src="renameIcon"></Svg>
            </button>
            <button class="rightButton" @click="deleteAsset">
                <Svg class="rightIcon" :src="trashicon"></Svg>
            </button>
        </div>
    </div>
</template>

<style scoped>
.asset{
    display: flex;
    justify-content: space-between;
    box-sizing: border-box;
    width: 100%;
    padding: 5px;
    border-radius: var(--corner-radius);
    background: var(--main-bg);
}

.nameBox{
    min-width: 0;
    max-width: 8em;
    overflow: hidden;
    white-space: nowrap;
    text-overflow: ellipsis;
}

.selected{
    background: var(--selection);
}

.leftFloat{
    display: flex;
    align-items: center;
}

.rightFloat{
    display: flex;
    align-items: center;
}

.rightButton{
    background: none;
    padding: 0;
    border: none;
}

.thumbnail{
    margin: 5px;
}

.assetIcon{
    width: 20px;
    height: 20px;
    fill: var(--button-icon);
    stroke: var(--button-icon);
}

.rightIcon{
    width: 20px;
    height: 20px;
    margin: 3px;
    stroke: var(--button-icon);
}
</style>