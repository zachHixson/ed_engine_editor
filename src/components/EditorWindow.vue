<script setup lang="ts">
import RoomEditor from './editor_room/RoomMain.vue';
import ArtEditor from './editor_art/ArtMain.vue';
import ObjectEditor from './editor_object/ObjectMain.vue';
import LogicEditor from './editor_logic/LogicMain.vue';
import type { DialogBoxProps } from './DialogBox.vue';

import { computed } from 'vue';
import { useMainStore } from '@/stores/Main';
import { useAssetBrowserStore } from '@/stores/AssetBrowser';
import Core from '@/core';

const mainStore = useMainStore();
const assetBrowserStore = useAssetBrowserStore();

const emit = defineEmits<{
    assetChanged: [number],
    openNodeException: [{nodeId: number, logicId: number}],
    dialogOpen: [DialogBoxProps],
}>();

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
            @assetChanged="emit('assetChanged', $event)"
            @dialogOpen="emit('dialogOpen', $event)"
            @openNodeException="emit('openNodeException', $event)" />
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
