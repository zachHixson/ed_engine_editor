<template>
    <div id="artCanvas" ref="artCanvas">
        <UndoPanel class="undoPanel" :undoLength="undoLength" :redoLength="redoLength" @undo="undo()" @redo="redo()"/>
        <canvas id="canvas" class="canvas" ref="canvas">
            //Error loading HTML5 canvas, check browser compatibility
        </canvas>
        <NavControlPanel
            class="navControlPanel"
            ref="navControlPanel"
            :navState="navState"
            :selectedNavTool="selectedNavTool"
            :maxZoom="maxZoom"
            :contentsBounds="contentsBounds"
            :unitScale="UNIT_WIDTH"
            @navChanged="renderer.navChanged()"
            @tool-selected="enableNav"/>
    </div>
</template>

<script>
import UndoPanel from "@/components/common/UndoPanel";
import NavControlPanel from '@/components/common/NavControlPanel';
import Art_Canvas_Renderer from './Art_Canvas_Renderer';

const DEFAULT_CELL_SIZE = 20;

export default {
    name: "ArtCanvas",
    props: ['tool', 'navState', 'spriteFrame', 'undoLength', 'redoLength'],
    components: {
        UndoPanel,
        NavControlPanel
    },
    data() {
        return {
            canvas: null,
            renderer: null,
            previewData: new ImageData(Shared.Sprite.DIMENSIONS, Shared.Sprite.DIMENSIONS),
            navControl: null,
            maxZoom: 2,
            toolMap: new Map(),
            mouseCell: new Victor(),
            unitScale: 1
        }
    },
    computed: {
        GRID_DIV(){
            return Shared.Sprite.DIMENSIONS;
        },
        CANVAS_WIDTH(){
            return this.GRID_DIV * DEFAULT_CELL_SIZE;
        },
        UNIT_WIDTH(){
            return DEFAULT_CELL_SIZE / this.GRID_DIV;
        },
        contentsBounds(){
            let halfCanvas = (this.CANVAS_WIDTH / 2) * 1;
            return [-halfCanvas, -halfCanvas, halfCanvas, halfCanvas];
        },
        selectedNavTool(){
            return this.$store.getters['ArtEditor/getSelectedNavTool'];
        },
        toolSize(){
            return this.$store.getters['ArtEditor/getSelectedSize'];
        }
    },
    watch: {
        tool(){
            if (this.tool){
                this.tool.beforeDestroy();
                this.tool.setPixelBuff(this.spriteFrame);
                this.tool.setPreviewBuff(this.previewData);
                this.tool.setMouseCell(this.mouseCell);
                this.tool.updateCursorBuff();
                this.renderer.mouseMove();
            }
        },
        toolSize(){
           if (this.tool){
               this.tool.updateCursorBuff();
               this.renderer.mouseMove();
           }
        },
        spriteFrame(){
            this.renderer.setSprite(this.spriteFrame, this.navState);
            this.tool.setPixelBuff(this.spriteFrame);
            this.previewData.data.fill(0);
        }
    },
    mounted(){
        this.canvas = this.$refs.canvas;
        this.navControl = this.$refs.navControlPanel;
        this.renderer = new Art_Canvas_Renderer(this.canvas, this.spriteFrame, this.previewData, this.navState);
        
        this.canvas.addEventListener('mousedown', this.mouseDown);
        this.canvas.addEventListener('mouseup', this.mouseUp);
        this.canvas.addEventListener('mousemove', this.mouseMove);
        this.canvas.addEventListener('wheel', this.wheel);
        this.canvas.addEventListener('mouseenter', this.navControl.mouseEnter);
        this.canvas.addEventListener('mouseleave', this.mouseLeave);

        this.maxZoom = this.getZoomBounds().max;
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
                this.updateMouseCell(event);
                this.$emit('mouse-move', event);
                this.renderer.mouseMove(event);
            }
        },
        mouseLeave(event){
            this.mouseMove(event);
            this.navControl.mouseLeave(event);
            this.$emit('mouse-leave', event);
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
                this.maxZoom = this.getZoomBounds().max;
            }
        },
        enableNav(navTool){
            this.$store.dispatch('ArtEditor/selectTool', null);
            this.$store.dispatch('ArtEditor/setSelectedNavTool', navTool);
            this.$emit('nav-selected');
        },
        getZoomBounds(){
            let maxZoom = (Math.max(this.canvas.clientWidth, this.canvas.clientHeight) / this.CANVAS_WIDTH) * 2;
            return {min: 0.5, max: maxZoom};
        },
        undo(){
            this.$emit('undo');
        },
        redo(){
            this.$emit('redo');
        },
        updateMouseCell(event){
            const CELL_SIZE = (this.CANVAS_WIDTH / this.GRID_DIV) * this.navState.zoomFac;
            let mouseCell = new Victor(event.offsetX, event.offsetY);
            let windowHalfWidth = new Victor(this.canvas.width / 2, this.canvas.height / 2);
            let canvasHalfWidth = new Victor(this.CANVAS_WIDTH / 2, this.CANVAS_WIDTH / 2);
            let scaledOffset = this.navState.offset.clone().multiplyScalar(this.navState.zoomFac);

            canvasHalfWidth.multiplyScalar(this.navState.zoomFac);

            mouseCell.subtract(windowHalfWidth);
            mouseCell.add(canvasHalfWidth);
            mouseCell.subtract(scaledOffset);
            mouseCell.divideScalar(CELL_SIZE);

            mouseCell.x = Math.floor(mouseCell.x);
            mouseCell.y = Math.floor(mouseCell.y);

            this.mouseCell.copy(mouseCell);
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