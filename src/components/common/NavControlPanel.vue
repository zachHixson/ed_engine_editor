<script setup lang="ts">
import NavControl from './NavControl.vue';
import HotkeyMap from '@/components/common/HotkeyMap';
import panIcon from '@/assets/navigation_hand.svg';
import zoomIcon from '@/assets/navigation_magglass.svg';
import centerIcon from '@/assets/navigation_center.svg';

import { ref, defineProps, onMounted, onBeforeUnmount } from 'vue';
import { useI18n } from 'vue-i18n';
import type { Event_Bus } from '@/components/common/Event_Listener';
import type { iControl } from './NavControl.vue';
import Core from '@/core';

const ZOOM_SENSITIVITY = 0.03;
const ZOOM_WHEEL_AMT = 0.8;
const PRECISION = 100;

const { NAV_TOOL_TYPE, Vector } = Core;

const { t } = useI18n();

const props = defineProps<{
    navState: Core.iNavState,
    selectedNavTool: Core.NAV_TOOL_TYPE | null,
    maxZoom: number,
    contentsBounds: number[],
    unitScale: number,
    dpiScale: number,
    parentEventBus: Event_Bus,
}>();

const emit = defineEmits(['tool-selected', 'nav-changed', 'set-hotkey-tool']);

const controls: iControl[] = [
    {
        id: NAV_TOOL_TYPE.PAN,
        altText: t('navigation.pan_tool'),
        icon: panIcon,
        action: () => emit('tool-selected', NAV_TOOL_TYPE.PAN)
    },
    {
        id: Core.NAV_TOOL_TYPE.ZOOM,
        altText: t('navigation.zoom_tool'),
        icon: zoomIcon,
        action: () => emit('tool-selected', NAV_TOOL_TYPE.ZOOM)
    },
    {
        id: NAV_TOOL_TYPE.CENTER,
        altText: t('navigation.center_view'),
        icon: centerIcon,
        action: () => centerView()
    }
];
const containerDimensions = new Vector(0, 0);
const mouse = {
    position: new Vector(0, 0),
    down: false,
    mmDown: false,
    downPosition: new Vector(0, 0),
    lastPosition: new Vector(0, 0),
    dragDistance: new Vector(0, 0),
};
const hotkeyMap = new HotkeyMap();
const hotkeyDown = hotkeyMap.keyDown.bind(hotkeyMap);
const hotkeyUp = hotkeyMap.keyUp.bind(hotkeyMap);
let hotkeyTool: Core.NAV_TOOL_TYPE | null = null;

onMounted(()=>{
    window.addEventListener('keydown', hotkeyDown as EventListener);
    window.addEventListener('keyup', hotkeyUp as EventListener);

    hotkeyMap.bindKey(['mmb'], setHotkeyTool, [NAV_TOOL_TYPE.PAN], setHotkeyTool, [null])
    hotkeyMap.bindKey([' ', 'lmb'], setHotkeyTool, [NAV_TOOL_TYPE.PAN], setHotkeyTool, [null])
    hotkeyMap.bindKey(['control', 'lmb'], setHotkeyTool, [NAV_TOOL_TYPE.ZOOM], setHotkeyTool, [null]);
    hotkeyMap.bindKey(['control', 'f'], centerView);

    props.parentEventBus.addEventListener('mouse-wheel', scroll);
    props.parentEventBus.addEventListener('mouse-move', mouseMove);
    props.parentEventBus.addEventListener('mouse-down', mouseDown);
    props.parentEventBus.addEventListener('mouse-up', mouseUp);
    props.parentEventBus.addEventListener('mouse-enter', mouseEnter);
    props.parentEventBus.addEventListener('mouse-leave', mouseLeave);
    props.parentEventBus.addEventListener('nav-set-container-dimensions', setContainerDimensions);
});

onBeforeUnmount(()=>{
    window.removeEventListener('keydown', hotkeyDown as EventListener);
    window.removeEventListener('keyup', hotkeyUp as EventListener);
});

function controlClick(control: typeof controls[number]): void {
    control.action();
}

function setHotkeyTool(newTool: Core.NAV_TOOL_TYPE | null): void {
    hotkeyTool = newTool;
    emit('set-hotkey-tool', hotkeyTool);
}

function mouseDown(event: MouseEvent): void {
    hotkeyMap.mouseDown(event);
    mouse.downPosition.x = event.clientX;
    mouse.downPosition.y = event.clientY;
}

function mouseUp(event: MouseEvent): void {
    hotkeyMap.mouseUp(event);

    if (hotkeyTool == NAV_TOOL_TYPE.PAN){
        setHotkeyTool(null);
    }
}

function mouseMove(event: MouseEvent): void {
    mouse.lastPosition.copy(mouse.position);
    mouse.position.x = event.clientX;
    mouse.position.y = event.clientY;

    if (hotkeyMap.checkKeys(['lmb', 'mmb'])){
        let navTool = hotkeyTool ?? props.selectedNavTool;
        switch (navTool){
            case NAV_TOOL_TYPE.PAN:
                pan();
                break;
            case NAV_TOOL_TYPE.ZOOM:
                zoom();
                break;
        }
    }
}

function mouseEnter(): void {
    hotkeyMap.enabled = true;
}

function mouseLeave(event: MouseEvent): void {
    mouseUp(event);
    hotkeyMap.enabled = false;
}

function scroll(event: WheelEvent): void {
    let zoomDir = (event.deltaY < 0) ? 1 : -1;
    zoomDir *= ZOOM_WHEEL_AMT * (props.navState.zoomFac / props.maxZoom);
    setZoom(props.navState.zoomFac + zoomDir);
}

function getNavState(): {} {
    return props.navState;
}

function setContainerDimensions({width, height}: {width: number, height: number}): void {
    containerDimensions.x = width;
    containerDimensions.y = height;
}

function setZoom(newZoom: number): void {
    newZoom = Math.min(Math.max(newZoom, 0.5), props.maxZoom);
    props.navState.zoomFac = Math.round(newZoom * PRECISION) / PRECISION;
    emit('nav-changed', props.navState);
}

function pan(): void {
    let curMouse = new Vector(0,0).copy(mouse.position);
    let downPos = new Vector(0,0).copy(mouse.lastPosition);
    let difference = curMouse.subtract(downPos);

    difference.divideScalar(props.navState.zoomFac).multiplyScalar(devicePixelRatio);
    props.navState.offset.add(difference);

    props.navState.offset.multiplyScalar(PRECISION);
    props.navState.offset.round();
    props.navState.offset.divideScalar(PRECISION);

    emit('nav-changed', props.navState);
}

function zoom(): void {
    let yDifference = mouse.position.y - mouse.lastPosition.y;
    yDifference *= props.navState.zoomFac / props.maxZoom;
    yDifference *= ZOOM_SENSITIVITY;
    setZoom(props.navState.zoomFac + yDifference);

    emit('nav-changed', props.navState);
}

function centerView(): void {
    const dpiScale = props.dpiScale ?? 1;

    let cornerUL = new Vector(
        props.contentsBounds[0],
        props.contentsBounds[1]
    );
    let cornerBR = new Vector(
        props.contentsBounds[2],
        props.contentsBounds[3]
    );
    let dimensions = new Vector(
        Math.abs(cornerUL.x - cornerBR.x),
        Math.abs(cornerUL.y - cornerBR.y)
    );
    let midPoint = new Vector(
        (props.contentsBounds[0] + props.contentsBounds[2]) / -2,
        (props.contentsBounds[1] + props.contentsBounds[3]) / 2
    );
    let maxContentsDim = Math.max(dimensions.x, dimensions.y);
    let minContainerDim = Math.min(
        containerDimensions.x,
        containerDimensions.y
    );

    minContainerDim /= props.unitScale;
    midPoint.multiplyScalar(props.unitScale);

    setZoom((minContainerDim / maxContentsDim) * dpiScale);
    props.navState.offset.copy(midPoint);
    emit('nav-changed', props.navState);
}
</script>

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