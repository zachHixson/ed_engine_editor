<script setup lang="ts">
import RoomEditor from './editor_room/RoomMain.vue';
import ArtEditor from './editor_art/ArtMain.vue';
import ObjectEditor from './editor_object/ObjectMain.vue';
import LogicEditor from './editor_logic/LogicMain.vue';

import { computed } from 'vue';
import { useMainStore } from '@/stores/Main';
import { useAssetBrowserStore } from '@/stores/AssetBrowser';
import Core from '@/core';

const mainStore = useMainStore();
const assetBrowserStore = useAssetBrowserStore();

const emit = defineEmits(['asset-changed', 'open-node-exception', 'dialog-open']);

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
</script>

<template>
    <div class="editorWindow">
        <component ref="editor"
            :is="currentEditor"
            :selectedAsset="(selectedAsset as any)"
            :selectedRoom="selectedRoom"
            @asset-changed="emit('asset-changed', $event)"
            @dialog-open="emit('dialog-open', $event)"
            @open-node-exception="emit('open-node-exception', $event)" />
    </div>
</template>

<style scoped>
.editorWindow{
    position: relative;
    display: flex;
    box-sizing: border-box;
    border-left: 2px solid var(--border);
}
</style>
