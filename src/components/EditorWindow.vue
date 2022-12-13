<template>
    <div class="editorWindow">
        <component ref="editor"
        :is="currentEditor"
        :selectedAsset="selectedAsset"
        :selectedRoom="selectedRoom"
        @asset-changed="$emit('asset-changed', $event)"
        @dialog-confirm="dialogConfirm" />
        <div v-if="dialogConfirmOpen" class="dialog-confirm-bg">
            <div class="dialog-confirm-box">
                <div v-html="$t(dialogTextId, dialogTextVars)"></div>
                <div class="dialog-buttons">
                    <button @click="dialogClose(false)">Cancel</button>
                    <button @click="dialogClose(true)">OK</button>
                </div>
            </div>
        </div>
    </div>
</template>

<script>
import RoomEditor from './editor_room/RoomMain';
import ArtEditor from './editor_art/ArtMain';
import ObjectEditor from './editor_object/ObjectMain';
import LogicEditor from './editor_logic/LogicMain';

export default {
    name: 'EditorWindow',
    components: {
        RoomEditor
    },
    watch: {
        selectedTab(){
            this.dialogClose(false);
        },
        selectedAsset(){
            this.dialogClose(false);
        },
    },
    computed: {
        currentEditor(){
            switch(this.selectedTab){
                case Shared.EDITOR_ID.ROOM:
                    return RoomEditor;
                case Shared.EDITOR_ID.ART:
                    return ArtEditor;
                case Shared.EDITOR_ID.OBJECT:
                    return ObjectEditor;
                case Shared.EDITOR_ID.LOGIC:
                    return LogicEditor;
                default:
                    return RoomEditor;
            }
        },
        selectedTab(){
            return this.$store.getters['selectedTab'];
        },
        selectedAsset(){
            return this.$store.getters['AssetBrowser/getSelectedAsset'];
        },
        selectedRoom(){
            return this.$store.getters['AssetBrowser/getSelectedRoom'];
        },
    },
    data() {
        return {
            dialogConfirmOpen: false,
            dialogTextId: null,
            dialogTextVars: null,
            dialogCallback: ()=>{},
        }
    },
    methods: {
        dialogConfirm({textInfo, callback}){
            this.dialogConfirmOpen = true;
            this.dialogTextId = textInfo.textId;
            this.dialogTextVars = textInfo.vars;
            this.dialogCallback = callback;
        },
        dialogClose(positive){
            this.dialogCallback(positive);
            this.dialogCallback = ()=>{};
            this.dialogConfirmOpen = false;
        },
    }
}
</script>

<style scoped>
.editorWindow{
    position: relative;
    display: flex;
    box-sizing: border-box;
    border-left: 2px solid var(--border);
}

.dialog-confirm-bg{
    position: absolute;
    display: flex;
    justify-content: center;
    align-items: center;
    width: 100%;
    height: 100%;
    background: var(--modal-bg);
    z-index: 2000;
}

.dialog-confirm-box{
    padding: 10px;
    background: white;
    overflow: hidden;
    border: 2px solid var(--border);
    border-radius: var(--corner-radius);
    max-width: 400px;
}

.dialog-buttons{
    display: flex;
    justify-content: end;
    width: 100%;
    margin-top: 10px;
    gap: 3px;
}

.dialog-buttons > button{
    background: var(--button-norm);
    border-radius: var(--corner-radius);
    border: 2px solid var(--border);
    font-size: medium;
    padding: 5px;
}

.dialog-buttons > button:hover{
    background: var(--button-hover);
}

.dialog-buttons > button:active{
    background: var(--button-down);
}
</style>