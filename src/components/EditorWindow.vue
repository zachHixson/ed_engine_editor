<script setup lang="ts">
import RoomEditor from './editor_room/RoomMain.vue';
import ArtEditor from './editor_art/ArtMain.vue';
import ObjectEditor from './editor_object/ObjectMain.vue';
// import LogicEditor from './editor_logic/LogicMain.vue';

import { ref, computed, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import { useMainStore } from '@/stores/Main';
import { useAssetBrowserStore } from '@/stores/AssetBrowser';
import Core from '@/core';

export interface DialogBoxProps {
    textInfo: {
        textId: string,
        vars: {[keys: string]: any}
    },
    callback: (...args: any)=>void,
}

const { t } = useI18n();
const mainStore = useMainStore();
const assetBrowserStore = useAssetBrowserStore();

t('test', {var1: 'string'});

const emit = defineEmits(['asset-changed']);

const selectedEditor = computed(()=>mainStore.getSelectedEditor);
const currentEditor = computed(()=>{
    switch(selectedEditor.value){
        case Core.EDITOR_ID.ROOM:
            return RoomEditor;
        case Core.EDITOR_ID.ART:
            return ArtEditor;
        case Core.EDITOR_ID.OBJECT:
            return ObjectEditor;
        case Core.EDITOR_ID.LOGIC:
            //return LogicEditor;
        default:
            return RoomEditor;
    }
});
const selectedAsset = computed(()=>assetBrowserStore.getSelectedAsset);
const selectedRoom = computed(()=>assetBrowserStore.getSelectedRoom);
const dialogConfirmText = computed((dialogTextId, dialogTextVars)=>t(dialogTextId, dialogTextVars));

watch(selectedEditor, ()=>dialogClose(false));
watch(selectedAsset, ()=>dialogClose(true));

const dialogConfirmOpen = ref<boolean>(false);
const dialogTextId = ref<string>('');
const dialogTextVars = ref<{[key: string]: any}>();
let dialogCallback: (positive: boolean)=>void = ()=>{};

function dialogConfirm({textInfo, callback}: DialogBoxProps): void {
    dialogConfirmOpen.value = true;
    dialogTextId.value = textInfo.textId;
    dialogTextVars.value = textInfo.vars;
    dialogCallback = callback;
}

function dialogClose(positive: boolean): void {
    dialogCallback(positive);
    dialogCallback = ()=>{};
    dialogConfirmOpen.value = false;
}
</script>

<template>
    <div class="editorWindow">
        <component ref="editor"
        :is="currentEditor"
        :selectedAsset="selectedAsset"
        :selectedRoom="selectedRoom"
        @asset-changed="emit('asset-changed', $event)"
        @dialog-confirm="dialogConfirm" />
        <div v-if="dialogConfirmOpen" class="dialog-confirm-bg">
            <div class="dialog-confirm-box">
                <div v-html="dialogConfirmText"></div>
                <div class="dialog-buttons">
                    <button @click="dialogClose(false)">Cancel</button>
                    <button @click="dialogClose(true)">OK</button>
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

.dialog-confirm-bg{
    position: absolute;
    display: flex;
    justify-content: center;
    align-items: center;
    width: 100%;
    height: 100%;
    background: var(--modal-bg);
    z-index: 2000;
}

.dialog-confirm-box{
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