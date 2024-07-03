<script lang="ts">
export const AppEventBus = {
    onUpdateAsset: new Core.Event_Emitter<(id?: number)=>void>(),
    onUpdateEditorTabs: new Core.Event_Emitter<()=>void>(),
    onAssetDeleted: new Core.Event_Emitter<()=>void>(),
    onOpenNodeException: new Core.Event_Emitter<(nodeId: number, logicId: number)=>void>(),
}
</script>

<script setup lang="ts">
import HeaderPanel from './components/HeaderPanel.vue';
import TabPanel from './components/TabPanel.vue';
import AssetBrowser from './components/asset_browser/AssetBrowser.vue';
import EditorWindow, { type DialogBoxProps } from './components/EditorWindow.vue';
import PlayWindow from './components/PlayWindow.vue';
import WelcomeModal from './components/WelcomeModal.vue';
import Tooltip from './components/common/Tooltip.vue';

import { ref, onMounted, nextTick } from 'vue';
import { useMainStore, PLAY_STATE } from './stores/Main';
import { useGameDataStore } from './stores/GameData';
import { useAssetBrowserStore } from './stores/AssetBrowser';
import { useLogicEditorStore } from './stores/LogicEditor';
import type Logic from './components/editor_logic/node_components/Logic';
import Core, { HTMLTemplate, EngineRawText } from '@/core';

import licenseText from '@/../LICENSE.txt?raw';
import { useI18n } from 'vue-i18n';

//stores
const mainStore = useMainStore();
const gameDataStore = useGameDataStore();
const assetBrowserStore = useAssetBrowserStore();
const logicEditorStore = useLogicEditorStore();
const { t } = useI18n();

const engineLicensePreamble = `
###################################################################
# The following license pertains only to the engine code.         #
# The game, game contents, and assets that are bundled with the   #
#     engine remain the sole property of the individual(s) who    #
#     created them, and can be licensed, distributed,             #
#     and sold however the individual(s) see fit.                 #
###################################################################
`;

const autoSaving = ref(false);
const editorWindowEl = ref<InstanceType<typeof EditorWindow>>();
const welcomeDialogEl = ref<InstanceType<typeof WelcomeModal>>();

onMounted(()=>{
    const autoLoadData = localStorage.getItem('autoLoad');

    mainStore.newProject();
    updateEditorAsset();

    //setup debug commands
    (<any>window).setAutoLoad = ()=>{
        autoSave();
    };
    (<any>window).clearAutoLoad = ()=>{
        localStorage.setItem('autoLoad', '');
    };
    (<any>window).enableAutoSave = ()=>{
        localStorage.removeItem('disableAutoSave');
    };
    (<any>window).disableAutoSave = ()=>{
        localStorage.setItem('disableAutoSave', 'true');
    };

    //Load autoLoad project
    if (autoLoadData){
        openProject(autoLoadData);
    }

    //start auto save timer
    setInterval(()=>{
        if (localStorage.getItem('disableAutoSave')) return;

        autoSaving.value = true;
        autoSave().then(()=>{
            setTimeout(()=>autoSaving.value = false, 3000);
        });
    }, 60000);
});

function updateAssetPreviews(id?: number): void {
    AppEventBus.onUpdateAsset.emit(id);
}

function updateEditorAsset(): void {
    AppEventBus.onUpdateEditorTabs.emit();
}

function updateAfterDeletion(): void {
    gameDataStore.purgeMissingReferences();
    AppEventBus.onAssetDeleted.emit();
}

function newProject(): void {
    mainStore.newProject();
    logicEditorStore.globalVariableMap.clear();
    resetUI();
}

function openProject(data: string): void {
    const isHtml = data.slice(0, 16) == HTMLTemplate.slice(0, 16);
    const loadData = isHtml ? (()=>{
        //Extract project data from HTML file
        const el = document.createElement('div');
        el.innerHTML = data;
        return el.querySelector('#gameData')?.innerHTML;
    })() : data;

    if (!loadData){
        dialogOpen({
            alertDialog: true,
            textInfo: {
                textId: 'editor_main.error_opening_html'
            }
        });
        return;
    }

    try {
        mainStore.loadSaveData(loadData);
        resetUI();
    }
    catch (e) {
        console.error(e);

        dialogOpen({
            alertDialog: true,
            textInfo: {
                textId: 'editor_main.error_reading_project'
            }
        });
    }
}

function saveProject(): void {
    saveAs(mainStore.getSaveData(), `${mainStore.getProjectName}.edproj`);
}

function packageGame(): void {
    const engineLicense = engineLicensePreamble + licenseText;
    const projectName = mainStore.getProjectName;
    const gameData = mainStore.getSaveData();
    const compiled = HTMLTemplate
        .replace('[title]', projectName)
        .replace('[engineLicense]', engineLicense)
        .replace('[engine]', EngineRawText)
        .replace('[gameData]', gameData)
        .replace('[fatalErrorMsg]', t('generic.fatalRuntimeError'));
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

async function autoSave(){
    const saveData = mainStore.getSaveData();
    localStorage.setItem('autoLoad', saveData);
}

function dialogOpen(props: DialogBoxProps){
    editorWindowEl.value!.dialogOpen(props);
}

function openNodeException({nodeId, logicId}: {nodeId: number, logicId: number}): void {
    const logicAsset = gameDataStore.logic.find(l => l.id == logicId) as Logic;
    assetBrowserStore.selectAsset(logicAsset);
    mainStore.setSelectedEditor(Core.EDITOR_ID.LOGIC);
    updateEditorAsset();
    nextTick(()=>{
        AppEventBus.onOpenNodeException.emit(nodeId, logicId);
    });
}
</script>

<template>
    <div id="global-dest"></div>
    <div class="main">
        <HeaderPanel class="headerPanel"
            @new-project="newProject"
            @open-project="openProject"
            @save-project="saveProject"
            @package-game="packageGame"
            @open-welcome="welcomeDialogEl?.openModal()"
            @dialog-open="dialogOpen" />
        <TabPanel class="TabPanel" ref="tabPanel"/>
        <AssetBrowser class="assetBrowser" ref="assetBrowser"
            @asset-selected="updateEditorAsset"
            @asset-deleted="updateAfterDeletion"
            @dialog-open="dialogOpen" />
        <EditorWindow class="editorWindow" ref="editorWindowEl" @asset-changed="updateAssetPreviews" @open-node-exception="openNodeException($event)"/>
        <transition name="playWindow">
            <PlayWindow v-if="mainStore.getPlayState != PLAY_STATE.NOT_PLAYING" class="playWindow" @open-node-exception="openNodeException"/>
        </transition>
        <WelcomeModal ref="welcomeDialogEl" @demo-opened="openProject($event)"></WelcomeModal>
        <Tooltip />
        <div class="autosave-box" :class="autoSaving ? 'autosave-box-open':''">
            <div class="progress">
                ...
            </div>
            <div class="text">
                {{ t('editor_main.autosaving') }}
            </div>
        </div>
    </div>
    <!--Preloaded icons-->
    <div hidden>
        <img src="@/assets/error_decorator.svg" />
        <img src="@/assets/warning_decorator.svg" />
        <img src="@/assets/socket_any.svg" />
        <img src="@/assets/socket_number.svg" />
        <img src="@/assets/socket_string.svg" />
        <img src="@/assets/socket_asset.svg" />
        <img src="@/assets/socket_instance.svg" />
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
    width: 100%;
    height: 100%;
}

.main{
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

#global-dest{
    position: absolute;
    top: 0px;
    left: 0px;
    width: 100%;
    height: 100%;
    pointer-events: none;
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

.autosave-box{
    position: absolute;
    right: 0;
    bottom: -100%;
    display: flex;
    flex-direction: row;
    gap: 5px;
    background: white;
    padding: 10px;
    margin: 20px;
    border-radius: 10px;
    transition: bottom 1s;
}

.autosave-box-open{
    right: 0;
    bottom: 0;
}
</style>
