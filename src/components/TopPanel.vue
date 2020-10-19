<template>
    <div class="topPanel">
        <div class="panelBox controls">
            <div>Run</div>
            <div>Debug</div>
        </div>
        <transition-group name="tabs" tag="div" class="panelBox tabContainer">
            <EditorTab
                v-for="tab in contextTabs"
                :key="tab.id"
                :editorID="tab.id"
                :tabText="tab.text"
                :logoPath="tab.logoPath" />
        </transition-group>
    </div>
</template>

<script>
import EditorTab from './EditorTab';
import {CATEGORY_ID, EDITOR_ID} from '@/common/Enums.js';

export default {
    name: 'TopPanel',
    components: {
        EditorTab
    },
    data() {
        return {
            editorTabs: {
                'level' : {
                    id: EDITOR_ID.LEVEL,
                    logoPath: 'assets/room_icon',
                    text: this.$t('editor_main.room_tab')
                },
                'art' : {
                    id: EDITOR_ID.ART,
                    logoPath: 'assets/sprite_icon',
                    text: this.$t('editor_main.art_tab')
                },
                'object' : {
                    id: EDITOR_ID.OBJECT,
                    logoPath: 'assets/object_icon',
                    text: this.$t('editor_main.object_tab')
                },
                'logic' : {
                    id: EDITOR_ID.LOGIC,
                    logoPath: 'assets/logic',
                    text: this.$t('editor_main.logic_tab')
                },
            },
            contextTabs: []
        }
    },
    mounted() {
        this.contextTabs = [this.editorTabs['level']];
        this.updateEditorTabs();
        this.$store.dispatch('switchTab', EDITOR_ID.LEVEL)
    },
    methods: {
        updateEditorTabs(){
            let currentAsset = this.$store.getters['AssetBrowser/getSelectedAsset'];
            let selectedTab = this.$store.getters['selectedTab'];

            this.contextTabs = [this.editorTabs['level']];

            if (currentAsset){
                let assetType = currentAsset.category_ID;

                switch(assetType){
                    case CATEGORY_ID.SPRITE:
                        this.contextTabs.push(this.editorTabs['art']);
                        break;
                    case CATEGORY_ID.OBJECT:
                        this.contextTabs.push(this.editorTabs['object']);
                        this.contextTabs.push(this.editorTabs['logic']);
                }

                //if user is in tab that no longer exists, transition them to appropriate tab
                if (this.contextTabs.find(t => t.id == selectedTab) == undefined){
                    let newTab = EDITOR_ID.LEVEL;

                    switch(assetType){
                        case CATEGORY_ID.SPRITE:
                            newTab = EDITOR_ID.ART;
                            break;
                        case CATEGORY_ID.OBJECT:
                            newTab = EDITOR_ID.OBJECT;
                            break;
                    }

                    this.$store.dispatch('switchTab', newTab);
                }
            }
            else{
                this.$store.dispatch('switchTab', EDITOR_ID.LEVEL);
            }
        }
    }
}
</script>

<style scoped>
.topPanel{
    background: #99FF99;
    display: flex;
    flex-direction: column;
    height: 100%;
    overflow: hidden;
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

.tabs-enter-active{
    transition: transform 200ms;
}

.tabs-enter{
    transform: translateY(100px);
}

.tabs-leave{
    display: none;
}
</style>