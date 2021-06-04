<template>
    <div class="editorTab" @click="tabClick" :class="{tabSelected : isSelected}">
        <div class="tabEl logoBox">
            <inline-svg class="tabImg" :src="require(`@/${logoPath}.svg`)" :transformSource="removeStroke"/>
        </div>
        <div class="tabEl name">
            {{tabText}}
        </div>
    </div>
</template>

<script>
import {mapActions, mapGetters} from 'vuex';
import {removeStroke} from '@/common/Util';

export default {
    name: 'EditorTab',
    props: ['tabText', 'logoPath', 'editorID'],
    methods: {
        ...mapActions(['switchTab']),
        tabClick(e) {
            this.switchTab(this.editorID);
        },
        removeStroke
    },
    computed: {
        ...mapGetters(['selectedTab']),
        isSelected(){
            return (this.selectedTab == this.editorID);
        }
    }
} 
</script>

<style scoped>
*{
    --border-width: 2px;
}

.editorTab{
    border: 2px solid var(--border);
    background: var(--tab-inactive);
    flex-grow: 1;
    display: flex;
    flex-direction: row;
    align-items: center;
    max-width: 50%;
    border-radius: var(--corner-radius) var(--corner-radius) 0px 0px;
    color: var(--text-dark);
}

.editorTab:not(:last-child){
    margin-right: -12px;
}

.editorTab:hover:not(.tabSelected){
    filter: brightness(0.8);
}

.tabSelected{
    background: var(--tab-active);
    border-bottom: none;
    z-index: 100;
}

.tabImg{
    width: 50px;
    height: 50px;
    fill: var(--text-dark);
    stroke: var(--text-dark);
}

.tabEl{
    display: flex;
    justify-content: center;
}

.logoBox{
    margin-left: 1vw;
}

.name{
    flex-grow: 1;
    font-weight: bold;
    font-size: 2em;
}
</style>