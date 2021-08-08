<template>
    <div ref="editWindow" class="editWindow">
        <UndoPanel
            class="undoPanel"
            :undoLength="undoLength"
            :redoLength="redoLength"
            @undo="$emit('undo')"
            @redo="$emit('redo')"/>
        <NavControlPanel
            ref="navControlPanel"
            class="navControlPanel"
            :navState="selectedRoom.navState"
            :selectedNavTool="selectedNavTool"
            :contentsBounds="contentsBounds"
            :unitScale="unitWidth"
            maxZoom="2"
            @navChanged="renderer.navChange()"
            @tool-selected="navToolSelected"/>
        <canvas
            ref="canvas"
            class="canvas"
            @mousedown="mouseDown"
            @mouseup="mouseUp"
            @mousemove="mouseMove">//Canvas Error</canvas>
        <div ref="canvasImages" style="display: none">
            <img ref="camera_icon" src="@/assets/camera_location.svg" @load="checkImageLoading()"/>
            <img ref="noSprite_icon" src="@/assets/object_icon.svg" @load="checkImageLoading()"/>
            <img ref="exit_icon" src="@/assets/exit.svg" @load="checkImageLoading()"/>
            <img ref="end_icon" src="@/assets/end.svg" @load="checkImageLoading()"/>
        </div>
    </div>
</template>

<script>
import Victor from 'victor';
import {MOUSE_EVENT} from '@/common/Enums';
import NavControlPanel from '@/components/common/NavControlPanel';
import UndoPanel from '@/components/common/UndoPanel';
import Room_Edit_Renderer from './Room_Edit_Renderer';

export default {
    name: 'RoomEditWindow',
    props: ['selectedRoom', 'editorSelection', 'undoLength', 'redoLength'],
    components: {
        NavControlPanel,
        UndoPanel
    },
    data() {
        return {
            canvasEl: null,
            renderer: null,
            loadedImages: 0,
            contentsBounds: [0, 0, 0, 0],
            unitWidth: 1
        }
    },
    computed: {
        gridEnabled(){
            return this.$store.getters["RoomEditor/getGridState"];
        },
        checkAssetDeletion(){
            //if eather of the following values change, it will trigger an update for the watcher of this prop
            return this.$store.getters['GameData/getAllObjects'].length + this.$store.getters['GameData/getAllSprites'].length;
        },
        selectedNavTool(){
            return this.$store.getters['RoomEditor/getSelectedNavTool'];
        }
    },
    watch: {
        selectedRoom(){
            this.roomChange();
        },
        editorSelection(){
            this.setSelection();
        },
        gridEnabled(newVal){
            this.renderer.setGridVisibility(newVal);
        },
        checkAssetDeletion(newVal, oldVal){
            if (newVal < oldVal){
                this.renderer.drawObjects();
            }
        }
    },
    mounted() {
        //Setup Canvas and renderer
        this.canvasEl = this.$refs.canvas;
        this.renderer = new Room_Edit_Renderer(this.canvasEl, this.selectedRoom.navState);
        this.contentsBounds = this.selectedRoom.getContentsBounds();
        this.unitWidth = this.renderer.UNIT_WIDTH;
        this.resize();

        //bind events
        window.addEventListener('resize', this.resize);
        this.canvasEl.addEventListener('wheel', this.$refs.navControlPanel.scroll);
        this.canvasEl.addEventListener('mouseenter', this.mouseEnter);
        this.canvasEl.addEventListener('mouseleave', this.mouseLeave);

        this.renderer.setSVG({
            camera: this.$refs.camera_icon,
            noSprite: this.$refs.noSprite_icon,
            exit: this.$refs.exit_icon,
            end: this.$refs.end_icon
        });

        if (this.selectedRoom){
            this.roomChange();
        }
    },
    beforeDestroy() {
        //unbind events
        window.removeEventListener('resize', this.resize);
        this.canvasEl.removeEventListener('wheel', this.$refs.navControlPanel.scroll);
        this.canvasEl.removeEventListener('mouseleave', this.$refs.navControlPanel.mouseLeave);
    },
    methods: {
        mouseDown(event){
            this.$refs.navControlPanel.mouseDown(event);
            this.emitMouseEvent(event, MOUSE_EVENT.DOWN);
        },
        mouseUp(event){
            this.$refs.navControlPanel.mouseUp(event);
            this.emitMouseEvent(event, MOUSE_EVENT.UP);
        },
        mouseMove(event){
            this.$refs.navControlPanel.mouseMove(event);
            this.emitMouseEvent(event, MOUSE_EVENT.MOVE);
            this.renderer.mouseMove(event);
        },
        mouseEnter(event){
            this.$refs.navControlPanel.mouseEnter(event);
            this.renderer.enableCursor = true;
        },
        mouseLeave(event){
            this.$refs.navControlPanel.mouseLeave(event);
            this.emitMouseEvent(event, MOUSE_EVENT.LEAVE);
            this.renderer.enableCursor = false;
            this.renderer.mouseMove(event);
        },
        roomChange(){
            this.renderer.setRoomRef(this.selectedRoom);
        },
        resize(){
            let wrapper = this.$refs.editWindow;
            
            this.canvasEl.width = Math.max(wrapper.clientWidth, 1);
            this.canvasEl.height = Math.max(wrapper.clientHeight, 1);

            this.$refs.navControlPanel.setContainerDimensions(wrapper.clientWidth, wrapper.clientHeight);

            if (this.renderer){
                this.renderer.resize();
            }
        },
        emitMouseEvent(event, type){
            let selectedNavTool = this.$store.getters['RoomEditor/getSelectedNavTool'];
            let navToolState = this.$refs.navControlPanel.hotkeyTool;

            if (event.which == 1 && selectedNavTool == null && navToolState == null){
                let canvasPos = new Victor(event.offsetX, event.offsetY);
                let cell = this.renderer.getMouseCell();
                let worldCell = this.renderer.getMouseWorldCell();
                
                this.$emit('mouse-event', {type, canvasPos, cell, worldCell});
            }
        },
        instancesChanged(){
            this.contentsBounds = this.selectedRoom.getContentsBounds();
            this.renderer.instancesChanged();
        },
        setSelection(){
            this.renderer.setSelection(this.editorSelection);
        },
        cameraChanged(){
            this.contentsBounds = this.selectedRoom.getContentsBounds();
            this.renderer.instancesChanged();
        },
        bgColorChanged(){
            this.renderer.bgColorChanged();
        },
        checkImageLoading(){
            this.loadedImages++;
            
            if (this.loadedImages >= this.$refs.canvasImages.children.length){
                this.renderer.fullRedraw();
            }
        },
        navToolSelected(tool){
            this.$store.dispatch('RoomEditor/setSelectedTool', null);
            this.$store.dispatch('RoomEditor/setSelectedNavTool', tool);
        }
    }
}
</script>

<style scoped>
.editWindow{
    position: relative;
    box-sizing: border-box;
    width: 100%;
    height: 100%;
    margin: 0px;
    padding: 0px;
    background: #6666FF;
}

.canvas{
    position: absolute;
    box-sizing: border-box;
}

.navControlPanel{
    position: absolute;
    top: 0;
    right: 0;
    z-index: 5;
}

.undoPanel{
    position: absolute;
    top: 0;
    left: 0;
    z-index: 5;
}
</style>