<template>
    <div id="artCanvas" ref="artCanvas">
        <UndoPanel class="undoPanel" :undoLength="undoLength" :redoLength="redoLength" @undo="undo()" @redo="redo()"/>
        <canvas id="canvas" class="canvas" ref="canvas">
            //Error loading HTML5 canvas, check browser compatibility
        </canvas>
        <NavControlPanel
            class="navControlPanel"
            ref="navControlPanel"
            stateModule="ArtEditor"
            :maxZoom="maxZoom"
            @navChanged="navChanged"
            @tool-selected="enableNav()"
            @tool-deselected="disableNav()"/>
    </div>
</template>

<script>
import UndoPanel from "@/components/common/UndoPanel";
import NavControlPanel from '@/components/common/NavControlPanel';
import Art_Canvas_Renderer from './Art_Canvas_Renderer';

export default {
    name: "ArtCanvas",
    props: ['undoLength', 'redoLength'],
    data() {
        return {
            canvasEl: null,
            navControl: null,
            updateFrame: null,
            maxZoom: 2
        }
    },
    components: {
        UndoPanel,
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

        this.maxZoom = this.canvasEl.getZoomBounds().max
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
            let selectedFrame = this.$store.getters['ArtEditor/getSelectedFrame'];
            let sprite = this.getSelectedSprite();
            
            if (sprite.frames.length < selectedFrame + 1){
                selectedFrame = 0;
                this.$store.dispatch('ArtEditor/selectFrame', selectedFrame);
            }

            return sprite.frames[selectedFrame];
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

            canvas.width = Math.max(wrapper.clientWidth, 1);
            canvas.height = Math.max(wrapper.clientHeight, 1);

            this.$refs.navControlPanel.setContainerDimensions(wrapper.clientWidth, wrapper.clientHeight);

            if (this.canvasEl){
                this.canvasEl.resize();
                this.maxZoom = this.canvasEl.getZoomBounds().max;
            }
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
            this.$emit('spriteDataChanged');
        },
        undo(){
            this.$emit('undo');
        },
        redo(){
            this.$emit('redo');
        }
    }
}
</script>

<style scoped>
    .artCanvas{
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

    .undoPanel{
        position: absolute;
        top: 0;
        left: 0;
        z-index: 1000;
    }

    .canvas{
        position: absolute;
        box-sizing: border-box;
    }

    .navControlPanel{
        position: absolute;
        top: 0;
        right: 0;
        z-index: 1000;
    }
</style>