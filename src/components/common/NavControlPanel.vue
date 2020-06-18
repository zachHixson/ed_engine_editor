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
import {store} from 'vuex';
import NavControl from './NavControl';

const ZOOM_SENSITIVITY = 200;

let mouse = {
    position: new Victor(0, 0),
    down: false,
    downPosition: new Victor(0, 0),
    lastPosition: new Victor(0, 0),
    dragDistance: new Victor(0, 0)
}
let selectedTool = null;
let hotkeyTool = null;
let keyMap = {};
let zoomFac = 1;
let rawOffset = new Victor(0, 0);

export default {
    name: 'NavControlPanel',
    props: ['stateModule', 'extra_controls'],
    data(){
        return {
            controls: [
                {
                    id: 'pan',
                    altText: this.$t('navigation.pan_tool'),
                    icon: 'assets/navigation_hand'
                },
                {
                    id: 'zoom',
                    altText: this.$t('navigation.zoom_tool'),
                    icon: 'assets/navigation_magglass'
                },
                {
                    id: 'center',
                    altText: this.$t('navigation.center_view'),
                    icon: 'assets/navigation_center',
                    oneshot: true
                }
            ],
            viewBounds: [-500, -500, 500, 500],
            contentsBounds: [0, 0, 500, 500],
            containerDimensions: new Victor(0, 0)
        }
    },
    components: {
        NavControl
    },
    mounted() {
        let extra = this.extra_controls || [];
        this.controls = [...extra, ...this.controls];
        zoomFac = this.$store.getters[this.stateModule + '/getZoomFac'];
        rawOffset = this.$store.getters[this.stateModule + '/getOffset'].clone();

        document.addEventListener('keydown', this.registerKeys);
        document.addEventListener('keyup', this.unregisterKeys);
    },
    methods: {
        controlClick(control){
            if (!control.oneshot){
                selectedTool = control.id;
            }

            if (control.id == 'center'){
                this.centerView();
            }
        },
        mouseDown(event){
            mouse.down = true;
            mouse.downPosition.x = event.offsetX;
            mouse.downPosition.y = event.offsetY;
        },
        mouseUp(event){
            mouse.down = false;
            this.$store.dispatch(
                this.stateModule + '/setZoomFac',
                zoomFac
            )
            this.$store.dispatch(
                this.stateModule + '/setOffset',
                rawOffset
            )
        },
        mouseMove(event){
            mouse.lastPosition.copy(mouse.position);
            mouse.position.x = event.offsetX;
            mouse.position.y = event.offsetY;

            if (mouse.down){
                switch (selectedTool){
                    case 'pan':
                        this.pan();
                        break;
                    case 'zoom':
                        this.zoom();
                        break;
                    default:
                        //
                }

                this.$emit('navChanged', {rawOffset, zoomFac});
            }
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

            if (keyMap[' ']){
                selectedTool = 'pan';
            }
            
            if (keyMap['Control'] && keyMap['f']){
                event.preventDefault();
                console.log("centered");
            }
            else if (keyMap['Control']){
                event.preventDefault();
                selectedTool = 'zoom';
            }

            for (let key in keyMap){
                if (keyMap[key]){
                    keyDown = true;
                }
            }

            if (!keyDown){
                this.$store.dispatch(
                    this.stateModule + '/setSelectedTool',
                    null
                )
                selectedTool = null;
            }
        },
        getNavState(){
            return {rawOffset, zoomFac};
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
        setContainerDimensions({width, height}){
            this.containerDimensions.x = width;
            this.containerDimensions.y = height;
        },
        setZoom(newZoom){
            zoomFac = Math.min(Math.max(newZoom, 0.5), 2);
        },
        pan(){
            let curMouse = new Victor(0,0).copy(mouse.position);
            let downPos = new Victor(0,0).copy(mouse.lastPosition);
            let difference = curMouse.subtract(downPos);

            difference.divide(new Victor(zoomFac, zoomFac));
            rawOffset.add(difference);
        },
        zoom(){
            let yDifference = mouse.position.y - mouse.lastPosition.y;
            yDifference /= ZOOM_SENSITIVITY;
            this.setZoom(zoomFac + yDifference);
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

            this.setZoom(minContainerDim / maxContentsDim);
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
        height: 50px;
    }

    .controls{
        display: flex;
        flex-direction: row;
        width: 100%;
    }
</style>