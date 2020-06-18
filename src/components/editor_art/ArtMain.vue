<template>
    <div id="artMain">
        <LeftPanel @changed="resize"/>
        <ArtCanvas ref="artCanvas"/>
    </div>
</template>

<script>
import LeftPanel from './LeftPanel';
import ArtCanvas from './ArtCanvas';

export default {
    name: 'ArtEditor',
    components: {
        LeftPanel,
        ArtCanvas
    },
    mounted(){
        window.addEventListener('resize', ()=>{this.resize()})
    },
    methods:{
        resize() {
            this.$refs.artCanvas.resize();
        }
    }
}
</script>

<style scoped>
    #artMain{
        display: flex;
        flex-direction: row;
        width: 100%;
        height: 100%;
        margin:none;
        padding:none;
    }

    #navControls{
        position: absolute;
        top: 0;
        right: 0;
    }
</style>