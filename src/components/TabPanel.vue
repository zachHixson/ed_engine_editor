<script setup lang="ts">
import EditorTab from './EditorTab.vue';

import { ref, onMounted } from 'vue';
import { useMainStore } from '@/stores/Main';
import { useAssetBrowserStore } from '@/stores/AssetBrowser';
import { useI18nStore } from '@/stores/I18n';
import { AppEventBus } from '@/App.vue';
import Core from '@/core';
import roomTab from '@/assets/room_icon.svg';
import spriteIcon from '@/assets/sprite_icon.svg';
import objectIcon from '@/assets/object_icon.svg';
import logicIcon from '@/assets/logic.svg';

const mainStore = useMainStore();
const assetBrowserStore = useAssetBrowserStore();
const { t } = useI18nStore();

interface iEditorTab {
    id: Core.EDITOR_ID,
    logoPath: string,
    text: string,
};

const editorTabs: {[key: string]: iEditorTab} = {
    room: {
        id: Core.EDITOR_ID.ROOM,
        logoPath: roomTab,
        text: 'editor_main.room_tab'
    },
    art: {
        id: Core.EDITOR_ID.ART,
        logoPath: spriteIcon,
        text: 'editor_main.art_tab'
    },
    object: {
        id: Core.EDITOR_ID.OBJECT,
        logoPath: objectIcon,
        text: 'editor_main.object_tab'
    },
    logic: {
        id: Core.EDITOR_ID.LOGIC,
        logoPath: logicIcon,
        text: 'editor_main.logic_tab'
    },
}
const contextTabs = ref<iEditorTab[]>([editorTabs.room]);

onMounted(()=>{
    updateEditorTabs();
    mainStore.setSelectedEditor(Core.EDITOR_ID.ROOM);
    AppEventBus.onUpdateEditorTabs.listen(updateEditorTabs);
});

function updateEditorTabs(){
    const currentAsset = assetBrowserStore.getSelectedAsset;
    const selectedTab = mainStore.getSelectedEditor;

    contextTabs.value = [editorTabs.room];

    if (currentAsset){
        const assetType = currentAsset.category_ID;

        switch(assetType){
            case Core.CATEGORY_ID.SPRITE:
                contextTabs.value.push(editorTabs.art);
                break;
            case Core.CATEGORY_ID.OBJECT:
                contextTabs.value.push(editorTabs.object);
                break;
            case Core.CATEGORY_ID.LOGIC:
                contextTabs.value.push(editorTabs.logic);
        }

        //if user is in tab that no longer exists, transition them to appropriate tab
        if (contextTabs.value.find(t => t.id == selectedTab) == undefined){
            let newTab = Core.EDITOR_ID.ROOM;

            switch(assetType){
                case Core.CATEGORY_ID.SPRITE:
                    newTab = Core.EDITOR_ID.ART;
                    break;
                case Core.CATEGORY_ID.OBJECT:
                    newTab = Core.EDITOR_ID.OBJECT;
                    break;
                case Core.CATEGORY_ID.LOGIC:
                    newTab = Core.EDITOR_ID.LOGIC;
                    break;
            }

            mainStore.setSelectedEditor(newTab);
        }
    }
    else{
        mainStore.setSelectedEditor(Core.EDITOR_ID.ROOM);
    }
}
</script>

<template>
    <div class="topPanel">
        <transition-group name="tabs" tag="div" class="tabContainer">
            <EditorTab
                v-for="tab in contextTabs"
                :key="tab.id"
                :editorID="tab.id"
                :tabText="t(tab.text)"
                :logoPath="tab.logoPath" />
        </transition-group>
    </div>
</template>

<style scoped>
.topPanel{
    background: var(--top-bar);
    display: flex;
    flex-direction: column;
    height: 100%;
    overflow: hidden;
}

.tabContainer{
    display: flex;
    flex-direction: row;
    height: 100%;
}

.tabs-enter-active{
    transition: transform 200ms;
}

.tabs-leave-active{
    display: none;
}

.tabs-leave-to,
.tabs-enter-from{
    transform: translateY(100px);
}
</style>