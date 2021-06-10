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
            @tool-selected="enableNav"/>
    </div>
</template>

<script>
import UndoPanel from "@/components/common/UndoPanel";
import NavControlPanel from '@/components/common/NavControlPanel';
import Art_Canvas_Renderer from './Art_Canvas_Renderer';

export default {
    name: "ArtCanvas",
    props: ['tool', 'spriteFrame', 'undoLength', 'redoLength'],
    components: {
        UndoPanel,
        NavControlPanel
    },
    data() {
        return {
            renderer: null,
            navControl: null,
            maxZoom: 2,
            toolMap: new Map(),
            enableDrawing: true
        }
    },
    watch: {
        tool(){
            let renderer = this.renderer;

            this.tool.beforeDestroy();
            this.tool.setPreviewBuff(renderer.previewData);
            this.tool.setPixelBuff(this.spriteFrame);
            this.tool.setMouseCell(renderer.mouseCell);
        },
        spriteFrame(){
            this.renderer.setSprite(this.spriteFrame);
            this.tool.setPixelBuff(this.spriteFrame)
        }
    },
    mounted(){
        let canvas = this.$refs.canvas;
        
        this.navControl = this.$refs.navControlPanel;
        this.renderer = new Art_Canvas_Renderer(canvas, this.spriteFrame);
        
        canvas.addEventListener('mousedown', this.mouseDown);
        canvas.addEventListener('mouseup', this.mouseUp);
        canvas.addEventListener('mousemove', this.mouseMove);
        canvas.addEventListener('wheel', this.wheel);
        canvas.addEventListener('mouseleave', this.mouseLeave);

        this.maxZoom = this.renderer.getZoomBounds().max
        this.navControl.setViewBounds(this.renderer.getViewBounds());
        this.navControl.setContentsBounds(this.renderer.getContentsBounds());
        this.navChanged(this.navControl.getNavState());
    },
    beforeDestroy(){
        this.$store.dispatch('ArtEditor/setNavZoom', this.renderer.zoomFac);
        this.$store.dispatch('ArtEditor/setNavOffset', this.renderer.offset);
    },
    destroyed(){
        this.renderer = null;
    },
    methods:{
        mouseDown(event){
            this.navControl.mouseDown(event);

            if (this.navControl.hotkeyTool == null){
                this.$emit('mouse-down', event);
                this.renderer.mouseDown(event);
            }
        },
        mouseUp(event){
            if (this.navControl.hotkeyTool == null){
                this.$emit('mouse-up', event);
                this.renderer.mouseUp(event);
            }

            this.navControl.mouseUp(event);
        },
        mouseMove(event){
            this.navControl.mouseMove(event);

            if (this.navControl.hotkeyTool == null){
                this.$emit('mouse-move', event);
                this.renderer.mouseMove(event);
            }
        },
        mouseLeave(event){
            this.mouseMove(event);
            this.navControl.mouseLeave(event);
            this.mouseUp(event);
        },
        wheel(event){
            this.navControl.scroll(event);
        },
        resize(){
            let wrapper = this.$refs.artCanvas;
            let canvas = this.$refs.canvas;

            canvas.width = Math.max(wrapper.clientWidth, 1);
            canvas.height = Math.max(wrapper.clientHeight, 1);

            this.$refs.navControlPanel.setContainerDimensions(wrapper.clientWidth, wrapper.clientHeight);

            if (this.renderer){
                this.renderer.resize();
                this.maxZoom = this.renderer.getZoomBounds().max;
            }
        },
        navChanged(navState){
            this.renderer.navChanged(navState);
        },
        enableNav(){
            this.$emit('nav-selected');
            this.tool.disableDrawing();
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