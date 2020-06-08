<template>
    <div>
        <component :is="currentEditor" />
    </div>
</template>

<script>
import {mapGetters} from 'vuex';
import LevelEditor from './editor_level/LevelMain';
import ArtEditor from './editor_art/ArtMain';
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
                case 'level':
                    return LevelEditor;
                case 'art':
                    return ArtEditor;
                case 'logic':
                    return LogicEditor;
                default:
                    return LevelEditor;
            }
        }
    }
}
</script>

<style scope>

</style>