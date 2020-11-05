<template>
    <div ref="editWindow" class="editWindow">
        <UndoPanel class="undoPanel" />
        <NavControlPanel
            ref="navControlPanel"
            class="navControlPanel"
            stateModule="RoomEditor"
            maxZoom="2"
            @navChanged="canvasRenderer.navChange($event)"/>
        <canvas
            ref="canvas"
            class="canvas"
            @click="emitMouseEvent($event, mEvents.CLICK)"
            @mousedown="emitMouseEvent($event, mEvents.DOWN)"
            @mouseup="emitMouseEvent($event, mEvents.UP)"
            @mousemove="emitMouseEvent($event, mEvents.MOVE)">//Canvas Error</canvas>
        <img ref="camera_icon" style="display: none" src="@/assets/camera_location.svg"/>
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
    props: ['selectedRoom'],
    components: {
        NavControlPanel,
        UndoPanel
    },
    data() {
        return {
            canvasEl: null,
            canvasRenderer: null,
            mEvents: MOUSE_EVENT
        }
    },
    mounted() {
        //Setup Canvas and renderer
        this.canvasEl = this.$refs.canvas;
        this.canvasRenderer = new Room_Edit_Renderer(this.canvasEl);
        this.resize();
        this.canvasRenderer.navChange(this.$refs.navControlPanel.getNavState());

        //bind canvas events
        window.addEventListener('resize', this.resize);
        this.canvasEl.addEventListener('mousedown', this.canvasRenderer.mouseDown.bind(this.canvasRenderer));
        this.canvasEl.addEventListener('mouseup', this.canvasRenderer.mouseUp.bind(this.canvasRenderer));
        this.canvasEl.addEventListener('mousemove', this.canvasRenderer.mouseMove.bind(this.canvasRenderer));

        //Bind Nav Panel Events
        this.canvasEl.addEventListener('mousedown', this.$refs.navControlPanel.mouseDown);
        this.canvasEl.addEventListener('mouseup', this.$refs.navControlPanel.mouseUp);
        this.canvasEl.addEventListener('mousemove', this.$refs.navControlPanel.mouseMove);
        this.canvasEl.addEventListener('wheel', this.$refs.navControlPanel.scroll);
        this.canvasEl.addEventListener('mouseleave', this.$refs.navControlPanel.mouseLeave);

        if (this.selectedRoom){
            this.roomChange();
        }
    },
    beforeDestroy() {
        //unbind canvas events
        window.removeEventListener('resize', this.resize);
        this.canvasEl.removeEventListener('mousedown', this.canvasRenderer.mouseDown.bind(this.canvasRenderer));
        this.canvasEl.removeEventListener('mouseup', this.canvasRenderer.mouseUp.bind(this.canvasRenderer));
        this.canvasEl.removeEventListener('mousemove', this.canvasRenderer.mouseMove.bind(this.canvasRenderer));

        //unbind Nav Panel Events
        this.canvasEl.removeEventListener('mousedown', this.$refs.navControlPanel.mouseDown);
        this.canvasEl.removeEventListener('mouseup', this.$refs.navControlPanel.mouseUp);
        this.canvasEl.removeEventListener('mousemove', this.$refs.navControlPanel.mouseMove);
        this.canvasEl.removeEventListener('wheel', this.$refs.navControlPanel.scroll);
        this.canvasEl.removeEventListener('mouseleave', this.$refs.navControlPanel.mouseLeave);
    },
    methods: {
        roomChange(){
            this.canvasRenderer.setZDrawList(this.selectedRoom.zSortedList);
            this.canvasRenderer.setCamera(this.selectedRoom.camera, this.$refs.camera_icon);
        },
        resize() {
            let wrapper = this.$refs.editWindow;
            
            this.canvasEl.width = Math.max(wrapper.clientWidth, 1);
            this.canvasEl.height = Math.max(wrapper.clientHeight, 1);

            this.$refs.navControlPanel.setContainerDimensions(wrapper.clientWidth, wrapper.clientHeight);

            if (this.canvasRenderer){
                this.canvasRenderer.resize();
            }
        },
        emitMouseEvent(event, type){ 
            let canvasPos = new Victor(event.offsetX, event.offsetY);
            let worldPos = this.canvasRenderer.getMouseWorldPos();
            let cell = this.canvasRenderer.getMouseCell();
            let worldCell = this.canvasRenderer.getMouseWorldCell();
            this.$emit('mouse-event', {type, canvasPos, worldPos, cell, worldCell});
        },
        instancesChanged(){
            this.canvasRenderer.instancesChanged();
        },
        newInstanceSelected(newSelection){
            this.canvasRenderer.setSelectedInstance(newSelection);
        },
        cameraChanged(){
            this.canvasRenderer.drawCursor();
            this.canvasRenderer.composite();
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