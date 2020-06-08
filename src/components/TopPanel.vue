<template>
    <div class="topPanel">
        <div class="panelBox controls">
            <div>Run</div>
            <div>Debug</div>
        </div>
        <div class="panelBox tabContainer">
            <EditorTab tabText="Level" editorName="level" logoName="placeholder" />
            <EditorTab tabText="Art" editorName="art" logoName="placeholder" />
            <EditorTab tabText="Logic" editorName="logic" logoName="placeholder" />
        </div>
    </div>
</template>

<script>
import EditorTab from './EditorTab';

export default {
    name: 'TopPanel',
    components: {
        EditorTab
    }
}
</script>

<style scope>
.topPanel{
    background: #99FF99;
    display: flex;
    flex-direction: column;
    height: 100%;
}

.panelBox{
    display: flex;
    flex-grow: 1;
}

.controls{
    display: flex;
    flex-direction: row;
    justify-content: flex-end;
}

.controls > *{
    height: 100%;
    background: #55AA55;
    margin-left: 2px;
}

.tabContainer{
    display: flex;
    flex-direction: row;
}
</style>