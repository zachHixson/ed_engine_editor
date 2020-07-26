<template>
    <div class="artMain">
        <LeftPanel class="leftPanel" @resized="resize" @tool-selected="toolSelected"/>
        <ArtCanvas class="artCanvas" ref="artCanvas" @spriteFrameChanged="spriteChanged()" @nav-selected="navSelected()"/>
        <AnimationPanel class="animPanel" ref="animPanel" @resized="resize" @frameChanged="frameChanged()"/>
    </div>
</template>

<script>
import {store, mapActions} from 'vuex';
import LeftPanel from './LeftPanel';
import ArtCanvas from './ArtCanvas';
import AnimationPanel from './AnimationPanel';

export default {
    name: 'ArtEditor',
    components: {
        LeftPanel,
        ArtCanvas,
        AnimationPanel
    },
    mounted(){
        window.addEventListener('resize', this.resize);
    },
    beforeDestroy(){
        window.removeEventListener('resize', this.resize);
    },
    methods:{
        ...mapActions({
            selectTool: 'ArtEditor/selectTool',
            setNavTool: 'ArtEditor/setSelectedNavTool'
        }),
        resize() {
            this.$refs.artCanvas.resize();
        },
        spriteChanged(){
            this.$refs.animPanel.updateFramePreviews();
        },
        frameChanged(){
            this.$refs.artCanvas.setSprite();
        },
        navSelected(){
            this.selectTool(null);
        },
        toolSelected(){
            this.setNavTool(null);
        }
    }
}
</script>

<style scoped>
    .artMain{
        display: flex;
        flex-direction: row;
        justify-content: space-between;
        width: 100%;
        height: 100%;
        margin:none;
        padding:none;
        overflow: none;
    }
</style>