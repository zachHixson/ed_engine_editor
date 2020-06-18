<template>
    <div class="editorTab" @click="tabClick" :class="{tabSelected : isSelected}">
        <div class="tabEl logoBox">
            <img class="tabImg" :src="require(`../assets/${logoName}.svg`)" />
        </div>
        <div class="tabEl name">
            {{tabText}}
        </div>
    </div>
</template>

<script>
import {mapActions, mapGetters} from 'vuex';

export default {
    name: 'EditorTab',
    props: ['tabText', 'logoName', 'editorName'],
    methods: {
        ...mapActions(['switchTab']),
        tabClick(e) {
            this.switchTab(this.editorName);
        }
    },
    computed: {
        ...mapGetters(['selectedTab']),
        isSelected(){
            return (this.selectedTab == this.editorName);
        }
    }
} 
</script>

<style scoped>
.editorTab{
    border: 1px solid black;
    background: #AAFF55;
    flex-grow: 1;
    display: flex;
    flex-direction: row;
    align-items: center;
}

.editorTab:hover:not(.tabSelected){
    background: #AAEE55;
}

.tabSelected{
    background: white;
    border-bottom: none;
}

.tabImg{
    width: 50px;
    height: 50px;
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
}
</style>