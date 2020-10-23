<template>
    <div id="app">
        <LogoMenu class="logoMenu"
            @new-project="newProject"
            @open-project="openProject"
            @save-project="saveProject" />
        <TopPanel class="topPanel" ref="topPanel"/>
        <AssetBrowser class="assetBrowser" ref="assetBrowser" @asset-selected="updateEditorAsset" />
        <EditorWindow class="editorWindow" ref="editorWindow" @asset-changed="updateAssetPreviews" />
    </div>
</template>

<script>
import {saveAs} from 'file-saver';
import {EDITOR_ID} from '@/common/Enums';
import ID_Generator from '@/common/ID_Generator';
import LogoMenu from './components/LogoMenu';
import TopPanel from './components/TopPanel';
import AssetBrowser from './components/asset_browser/AssetBrowser';
import EditorWindow from './components/EditorWindow';

export default {
    name: 'App',
    components: {
        LogoMenu,
        TopPanel,
        AssetBrowser,
        EditorWindow
    },
    methods: {
        updateAssetPreviews(id){
            this.$refs.assetBrowser.updateAsset(id);
        },
        updateEditorAsset(){
            this.$refs.editorWindow.updateAssetSelection();
            this.$refs.topPanel.updateEditorTabs();
        },
        newProject(){
            this.$store.dispatch('GameData/newProject');
            this.$store.dispatch('AssetBrowser/deselectAssets');
            this.$store.dispatch('switchTab', EDITOR_ID.ROOM);
            this.updateEditorAsset();
            ID_Generator.reset();
        },
        openProject(data){
            this.$store.dispatch('GameData/loadSaveData', data);
        },
        saveProject(){
            let blob = new Blob([this.$store.getters['GameData/getSaveData']]);
            saveAs(blob, "MyFile.edproj");
        }
    }
}
</script>

<style>
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
        "logoCorner topPanel"
        "assetBrowser editorWindow";
    grid-template-columns: 200pt 1fr;
    grid-template-rows: 80pt minmax(0, 1fr);
    width: 100%;
    height: 100%;
    max-height: 100vh;
}

.logoMenu{
    grid-area: logoCorner;
}

.topPanel{
    grid-area: topPanel;
}

.assetBrowser{
    grid-area: assetBrowser;
}

.editorWindow{
    grid-area: editorWindow;
}
</style>
