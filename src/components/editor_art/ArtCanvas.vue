<template>
    <div id="artCanvas" ref="artCanvas">
        <canvas id="canvas" ref="canvas">
            //Error loading HTML5 canvas, check browser compatibility
        </canvas>
        <NavControlPanel
            id="navControlPanel"
            ref="navControlPanel"
            stateModule="ArtEditor"
            :maxZoom="maxZoom"
            @navChanged="navChanged"
            @tool-selected="enableNav()"
            @tool-deselected="disableNav()"/>
    </div>
</template>

<script>
import {store} from 'vuex';
import NavControlPanel from '@/components/common/NavControlPanel';
import Art_Canvas_Renderer from './Art_Canvas_Renderer.js';

export default {
    name: "ArtCanvas",
    data() {
        return {
            canvasEl: null,
            navControl: null,
            updateFrame: null,
            maxZoom: 2
        }
    },
    components: {
        NavControlPanel
    },
    mounted(){
        let canvas = this.$refs.canvas;
        
        this.navControl = this.$refs.navControlPanel;
        this.canvasEl = new Art_Canvas_Renderer(canvas, this.getSelectedFrame());
        this.canvasEl.setCommitCallback(this.onCommit.bind(this));
        
        canvas.addEventListener('mousedown', this.mouseDown);
        canvas.addEventListener('mouseup', this.mouseUp);
        canvas.addEventListener('mousemove', this.mouseMove);
        canvas.addEventListener('wheel', this.wheel);
        canvas.addEventListener('mouseleave', this.navControl.mouseLeave);

        this.navControl.setViewBounds(this.canvasEl.getViewBounds());
        this.navControl.setContentsBounds(this.canvasEl.getContentsBounds());
        this.navChanged(this.navControl.getNavState());

        this.setTool(this.selectedTool);
        this.setColor(this.selectedColor);
        this.setSize(this.selectedSize);
    },
    beforeDestroy(){
        window.cancelAnimationFrame(this.updateFrame);
        this.$store.dispatch('ArtEditor/setZoomFac', this.canvasEl.zoomFac);
        this.$store.dispatch('ArtEditor/setOffset', this.canvasEl.offset);
        this.canvasEl.beforeDestroy();
    },
    destroyed(){
        this.canvasEl = null;
    },
    computed:{
        selectedColor(){
            return this.$store.getters['ArtEditor/getSelectedColor'];
        },
        selectedSize(){
            return this.$store.getters['ArtEditor/getSelectedSize'];
        },
        selectedTool(){
            return this.$store.getters['ArtEditor/getSelectedTool'];
        }
    },
    watch:{
        selectedColor(newColor, oldColor){
            this.setColor(newColor);
        },
        selectedSize(newSize, oldSize){
            this.setSize(newSize);
        },
        selectedTool(newTool, oldTool){
            this.setTool(newTool);
        }
    },
    methods:{
        getSelectedSprite(){
            return this.$store.getters['AssetBrowser/getSelectedAsset'];
        },
        getSelectedFrame(){
            return this.getSelectedSprite().frames[this.$store.getters['ArtEditor/getSelectedFrame']];
        },
        mouseDown(event){
            this.navControl.mouseDown(event);

            if (this.navControl.hotkeyTool == null){
                this.canvasEl.mouseDown(event);
            }
        },
        mouseUp(event){
            if (this.navControl.hotkeyTool == null){
                this.canvasEl.mouseUp(event);
            }

            this.navControl.mouseUp(event);
        },
        mouseMove(event){
            this.navControl.mouseMove(event);

            if (this.navControl.hotkeyTool == null){
                this.canvasEl.mouseMove(event);
            }
        },
        wheel(event){
            this.navControl.scroll(event);
        },
        resize(event = null){
            let wrapper = this.$refs.artCanvas;
            let canvas = this.$refs.canvas;

            canvas.width = wrapper.clientWidth;
            canvas.height = wrapper.clientHeight;

            this.$refs.navControlPanel.setContainerDimensions(wrapper.clientWidth, wrapper.clientHeight);
            this.canvasEl.resize();
            this.maxZoom = this.canvasEl.getZoomBounds().max;
        },
        navChanged(navState){
            this.canvasEl.navChanged(navState);
        },
        setColor(newColor){
            this.canvasEl.setToolColor(newColor);
        },
        setSize(newSize){
            this.canvasEl.setToolSize(newSize);
        },
        setTool(newTool){
            this.canvasEl.setTool(newTool);
        },
        setSprite(){
            this.canvasEl.setSprite(this.getSelectedFrame());
        },
        enableNav(){
            this.$emit('nav-selected');
            this.canvasEl.disableDrawing();
        },
        disableNav(){
            this.$emit('nav-deselected');
            this.canvasEl.enableDrawing();
        },
        onCommit(){
            this.$emit('spriteFrameChanged');
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
        max-width: 100vw;
    }

    #canvas{
        position: absolute;
        box-sizing: border-box;
    }

    #navControlPanel{
        position: absolute;
        top: 0;
        right: 0;
        z-index: 1000;
    }
</style>