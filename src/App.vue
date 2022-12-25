<script setup lang="ts">
import HeaderPanel from './components/HeaderPanel.vue';
import TabPanel from './components/TabPanel.vue';
import AssetBrowser from './components/asset_browser/AssetBrowser.vue';
import EditorWindow from './components/EditorWindow.vue';
import PlayWindow from './components/PlayWindow.vue';
import Tooltip from './components/common/Tooltip.vue';

import { ref, onMounted } from 'vue';
import {saveAs} from 'file-saver';
import { useMainStore, PLAY_STATE } from './stores/Main';
import { useGameDataStore } from './stores/GameData';
import { useAssetBrowserStore } from './stores/AssetBrowser';

//stores
const mainStore = useMainStore();
const gameDataStore = useGameDataStore();
const assetBrowserStore = useAssetBrowserStore();

//refs
const assetBrowser = ref<AssetBrowser>(null);
const tabPanel = ref<TabPanel>(null);

onMounted(()=>{
    mainStore.newProject();
    mainStore.getNodeAPI.setGlobalStore(mainStore);
    updateEditorAsset();
});

function updateAssetPreviews(id: number): void {
    assetBrowser.updateAsset(id);
}

function updateEditorAsset(): void {
    tabPanel.updateEditorTabs();
}

function updateAfterDeletion(): void {
    gameDataStore.purgeMissingReferences();
}

function newProject(): void {
    mainStore.newProject();
}

function openProject(data: any): void {
    mainStore.loadSaveData(data);
    resetUI();
}

function saveProject(): void {
    let blob = new Blob([mainStore.getSaveData]);
    saveAs(blob, `${mainStore.getProjectName}.edproj`);
}

function packageGame(): void {
    let projectName = mainStore.getProjectName;
    let engine = (document.getElementById('engine') as HTMLElement).innerHTML;
    let gameData = mainStore.getSaveData;
    let compiled = template.replace('[title]', projectName)
        .replace('[engine]', engine)
        .replace('[gameData]', gameData);
    let blob = new Blob([compiled]);
    saveAs(blob, `${projectName}.html`);
}

function resetUI(): void {
    assetBrowserStore.deselectAssets();
    mainStore.setSelectedEditor(Core.EDITOR_ID.ROOM);
    updateEditorAsset();
}
</script>

<template>
    <div id="app">
        <HeaderPanel class="headerPanel"
            @new-project="newProject"
            @open-project="openProject"
            @save-project="saveProject"
            @package-game="packageGame" />
        <TabPanel class="TabPanel" ref="tabPanel"/>
        <AssetBrowser class="assetBrowser" ref="assetBrowser" @asset-selected="updateEditorAsset" @asset-deleted="updateAfterDeletion" />
        <EditorWindow class="editorWindow" ref="editorWindow" @asset-changed="updateAssetPreviews"/>
        <transition name="playWindow">
            <PlayWindow v-if="mainStore.getPlayState != PLAY_STATE.NOT_PLAYING" class="playWindow" />
        </transition>
        <Tooltip />
    </div>
</template>

<style>
@import 'components/common/colorScheme.css';

html, body{
    height: 100%;
    margin: 0px;
    padding: 0px;
    overflow: hidden;
}

#app {
    position: relative;
    font-family: Avenir, Helvetica, Arial, sans-serif;
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
    display: grid;
    grid-template-areas:
        "headerPanel headerPanel"
        ". tabPanel"
        "assetBrowser editorWindow";
    grid-template-columns: 250px 1fr;
    grid-template-rows: 60px 60px minmax(0, 1fr);
    width: 100%;
    height: 100%;
    max-height: 100vh;
    background: var(--main-bg);
}

.headerPanel{
    grid-area: headerPanel;
}

.TabPanel{
    grid-area: tabPanel;
}

.assetBrowser{
    grid-area: assetBrowser;
}

.editorWindow{
    grid-area: editorWindow;
}

.playWindow{
    position: absolute;
    top: 0%;
    transition: top 0.3s ease-in-out;
    z-index: 1000;
}

.playWindow-enter,
.playWindow-leave-active{
    top: 100%;
}
</style>
