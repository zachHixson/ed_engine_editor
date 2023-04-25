<script lang="ts">
export const AssetBrowserEventBus = new Core.Event_Bus();
</script>

<script setup lang="ts">
import Asset from './Asset.vue';
import DragList from '@/components/common/DragList.vue';
import Svg from '@/components/common/Svg.vue';

import { AppEventBus } from '@/App.vue';
import { ref, computed, nextTick, onMounted } from 'vue';
import { useI18n } from 'vue-i18n';
import { useAssetBrowserStore } from '@/stores/AssetBrowser';
import { useGameDataStore } from '@/stores/GameData';
import Core from '@/core';
import type { iChangeEventProps } from '@/components/common/DragList.vue';
import type { iRenameEventProps } from './Asset.vue';
import spriteIcon from '@/assets/sprite_icon.svg';
import objectIcon from '@/assets/object_icon.svg';
import logicIcon from '@/assets/logic.svg';
import roomIcon from '@/assets/room_icon.svg';
import arrowIcon from '@/assets/arrow_01.svg';
import plusIcon from '@/assets/plus.svg';

const { t } = useI18n();
const assetBrowserStore = useAssetBrowserStore();
const gameDataStore = useGameDataStore();

const emit = defineEmits(['asset-deleted', 'asset-selected']);

const slideWrapperRef = ref<HTMLDivElement>();
const assetListRef = ref<HTMLDivElement>();
const categories = [
    {
        cat_ID: Core.CATEGORY_ID.SPRITE,
        text: t("asset_browser.sprites"),
        icon: spriteIcon,
    },
    {
        cat_ID: Core.CATEGORY_ID.OBJECT,
        text: t("asset_browser.objects"),
        icon: objectIcon,
    },
    {
        cat_ID: Core.CATEGORY_ID.LOGIC,
        text: t("asset_browser.logic"),
        icon: logicIcon,
    },
    {
        cat_ID: Core.CATEGORY_ID.ROOM,
        text: t("asset_browser.rooms"),
        icon: roomIcon,
    }
];
const selected_category = ref<typeof categories[number]>(categories[0]);

const selectedList = computed(()=>{
    const list: Core.Asset_Base[] = [];

    switch(selected_category.value.cat_ID){
        case Core.CATEGORY_ID.SPRITE:
            list.push(...gameDataStore.getAllSprites);
            break;
        case Core.CATEGORY_ID.OBJECT:
            list.push(...gameDataStore.getAllObjects);
            break;
        case Core.CATEGORY_ID.LOGIC:
            list.push(...gameDataStore.getAllLogic);
            break;
        case Core.CATEGORY_ID.ROOM:
            list.push(...gameDataStore.getAllRooms);
            break;
    }

    list.sort((a, b) => a.sortOrder - b.sortOrder);

    return list;
});

onMounted(()=>{
    AppEventBus.addEventListener('update-asset', updateAsset);
});

function openCategory(category: typeof categories[number]): void {
    selected_category.value = category;
    slideWrapperRef.value!.classList.add('category_selected');
}

function back(): void {
    slideWrapperRef.value!.classList.remove('category_selected');
}

function addAsset(): void {
    const assetList = assetListRef.value!;

    gameDataStore.addAsset(selected_category.value.cat_ID);

    nextTick(()=>{
        if (assetList){
            assetList.scrollTop = assetList.scrollHeight - assetList.clientHeight;
        }
    });
}

function deleteAsset(asset: Core.Asset_Base): void {
    const isRoom = asset.category_ID == Core.CATEGORY_ID.ROOM;
    const selectedAsset = isRoom ? assetBrowserStore.getSelectedRoom : assetBrowserStore.getSelectedAsset;

    //if the selected asset was deleted, shift the selection to the adjacent asset
    if (selectedAsset && asset.id == selectedAsset.id){
        selectAdjacent(asset);
    }

    //Actually delete the asset from Vuex
    gameDataStore.deleteAsset(asset.category_ID, asset.id);
    emit('asset-deleted');
}

function selectAsset(asset: Core.Asset_Base, catId?: Core.CATEGORY_ID): void {
    if (asset && catId == undefined){
        catId = asset.category_ID;
    }

    if (catId == Core.CATEGORY_ID.ROOM){
        assetBrowserStore.selectRoom(asset as Core.Room);
    }
    else{
        assetBrowserStore.selectAsset(asset);
    }

    emit('asset-selected');
}

function selectAdjacent(delAsset: Core.Asset_Base): void {
    let newSelection: Core.Asset_Base;

    for (let i = 0; i < selectedList.value.length; i++){
        if (selectedList.value[i].id == delAsset.id){
            newSelection = (i > 0) ? selectedList.value[i - 1] : selectedList.value[i + 1]
        }
    }

    selectAsset(newSelection!, delAsset.category_ID);
}

function updateAsset(id?: number): void {
    AssetBrowserEventBus.emit('draw-thumbnail', id);
}

function assetRenamed({asset, oldName}: iRenameEventProps): void {
    let duplicateName = false;

    for (let i = 0; i < selectedList.value.length; i++){
        const curAsset = selectedList.value[i];

        duplicateName ||= (curAsset.name == asset.name) && !(curAsset == asset);
    }

    if (asset.name.trim().length <= 0){
        asset.name == oldName;
    }

    if (duplicateName){
        asset.name += '_' + t('room_editor.duplicate_name_suffix');
    }
}

function orderChanged(event: iChangeEventProps): void {
    const selectedListCopy = [...selectedList.value];
    const movedAsset = selectedListCopy.splice(event.itemIdx, 1);
    selectedListCopy.splice(event.newIdx, 0, ...movedAsset);
    
    for (let i = 0; i < selectedListCopy.length; i++){
        selectedListCopy[i].sortOrder = i;
    }
}

function scrollHandler(event: Event): void {
    AssetBrowserEventBus.emit('scroll');
}
</script>

<template>
    <div class="assetBrowser">
        <div ref="slideWrapperRef" class="slideWrapper">
            <div class="columns">
                <div class="categoryColumn">
                    <div class="category"
                        v-for="category in categories"
                        :key="category.cat_ID">
                        <div class="cat_title">
                            <Svg class="cat_icon" :src="category.icon"></Svg>
                            {{category.text}}
                        </div>
                        <button class="btn" @click="openCategory(category)">
                            <Svg class="btn_icon" :src="arrowIcon" style="transform: rotate(90deg);"></Svg>
                        </button>
                    </div>
                </div>
                <div class="assetListColumn">
                    <div class="assetListHeading">
                        <div class="leftHeading">
                            <button class="btn" @click="back">
                                <Svg class="btn_icon" :src="arrowIcon" style="transform: rotate(-90deg);"></Svg>
                            </button>
                            <Svg class="assetHeadingLogo" :src="selected_category.icon"></Svg>
                            {{selected_category.text}}
                        </div>
                        <div class="rightHeading">
                            <button class="addButton btn" @click="addAsset">
                                <Svg class="addButton_icon" :src="plusIcon"></Svg>
                            </button>
                        </div>
                    </div>
                    <div ref="assetListRef" class="assetList" @scroll="scrollHandler">
                        <DragList @order-changed="orderChanged">
                            <Asset
                                v-for="item in selectedList"
                                :key="item.id + Math.random()"
                                :asset="item"
                                :defaultIcon="selected_category.icon"
                                :assetBrowserEventBus="AssetBrowserEventBus"
                                :wrapperElement="slideWrapperRef!"
                                @delete-asset="deleteAsset"
                                @select-asset="selectAsset"
                                @renamed="assetRenamed" />
                        </DragList>
                        <div v-if="selectedList.length <= 0">{{$t('asset_browser.no_assets')}}</div>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<style scoped>
*{
    --heading-font-size: 1.5em;
    --btn-arrow-width: 15px;
    --btn-arrow-height: 20px;
}

.assetBrowser{
    overflow: hidden;
    height: 100%;
    user-select: none;
}

.slideWrapper{
    position: relative;
    right: 0%;
    width: 200%;
    height: 100%;
    transition: right 100ms;
    transition-timing-function: ease-out;
    padding-top: 10px;
    box-sizing: border-box;
}

.columns{
    display: flex;
    flex-direction: row;
    width: 100%;
    height: 100%;
}

.categoryColumn{
    box-sizing: border-box;
    overflow: hidden;
    padding-left: 10px;
    width: 50%;
}

.assetListColumn{
    display: flex;
    flex-direction: column;
    width: 50%;
    height: 100%;
    box-sizing: border-box;
}

.category{
    display: flex;
    align-items: center;
    justify-content: space-between;
    width: 100%;
    height: 50px;
    background: var(--heading);
    border: 2px solid var(--border);
    border-right: none;
    padding-left: 5px;
    margin-bottom: 3px;
    box-sizing: border-box;
    border-radius: var(--corner-radius) 0px 0px var(--corner-radius);
}

.cat_title{
    display: flex;
    align-items: center;
    font-weight: bold;
    font-size: var(--heading-font-size);
    color: var(--text-dark);
}

.cat_icon{
    width: 30px;
    height: 30px;
    margin: 5px;
    fill: var(--text-dark);
    stroke: var(--text-dark);
}

.category_selected{
    right: 100%;
    transition: right 100ms;
    transition-timing-function: ease-out;
}

.assetListHeading{
    display: flex;
    justify-content: space-between;
    align-items: center;
    width: 98%;
    height: 50px;
    background: var(--heading);
    border: 2px solid var(--border);
    border-left: none;
    border-radius: 0px var(--corner-radius) var(--corner-radius) 0px;
    box-sizing: border-box;
    font-size: var(--heading-font-size);
    font-weight: bold;
    color: var(--text-dark);
}

.assetHeadingLogo{
    width: 30px;
    height: 30px;
    margin: 5px;
    fill: var(--text-dark);
    stroke: var(--text-dark);
}

.leftHeading{
    display: flex;
    align-items: center;
}

.rightHeading{
    display:flex;
    align-items: center;
}

.btn{
    display: flex;
    justify-content: center;
    align-items: center;
    background: var(--button-dark-norm);
    border: 2px solid var(--border);
    padding: 5px;
    margin: 5px;
    border-radius: var(--corner-radius);
}

.btn > .btn_icon{
    width: var(--btn-arrow-width);
    height: var(--btn-arrow-height);
    stroke: var(--text-dark);
}

.btn:hover{
    background: var(--button-dark-hover);
}

.btn:active{
    background: var(--button-dark-down);
}

.addButton{
    width: 30px;
    height: 30px;
}

.addButton > .addButton_icon{
    width: 100%;
    height: 100%;
    stroke: var(--text-dark);
    fill: var(--text-dark);
}

.assetList{
    position: relative;
    box-sizing: border-box;
    height: 100%;
    overflow-y: auto;
    overflow-anchor: none;
    padding: 10px;
}
</style>