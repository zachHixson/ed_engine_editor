<template>
    <div id="artCanvas" ref="artCanvas">
        <canvas id="canvas" ref="canvas">
            //Error loading HTML5 canvas, check browser compatibility
        </canvas>
        <NavControlPanel
            id="navControlPanel"
            ref="navControlPanel"
            stateModule="ArtEditor"
            @navChanged="navChanged"/>
    </div>
</template>

<script>
import NavControlPanel from '@/components/common/NavControlPanel';
import Art_Canvas from './Art_Canvas.js';

export default {
    name: "ArtCanvas",
    data() {
        return {
            canvasEl: null,
            updateFrame : null
        }
    },
    components: {
        NavControlPanel
    },
    mounted(){
        let canvas = this.$refs.canvas;
        let navControl = this.$refs.navControlPanel;

        this.canvasEl = new Art_Canvas(canvas);
        this.resize();
        this.canvasEl.setup();
        this.update();

        canvas.addEventListener('mousedown', navControl.mouseDown);
        canvas.addEventListener('mouseup', navControl.mouseUp);
        canvas.addEventListener('mousemove', navControl.mouseMove);

        navControl.setViewBounds(this.canvasEl.getViewBounds());
        navControl.setContentsBounds(this.canvasEl.getContentsBounds());
        this.navChanged(navControl.getNavState());
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

            this.$refs.navControlPanel.setContainerDimensions(wrapperBounds);
            this.canvasEl.resize();
        },
        navChanged(navState){
            this.canvasEl.navChanged(navState);
        },
        update(){
            this.canvasEl.update();
            this.updateFrame = window.requestAnimationFrame(()=>{this.update()});
        }
    }
}
</script>

<style scoped>
    #artCanvas{
        position: relative;
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

    #navControlPanel{
        position: absolute;
        top: 0;
        right: 0;
        z-index: 1000;
    }
</style>