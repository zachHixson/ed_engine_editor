<template>
    <div id="app">
        <LogoMenu />
        <TopPanel ref="topPanel"/>
        <AssetBrowser ref="assetBrowser" @asset-selected="updateEditorAsset" />
        <EditorWindow ref="editorWindow" @asset-changed="updateAssetPreviews" />
    </div>
</template>

<script>
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

LogoMenu{
    grid-area: logoCorner;
}

TopPanel{
    grid-area: topPanel;
}

AssetBrowser{
    grid-area: assetBrowser;
}

EditorWindow{
    grid-area: editorWindow;
}
</style>
