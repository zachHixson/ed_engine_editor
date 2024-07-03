<script setup lang="ts">
import RoomEditor from './editor_room/RoomMain.vue';
import ArtEditor from './editor_art/ArtMain.vue';
import ObjectEditor from './editor_object/ObjectMain.vue';
import LogicEditor from './editor_logic/LogicMain.vue';

import { ref, computed, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import { useMainStore } from '@/stores/Main';
import { useAssetBrowserStore } from '@/stores/AssetBrowser';
import Core from '@/core';

export interface DialogBoxProps {
    confirmDialog?: boolean,
    alertDialog?: boolean,
    textInfo: {
        textId: string,
        vars?: {[keys: string]: any}
    },
    callback?: (...args: any)=>void,
}

const { t } = useI18n();
const mainStore = useMainStore();
const assetBrowserStore = useAssetBrowserStore();

const emit = defineEmits(['asset-changed', 'open-node-exception']);

const currentEditor = computed(()=>{
    switch(mainStore.getSelectedEditor){
        case Core.EDITOR_ID.ROOM:
            return RoomEditor;
        case Core.EDITOR_ID.ART:
            return ArtEditor;
        case Core.EDITOR_ID.OBJECT:
            return ObjectEditor;
        case Core.EDITOR_ID.LOGIC:
            return LogicEditor;
        default:
            return RoomEditor;
    }
});
const selectedAsset = computed(()=>assetBrowserStore.getSelectedAsset);
const selectedRoom = computed(()=>assetBrowserStore.getSelectedRoom);
const dialogText = computed(()=>dialogTextVars.value ? t(dialogTextId.value, dialogTextVars.value!) : t(dialogTextId.value));

watch(()=>mainStore.getSelectedEditor, ()=>dialogClose(false));
watch(selectedAsset, ()=>dialogClose(false));

const dialogConfirmOpen = ref<boolean>(false);
const dialogAlertOpen = ref<boolean>(false);
const dialogTextId = ref<string>('');
const dialogTextVars = ref<Record<string, unknown>>();
let dialogCallback: (positive: boolean)=>void = ()=>{};

function dialogOpen({confirmDialog, alertDialog, textInfo, callback}: DialogBoxProps): void {
    dialogConfirmOpen.value = confirmDialog ?? false;
    dialogAlertOpen.value = alertDialog ?? false;
    dialogTextId.value = textInfo.textId;
    dialogTextVars.value = textInfo.vars;
    dialogCallback = callback ?? (()=>{});
}

function dialogClose(positive: boolean): void {
    dialogCallback(positive);
    dialogCallback = ()=>{};
    dialogConfirmOpen.value = false;
    dialogAlertOpen.value = false;
}

defineExpose({dialogOpen});
</script>

<template>
    <div class="editorWindow">
        <component ref="editor"
            :is="currentEditor"
            :selectedAsset="(selectedAsset as any)"
            :selectedRoom="selectedRoom"
            @asset-changed="emit('asset-changed', $event)"
            @dialog-open="(dialogOpen as unknown)"
            @open-node-exception="emit('open-node-exception', $event)" />
        <div v-if="dialogConfirmOpen" class="dialog-bg">
            <div class="dialog-box">
                <div v-html="dialogText"></div>
                <div class="dialog-buttons">
                    <button @click="dialogClose(false)">{{ t('generic.cancel') }}</button>
                    <button @click="dialogClose(true)">{{ t('generic.ok') }}</button>
                </div>
            </div>
        </div>
        <div v-if="dialogAlertOpen" class="dialog-bg">
            <div class="dialog-box">
                <div v-html="dialogText"></div>
                <div class="dialog-buttons">
                    <button @click="dialogClose(true)">{{ t('generic.ok') }}</button>
                </div>
            </div>
        </div>
    </div>
</template>

<style scoped>
.editorWindow{
    position: relative;
    display: flex;
    box-sizing: border-box;
    border-left: 2px solid var(--border);
}

.dialog-bg{
    position: absolute;
    display: flex;
    justify-content: center;
    align-items: center;
    width: 100%;
    height: 100%;
    background: var(--modal-bg);
    z-index: 2000;
}

.dialog-box{
    padding: 10px;
    background: white;
    overflow: hidden;
    border: 2px solid var(--border);
    border-radius: var(--corner-radius);
    max-width: 400px;
}

.dialog-buttons{
    display: flex;
    justify-content: end;
    width: 100%;
    margin-top: 10px;
    gap: 3px;
}

.dialog-buttons > button{
    background: var(--button-norm);
    border-radius: var(--corner-radius);
    border: 2px solid var(--border);
    font-size: medium;
    padding: 5px;
}

.dialog-buttons > button:hover{
    background: var(--button-hover);
}

.dialog-buttons > button:active{
    background: var(--button-down);
}
</style>