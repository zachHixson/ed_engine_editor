<template>
    <div class="artMain">
        <LeftPanel class="leftPanel" @resized="resize"/>
        <ArtCanvas class="artCanvas" ref="artCanvas" @spriteFrameChanged="spriteChanged()"/>
        <AnimationPanel class="animPanel" ref="animPanel" @resized="resize" @frameChanged="frameChanged()"/>
    </div>
</template>

<script>
import {store} from 'vuex';
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
        window.addEventListener('resize', ()=>{this.resize()});
    },
    methods:{
        resize() {
            this.$refs.artCanvas.resize();
        },
        spriteChanged(){
            this.$refs.animPanel.updateFramePreviews();
        },
        frameChanged(){
            this.$refs.artCanvas.setSprite();
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