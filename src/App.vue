<template>
    <div id="app">
        <HeaderPanel class="headerPanel"
            @new-project="newProject"
            @open-project="openProject"
            @save-project="saveProject" />
        <TabPanel class="TabPanel" ref="TabPanel"/>
        <AssetBrowser class="assetBrowser" ref="assetBrowser" @asset-selected="updateEditorAsset" @asset-deleted="updateAfterDeletion" />
        <EditorWindow class="editorWindow" ref="editorWindow" @asset-changed="updateAssetPreviews"/>
    </div>
</template>

<script>
import {saveAs} from 'file-saver';
import {EDITOR_ID} from '@/common/Enums';
import HeaderPanel from './components/HeaderPanel';
import TabPanel from './components/TabPanel';
import AssetBrowser from './components/asset_browser/AssetBrowser';
import EditorWindow from './components/EditorWindow';

export default {
    name: 'App',
    components: {
        HeaderPanel,
        TabPanel,
        AssetBrowser,
        EditorWindow
    },
    mounted(){
        this.$store.dispatch('newProject');
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
            saveAs(blob, "MyFile.edproj");
        },
        resetUI(){
            this.$store.dispatch('AssetBrowser/deselectAssets');
            this.$store.dispatch('switchTab', EDITOR_ID.ROOM);
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
</style>
