<template>
    <div id="artCanvas" ref="artCanvas">
        <canvas id="canvas" ref="canvas">
            //Error loading HTML5 canvas, check browser compatibility
        </canvas>
    </div>
</template>

<script>
import {mapGetters} from 'vuex';
import artCanvas from './artCanvasScript';

export default {
    name: "ArtCanvas",
    data() {
        return {
            canvasEl: null,
            updateFrame : null
        }
    },
    mounted(){
        this.resize();
        this.setup();
    },
    computed: {
        ...mapGetters(['selectedTab'])
    },
    methods:{
        resize(event = null){
            let wrapper = this.$refs.artCanvas;
            let canvas = this.$refs.canvas;
            let wrapperBounds = {width:0,height:0};

            canvas.width = 10;
            canvas.height = 10;

            wrapperBounds.width = wrapper.clientWidth;
            wrapperBounds.height = wrapper.clientHeight;

            canvas.width = wrapperBounds.width
            canvas.height = wrapperBounds.height;
        },
        setup(){
            this.canvasEl = new artCanvas(this.$refs.canvas);
            this.canvasEl.setup();
            this.update();
        },
        update(){
            this.resize();
            this.canvasEl.update();
            this.updateFrame = window.requestAnimationFrame(()=>{this.update()});
        }
    },
    beforeDestroy(){
        window.cancelAnimationFrame(this.updateFrame);
    },
    destroyed(){
        this.canvasEl = null;
    }
}
</script>

<style scope>
    *{
        padding: none;
        margin: none;
    }
    
    #artCanvas{
        box-sizing: border-box;
        width: 100%;
        height: 100%;
        margin: none;
        padding: none;
        background: blue;
        overflow: hidden;
    }

    #canvas{
        box-sizing: border-box;
    }
</style>