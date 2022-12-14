<template>
    <div id="app">
        <HeaderPanel class="headerPanel"
            @new-project="newProject"
            @open-project="openProject"
            @save-project="saveProject"
            @package-game="packageGame" />
        <TabPanel class="TabPanel" ref="TabPanel"/>
        <AssetBrowser class="assetBrowser" ref="assetBrowser" @asset-selected="updateEditorAsset" @asset-deleted="updateAfterDeletion" />
        <EditorWindow class="editorWindow" ref="editorWindow" @asset-changed="updateAssetPreviews"/>
        <transition name="playWindow">
            <PlayWindow v-if="playState != PLAY_STATES.NOT_PLAYING" class="playWindow" />
        </transition>
    </div>
</template>

<script>
import {template} from '@compiled/Engine';
import {saveAs} from 'file-saver';
import HeaderPanel from './components/HeaderPanel';
import TabPanel from './components/TabPanel';
import AssetBrowser from './components/asset_browser/AssetBrowser';
import EditorWindow from './components/EditorWindow';
import PlayWindow from './components/PlayWindow';

export default {
    name: 'App',
    components: {
        HeaderPanel,
        TabPanel,
        AssetBrowser,
        EditorWindow,
        PlayWindow,
    },
    computed: {
        PLAY_STATES(){
            return this.$store.getters['getPlayStates'];
        },
        playState(){
            return this.$store.getters['getPlayState'];
        },
    },
    mounted(){
        this.$store.dispatch('newProject');
        this.$store.getters['getNodeAPI'].setGlobalStore = this.$store;
        this.updateEditorAsset();
    },
    methods: {
        updateAssetPreviews(id){
            this.$refs.assetBrowser.updateAsset(id);
        },
        updateEditorAsset(){
            this.$refs.TabPanel.updateEditorTabs();
        },
        updateAfterDeletion(){
            this.$store.dispatch('GameData/purgeMissingReferences');
        },
        newProject(){
            this.$store.dispatch('newProject');
            this.resetUI();
        },
        openProject(data){
            this.$store.dispatch('loadSaveData', data);
            this.resetUI();
        },
        saveProject(){
            let blob = new Blob([this.$store.getters['getSaveData']]);
            saveAs(blob, `${this.$store.getters['getProjectName']}.edproj`);
        },
        packageGame(){
            let projectName = this.$store.getters['getProjectName'];
            let shared = document.getElementById('shared').innerHTML;
            let engine = document.getElementById('engine').innerHTML;
            let gameData = this.$store.getters['getSaveData'];
            let compiled = template.replace('[title]', projectName)
                .replace('[shared]', shared)
                .replace('[engine]', engine)
                .replace('[gameData]', gameData);
            let blob = new Blob([compiled]);
            saveAs(blob, `${projectName}.html`);
        },
        resetUI(){
            this.$store.dispatch('AssetBrowser/deselectAssets');
            this.$store.dispatch('switchTab', Shared.EDITOR_ID.ROOM);
            this.updateEditorAsset();
        }
    }
}
</script>

<style>
@import 'components/common/colorScheme.css';

html, body{
    height: 100%;
    margin: 0px;
    padding: 0px;
    overflow: hidden;
}

#app {
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
