<template>
    <div ref="editWindow" class="editWindow">
        <UndoPanel class="undoPanel" />
        <NavControlPanel
            ref="navControlPanel"
            class="navControlPanel"
            stateModule="RoomEditor"
            maxZoom="2"
            @navChanged="canvasRenderer.navChange($event)"/>
        <canvas ref="canvas" class="canvas">//Canvas Error</canvas>
    </div>
</template>

<script>
import NavControlPanel from '@/components/common/NavControlPanel';
import UndoPanel from '@/components/common/UndoPanel';
import Room_Edit_Renderer from './Room_Edit_Renderer';

export default {
    name: 'RoomEditWindow',
    components: {
        NavControlPanel,
        UndoPanel
    },
    data() {
        return {
            canvasEl: null,
            canvasRenderer: null
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
    },
    beforeDestroy() {
        window.removeEventListener('resize', this.resize);
    },
    methods: {
        resize() {
            let wrapper = this.$refs.editWindow;
            
            this.canvasEl.width = Math.max(wrapper.clientWidth, 1);
            this.canvasEl.height = Math.max(wrapper.clientHeight, 1);

            this.$refs.navControlPanel.setContainerDimensions(wrapper.clientWidth, wrapper.clientHeight);

            if (this.canvasRenderer){
                this.canvasRenderer.resize();
            }
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