<template>
    <div class="topPanel">
        <div class="panelBox controls">
            <button class="iconBtn"><img class="icon" src="@/assets/debug.svg" /></button>
            <button class="iconBtn"><img class="icon" src="@/assets/play.svg" /></button>
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
                'room' : {
                    id: EDITOR_ID.ROOM,
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
        this.contextTabs = [this.editorTabs['room']];
        this.updateEditorTabs();
        this.$store.dispatch('switchTab', EDITOR_ID.ROOM)
    },
    methods: {
        updateEditorTabs(){
            let currentAsset = this.$store.getters['AssetBrowser/getSelectedAsset'];
            let selectedTab = this.$store.getters['selectedTab'];

            this.contextTabs = [this.editorTabs['room']];

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
                    let newTab = EDITOR_ID.ROOM;

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
                this.$store.dispatch('switchTab', EDITOR_ID.ROOM);
            }
        }
    }
}
</script>

<style scoped>
.topPanel{
    background: var(--top-bar);
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

.iconBtn{
    --size: 50px;
    display: flex;
    width: var(--size);
    height: var(--size);
    background: var(--button-norm);
    margin: 5px;
    justify-content: center;
    align-items: center;
    border-radius: var(--corner-radius);
    border: 2px solid var(--border);
}

.iconBtn:hover{
    background: var(--button-hover);
}

.iconBtn:active{
    background: var(--button-down);
}

.icon{
    width: 100%;
    height: 100%;
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