<template>
    <div class="editorWindow">
        <component ref="editor" :is="currentEditor" @asset-changed="$emit('asset-changed', $event)" />
    </div>
</template>

<script>
import {mapGetters} from 'vuex';
import {EDITOR_ID} from '@/common/Enums';
import LevelEditor from './editor_level/LevelMain';
import ArtEditor from './editor_art/ArtMain';
import ObjectEditor from './editor_object/ObjectMain';
import LogicEditor from './editor_logic/LogicMain';

export default {
    name: 'EditorWindow',
    components: {
        LevelEditor
    },
    computed: {
        ...mapGetters(['selectedTab']),
        currentEditor(){
            switch(this.selectedTab){
                case EDITOR_ID.LEVEL:
                    return LevelEditor;
                case EDITOR_ID.ART:
                    return ArtEditor;
                case EDITOR_ID.OBJECT:
                    return ObjectEditor;
                case EDITOR_ID.LOGIC:
                    return LogicEditor;
                default:
                    return LevelEditor;
            }
        }
    },
    methods: {
        updateAssetSelection(){
            this.$refs.editor.updateAssetSelection();
        }
    }
}
</script>

<style scoped>
.editorWindow{
    display: flex;
    box-sizing: border-box;
}
</style>