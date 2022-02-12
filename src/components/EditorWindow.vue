<template>
    <div class="editorWindow">
        <component ref="editor"
        :is="currentEditor"
        :selectedAsset="selectedAsset"
        :selectedRoom="selectedRoom"
        @asset-changed="$emit('asset-changed', $event)" />
    </div>
</template>

<script>
import {mapGetters} from 'vuex';
import RoomEditor from './editor_room/RoomMain';
import ArtEditor from './editor_art/ArtMain';
import ObjectEditor from './editor_object/ObjectMain';
import LogicEditor from './editor_logic/LogicMain';

export default {
    name: 'EditorWindow',
    components: {
        RoomEditor
    },
    computed: {
        ...mapGetters(['selectedTab']),
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
        selectedAsset(){
            return this.$store.getters['AssetBrowser/getSelectedAsset'];
        },
        selectedRoom(){
            return this.$store.getters['AssetBrowser/getSelectedRoom'];
        }
    }
}
</script>

<style scoped>
.editorWindow{
    display: flex;
    box-sizing: border-box;
    border-left: 2px solid var(--border);
}
</style>