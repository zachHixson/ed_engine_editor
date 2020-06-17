<template>
    <div id="artCanvas" ref="artCanvas">
        <canvas id="canvas" ref="canvas">
            //Error loading HTML5 canvas, check browser compatibility
        </canvas>
    </div>
</template>

<script>
import Art_Canvas from './Art_Canvas.js';

export default {
    name: "ArtCanvas",
    data() {
        return {
            canvasEl: null,
            updateFrame : null
        }
    },
    mounted(){
        this.canvasEl = new Art_Canvas(this.$refs.canvas);
        this.resize();
        this.canvasEl.setup();
        this.update();
    },
    beforeDestroy(){
        window.cancelAnimationFrame(this.updateFrame);
    },
    destroyed(){
        this.canvasEl = null;
    },
    methods:{
        resize(event = null){
            let wrapper = this.$refs.artCanvas;
            let canvas = this.$refs.canvas;
            let wrapperBounds = {width:0,height:0};

            canvas.width = 1;
            canvas.height = 1;

            wrapperBounds.width = wrapper.clientWidth;
            wrapperBounds.height = wrapper.clientHeight;

            canvas.width = wrapperBounds.width;
            canvas.height = wrapperBounds.height;

            this.canvasEl.resize();
        },
        update(){
            this.canvasEl.update();
            this.updateFrame = window.requestAnimationFrame(()=>{this.update()});
        }
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