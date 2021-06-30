<template>
    <div class="navControlPanel">
        <div class="controls">
            <NavControl
                :key="control.id"
                v-for="control in controls"
                :control="control"
                :isSelected="selectedNavTool == control.id"
                @click="controlClick" />
        </div>
    </div>
</template>

<script>
import Victor from 'victor';
import NavControl from './NavControl';
import HotkeyMap from '@/components/common/HotkeyMap';

const ZOOM_SENSITIVITY = 0.03;
const ZOOM_WHEEL_AMT = 0.8;
const PRECISION = 100;

const NAV_TOOL = {
    PAN: 0,
    ZOOM: 1,
    CENTER: 2
}
Object.freeze(NAV_TOOL);

export default {
    name: 'NavControlPanel',
    props: ['navState', 'selectedNavTool', 'maxZoom', 'contentsBounds', 'unitScale'],
    components: {
        NavControl
    },
    data(){
        return {
            controls: [
                {
                    id: NAV_TOOL.PAN,
                    altText: this.$t('navigation.pan_tool'),
                    icon: 'assets/navigation_hand',
                    action: () => this.$emit('tool-selected', NAV_TOOL.PAN)
                },
                {
                    id: NAV_TOOL.ZOOM,
                    altText: this.$t('navigation.zoom_tool'),
                    icon: 'assets/navigation_magglass',
                    action: () => this.$emit('tool-selected', NAV_TOOL.ZOOM)
                },
                {
                    id: NAV_TOOL.CENTER,
                    altText: this.$t('navigation.center_view'),
                    icon: 'assets/navigation_center',
                    action: () => this.centerView()
                }
            ],
            containerDimensions: new Victor(0, 0),
            hotkeyTool: null,
            mouse: {
                position: new Victor(0, 0),
                down: false,
                mmDown: false,
                downPosition: new Victor(0, 0),
                lastPosition: new Victor(0, 0),
                dragDistance: new Victor(0, 0)
            },
            hotkeyMap: new HotkeyMap(),
            hotkeyDown: null,
            hotkeyUp: null,
            unitSize: 1
        }
    },
    mounted(){
        let hotToolMacro = (keyArr, tool) => [keyArr, this.setHotkeyTool, [tool], this.setHotkeyTool, [null]];

        this.hotkeyDown = this.hotkeyMap.keyDown.bind(this.hotkeyMap);
        this.hotkeyUp = this.hotkeyMap.keyUp.bind(this.hotkeyMap);

        window.addEventListener('keydown', this.hotkeyDown);
        window.addEventListener('keyup', this.hotkeyUp);

        this.hotkeyMap.bindKey(...hotToolMacro(['mmb'], NAV_TOOL.PAN));
        this.hotkeyMap.bindKey(...hotToolMacro([' ', 'lmb'], NAV_TOOL.PAN));
        this.hotkeyMap.bindKey(...hotToolMacro(['control', 'lmb'], NAV_TOOL.ZOOM));
        this.hotkeyMap.bindKey(['control', 'f'], this.centerView);
    },
    beforeDestroy(){
        window.removeEventListener('keydown', this.hotkeyDown);
        window.removeEventListener('keyup', this.hotkeyUp);
    },
    methods: {
        controlClick(control){
            control.action();
        },
        setHotkeyTool(newTool){
            this.hotkeyTool = newTool;
        },
        mouseDown(event){
            this.hotkeyMap.mouseDown(event);
            this.mouse.downPosition.x = event.offsetX;
            this.mouse.downPosition.y = event.offsetY;
        },
        mouseUp(event){
            this.hotkeyMap.mouseUp(event);

            if (this.hotkeyTool == NAV_TOOL.PAN){
                this.setHotkeyTool(null);
            }
        },
        mouseMove(event){
            this.mouse.lastPosition.copy(this.mouse.position);
            this.mouse.position.x = event.offsetX;
            this.mouse.position.y = event.offsetY;

            if (this.hotkeyMap.checkKeys(['lmb', 'mmb'])){
                let navTool = this.hotkeyTool ?? this.selectedNavTool;
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
        mouseEnter(){
            this.hotkeyMap.enabled = true;
        },
        mouseLeave(event){
            this.mouseUp(event);
            this.hotkeyMap.enabled = false;
        },
        scroll(event){
            let zoomDir = (event.deltaY < 0) ? 1 : -1;
            zoomDir *= ZOOM_WHEEL_AMT * (this.navState.zoomFac / this.maxZoom);
            this.setZoom(this.navState.zoomFac + zoomDir);
        },
        getNavState(){
            return this.navState;
        },
        setContainerDimensions(width, height){
            this.containerDimensions.x = width;
            this.containerDimensions.y = height;
        },
        setZoom(newZoom){
            newZoom = Math.min(Math.max(newZoom, 0.5), this.maxZoom);
            this.navState.zoomFac = Math.round(newZoom * PRECISION) / PRECISION;
            this.$emit('navChanged', this.navState);
        },
        pan(){
            let curMouse = new Victor(0,0).copy(this.mouse.position);
            let downPos = new Victor(0,0).copy(this.mouse.lastPosition);
            let difference = curMouse.subtract(downPos);

            difference.divide(new Victor(this.navState.zoomFac, this.navState.zoomFac));
            this.navState.offset.add(difference);

            this.navState.offset.multiplyScalar(PRECISION);
            this.navState.offset.unfloat();
            this.navState.offset.divideScalar(PRECISION);

            this.$emit('navChanged', this.navState);
        },
        zoom(){
            let yDifference = this.mouse.position.y - this.mouse.lastPosition.y;
            yDifference *= this.navState.zoomFac / this.maxZoom;
            yDifference *= ZOOM_SENSITIVITY;
            this.setZoom(this.navState.zoomFac + yDifference);

            this.$emit('navChanged', this.navState);
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
            let midPoint = new Victor(
                (this.contentsBounds[0] + this.contentsBounds[2]) / -2,
                (this.contentsBounds[1] + this.contentsBounds[3]) / 2
            );
            let maxContentsDim = Math.max(dimensions.x, dimensions.y);
            let minContainerDim = Math.min(
                this.containerDimensions.x,
                this.containerDimensions.y
            );

            minContainerDim /= this.unitScale;
            midPoint.multiplyScalar(this.unitScale);

            this.setZoom(minContainerDim / maxContentsDim);
            this.navState.offset.copy(midPoint);
            this.$emit('navChanged', this.navState);
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