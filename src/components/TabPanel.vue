<script setup lang="ts">
import EditorTab from './EditorTab.vue';

import { ref, onMounted } from 'vue';
import { useI18n } from 'vue-i18n';
import { useMainStore } from '@/stores/Main';
import { useAssetBrowserStore } from '@/stores/AssetBrowser';
import { AppEventBus } from '@/App.vue';
import Core from '@/core';
import roomTab from '@/assets/room_icon.svg';
import spriteIcon from '@/assets/sprite_icon.svg';
import objectIcon from '@/assets/object_icon.svg';
import logicIcon from '@/assets/logic.svg';

const { t } = useI18n();
const mainStore = useMainStore();
const assetBrowserStore = useAssetBrowserStore();

interface iEditorTab {
    id: Core.EDITOR_ID,
    logoPath: string,
    text: string,
};

const editorTabs: {[key: string]: iEditorTab} = {
    room: {
        id: Core.EDITOR_ID.ROOM,
        logoPath: roomTab,
        text: t('editor_main.room_tab')
    },
    art: {
        id: Core.EDITOR_ID.ART,
        logoPath: spriteIcon,
        text: t('editor_main.art_tab')
    },
    object: {
        id: Core.EDITOR_ID.OBJECT,
        logoPath: objectIcon,
        text: t('editor_main.object_tab')
    },
    logic: {
        id: Core.EDITOR_ID.LOGIC,
        logoPath: logicIcon,
        text: t('editor_main.logic_tab')
    },
}
const contextTabs = ref<iEditorTab[]>([]);

onMounted(()=>{
    contextTabs.value = [editorTabs.room];
    updateEditorTabs();
    mainStore.setSelectedEditor(Core.EDITOR_ID.ROOM);
    AppEventBus.addEventListener('update-editor-tabs', updateEditorTabs);
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
                :tabText="tab.text"
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
    flex-grow: 1;
}

.tabs-enter-active{
    transition: transform 200ms;
}

.tabs-enter{
    transform: translateY(100px);
}

.tabs-leave{
    display: none;
}
</style>