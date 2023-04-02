<script lang="ts">
export const AppEventBus = new Core.Event_Bus();
</script>

<script setup lang="ts">
import HeaderPanel from './components/HeaderPanel.vue';
import TabPanel from './components/TabPanel.vue';
import AssetBrowser from './components/asset_browser/AssetBrowser.vue';
import EditorWindow from './components/EditorWindow.vue';
import PlayWindow from './components/PlayWindow.vue';
import Tooltip from './components/common/Tooltip.vue';

import { onMounted } from 'vue';
import { useMainStore, PLAY_STATE } from './stores/Main';
import { useGameDataStore } from './stores/GameData';
import { useAssetBrowserStore } from './stores/AssetBrowser';
import Core, { HTMLTemplate, EngineRawText } from '@/core';

import licenseText from '@/../LICENSE.TXT?raw';

//stores
const mainStore = useMainStore();
const gameDataStore = useGameDataStore();
const assetBrowserStore = useAssetBrowserStore();

const engineLicensePreamble = `
###################################################################
# The following license pertains only to the engine code.         #
# Game content and assets that are bundled with the engine remain #
#     the sole property of the individual(s) who created them.    #
#     and can be licensed, distributed, and sold however the      #
#     user sees fit.                                              #
###################################################################
`;

onMounted(()=>{
    mainStore.newProject();
    updateEditorAsset();
});

function updateAssetPreviews(id: number): void {
    AppEventBus.emit('update-asset', id);
}

function updateEditorAsset(): void {
    AppEventBus.emit('update-editor-tabs');
}

function updateAfterDeletion(): void {
    gameDataStore.purgeMissingReferences();
}

function newProject(): void {
    mainStore.newProject();
    resetUI();
}

function openProject(data: any): void {
    mainStore.loadSaveData(data);
    resetUI();
}

function saveProject(): void {
    saveAs(mainStore.getSaveData, `${mainStore.getProjectName}.edproj`);
}

function packageGame(): void {
    const engineLicense = engineLicensePreamble + licenseText;
    const projectName = mainStore.getProjectName;
    const gameData = mainStore.getSaveData;
    const compiled = HTMLTemplate
        .replace('[title]', projectName)
        .replace('[engineLicense]', engineLicense)
        .replace('[engine]', EngineRawText)
        .replace('[gameData]', gameData);
    saveAs(compiled, `${projectName}.html`);
}

function resetUI(): void {
    assetBrowserStore.deselectAssets();
    mainStore.setSelectedEditor(Core.EDITOR_ID.ROOM);
    updateEditorAsset();
}

function saveAs(data: string, fileName: string){
    const link = document.createElement('a');
    const file = new Blob([data], {type: 'text/plain'});

    link.href = URL.createObjectURL(file);
    link.download = fileName;
    link.click();
    URL.revokeObjectURL(link.href);
}
</script>

<template>
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
    <div name="preloadedIcons" hidden>
        <img src="@/assets/error_decorator.svg" />
        <img src="@/assets/warning_decorator.svg" />
        <img src="@/assets/socket_any.svg" />
        <img src="@/assets/socket_number.svg" />
        <img src="@/assets/socket_string.svg" />
        <img src="@/assets/socket_object.svg" />
        <img src="@/assets/socket_bool.svg" />
        <img src="@/assets/checkmark.svg" />
    </div>
</template>

<style>
@import 'components/common/colorScheme.css';

html, body{
    height: 100%;
    width: 100%;
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

.playWindow-enter-from,
.playWindow-leave-to{
    top: 100%;
}
</style>
