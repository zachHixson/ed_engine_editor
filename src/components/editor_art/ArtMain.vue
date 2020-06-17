<template>
    <div class="artMain">
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

<style scope>
    .artMain{
        display: flex;
        flex-direction: row;
        height: 100%;
        margin:none;
        padding:none;
    }
</style>