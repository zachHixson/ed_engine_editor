<template>
    <div class="navControlPanel">
        <div class="controls">
            <NavControl
                v-bind:key="control.id"
                v-for="control in controls"
                v-bind:control="control"
                v-bind:stateModule="stateModule"
                v-on:click="controlClick" />
        </div>
    </div>
</template>

<script>
import Victor from 'victor';
import NavControl from './NavControl';

const ZOOM_SENSITIVITY = 0.03;
const ZOOM_WHEEL_AMT = 0.8;

const NAV_TOOL = {
    PAN: 0,
    ZOOM: 1,
    CENTER: 2
}
Object.freeze(NAV_TOOL);

let mouse = {
    position: new Victor(0, 0),
    down: false,
    mmDown: false,
    downPosition: new Victor(0, 0),
    lastPosition: new Victor(0, 0),
    dragDistance: new Victor(0, 0)
}
let keyMap = {};
let zoomFac = 1;
let rawOffset = new Victor(0, 0);

export default {
    name: 'NavControlPanel',
    props: ['stateModule', 'extra_controls', 'maxZoom'],
    data(){
        return {
            controls: [
                {
                    id: NAV_TOOL.PAN,
                    altText: this.$t('navigation.pan_tool'),
                    icon: 'assets/navigation_hand'
                },
                {
                    id: NAV_TOOL.ZOOM,
                    altText: this.$t('navigation.zoom_tool'),
                    icon: 'assets/navigation_magglass'
                },
                {
                    id: NAV_TOOL.CENTER,
                    altText: this.$t('navigation.center_view'),
                    icon: 'assets/navigation_center',
                    oneshot: true
                }
            ],
            viewBounds: [-500, -500, 500, 500],
            contentsBounds: [0, 0, 500, 500],
            containerDimensions: new Victor(0, 0),
            hotkeyTool: null
        }
    },
    components: {
        NavControl
    },
    mounted() {
        let extra = this.extra_controls || [];
        this.controls = [...extra, ...this.controls];
        zoomFac = this.$store.getters[this.stateModule + '/getNavZoom'];
        rawOffset = this.$store.getters[this.stateModule + '/getNavOffset'].clone();

        document.addEventListener('keydown', this.registerKeys);
        document.addEventListener('keyup', this.unregisterKeys);
    },
    methods: {
        controlClick(control){
            if (!control.oneshot){
                this.$store.dispatch(
                    this.stateModule + '/setSelectedNavTool',
                    control.id
                );
                this.$emit('tool-selected');
            }

            if (control.id == NAV_TOOL.CENTER){
                this.centerView();
                this.deselectTool();
            }
        },
        mouseDown(event){
            switch(event.which){
                case 1:
                    mouse.down = true;
                    break;
                case 2:
                    mouse.mmDown = true;
                    keyMap['mmb'] = true;
                    break;
            }

            mouse.downPosition.x = event.offsetX;
            mouse.downPosition.y = event.offsetY;

            this.detectKeyCombo();
        },
        mouseUp(event){
            mouse.down = false;
            mouse.mmDown = false;
            keyMap['mmb'] = false;

            if (this.hotkeyTool == NAV_TOOL.PAN){
                this.hotkeyTool = null;
            }

            this.$store.dispatch(
                this.stateModule + '/setNavZoom',
                zoomFac
            )
            this.$store.dispatch(
                this.stateModule + '/setNavOffset',
                rawOffset
            )

            this.detectKeyCombo();
        },
        mouseMove(event){
            mouse.lastPosition.copy(mouse.position);
            mouse.position.x = event.offsetX;
            mouse.position.y = event.offsetY;

            if (mouse.down || mouse.mmDown){
                let navTool = this.hotkeyTool ?? this.$store.getters[
                    this.stateModule + '/getSelectedNavTool'
                ];
                switch (navTool){
                    case NAV_TOOL.PAN:
                        this.pan();
                        break;
                    case NAV_TOOL.ZOOM:
                        this.zoom();
                        break;
                }
            }
        },
        mouseLeave(event){
            this.mouseUp(event);
        },
        scroll(event){
            let zoomDir = event.deltaY < 0 ? 1 : -1;
            zoomDir *= ZOOM_WHEEL_AMT * (zoomFac / this.maxZoom);
            this.setZoom(zoomFac + zoomDir);
        },
        registerKeys(event){
            keyMap[event.key] = true;
            this.detectKeyCombo();
        },
        unregisterKeys(event){
            keyMap[event.key] = false;
            this.detectKeyCombo();
        },
        detectKeyCombo(){
            let keyDown = false;

            if (keyMap[' '] && mouse.down){
                this.hotkeyTool = NAV_TOOL.PAN;
            }
            
            if (keyMap['Control'] && keyMap['f']){
                event.preventDefault();
                this.centerView();
            }
            else if (keyMap['Control'] && mouse.down){
                this.hotkeyTool = NAV_TOOL.ZOOM;
            }

            if (keyMap['mmb']){
                this.hotkeyTool = NAV_TOOL.PAN;
            }

            for (let key in keyMap){
                if (keyMap[key]){
                    keyDown = true;
                }
            }

            if (!keyDown){
                this.hotkeyTool = null;
            }
        },
        getNavState(){
            return {rawOffset, zoomFac};
        },
        deselectTool(){
            this.selectedTool = null;
            this.$store.dispatch(
                this.stateModule + '/setSelectedNavTool',
                null
            )
            this.$emit('tool-deselected');
        },
        setViewBounds(newBounds){
            if (newBounds.length < 4){
                return -1;
            }

            for (let i = 0; i < this.viewBounds.length; i++){
                this.viewBounds[i] = newBounds[i];
            }
        },
        setContentsBounds(newBounds){
            if (newBounds.length < 4){
                return -1;
            }

            for (let i = 0; i < this.contentsBounds.length; i++){
                this.contentsBounds[i] = newBounds[i];
            }
        },
        setContainerDimensions(width, height){
            this.containerDimensions.x = width;
            this.containerDimensions.y = height;
        },
        setZoom(newZoom){
            zoomFac = Math.min(Math.max(newZoom, 0.5), this.maxZoom);
            this.$emit('navChanged', {rawOffset, zoomFac});
        },
        pan(){
            let curMouse = new Victor(0,0).copy(mouse.position);
            let downPos = new Victor(0,0).copy(mouse.lastPosition);
            let difference = curMouse.subtract(downPos);

            difference.divide(new Victor(zoomFac, zoomFac));
            rawOffset.add(difference);

            this.$emit('navChanged', {rawOffset, zoomFac});
        },
        zoom(){
            let yDifference = mouse.position.y - mouse.lastPosition.y;
            yDifference *= zoomFac / this.maxZoom;
            yDifference *= ZOOM_SENSITIVITY;
            this.setZoom(zoomFac + yDifference);

            this.$emit('navChanged', {rawOffset, zoomFac});
        },
        centerView(){
            let cornerUL = new Victor(
                this.contentsBounds[0],
                this.contentsBounds[1]
            );
            let cornerBR = new Victor(
                this.contentsBounds[2],
                this.contentsBounds[3]
            );
            let dimensions = new Victor(
                Math.abs(cornerUL.x - cornerBR.x),
                Math.abs(cornerUL.y - cornerBR.y)
            );
            let maxContentsDim = Math.max(dimensions.x, dimensions.y);
            let minContainerDim = Math.min(
                this.containerDimensions.x,
                this.containerDimensions.y
            );

            this.setZoom((minContainerDim / maxContentsDim) * .99);
            rawOffset.x = 0;
            rawOffset.y = 0;
            this.$emit('navChanged', {rawOffset, zoomFac});
        }
    }
}
</script>

<style scoped>
    .navControlPanel{
        display: flex;
        flex-direction: row;
    }

    .controls{
        display: flex;
        flex-direction: row;
    }
</style>