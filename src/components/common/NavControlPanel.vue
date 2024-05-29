<script setup lang="ts">
import NavControl from './NavControl.vue';
import HotkeyMap from '@/components/common/HotkeyMap';
import panIcon from '@/assets/navigation_hand.svg';
import zoomIcon from '@/assets/navigation_magglass.svg';
import centerIcon from '@/assets/navigation_center.svg';

import { onMounted, onBeforeUnmount } from 'vue';
import { useI18n } from 'vue-i18n';
import type { iControl } from './NavControl.vue';
import Core from '@/core';

const ZOOM_SENSITIVITY = 0.03;
const ZOOM_WHEEL_AMT = 0.8;

const { NAV_TOOL_TYPE, Vector } = Core;

const { t } = useI18n();

const props = defineProps<{
    navState: Core.NavState,
    selectedNavTool: Core.NAV_TOOL_TYPE | null,
    maxZoom: number,
    contentsBounds: number[],
    unitScale: number,
    dpiScale: number,
    parentEventBus: {
        onMouseDown?: Core.Event_Emitter<(event: MouseEvent)=>void>,
        onMouseUp?: Core.Event_Emitter<(event: MouseEvent)=>void>,
        onMouseMove?: Core.Event_Emitter<(event: MouseEvent)=>void>,
        onMouseWheel?: Core.Event_Emitter<(event: WheelEvent)=>void>,
        onMouseEnter?: Core.Event_Emitter<()=>void>,
        onMouseLeave?: Core.Event_Emitter<(event: MouseEvent)=>void>,
        onNavSetContainerDimensions?: Core.Event_Emitter<({width, height}: {width: number, height: number})=>void>,
    },
    invertYAxis?: boolean,
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

    props.parentEventBus.onMouseWheel?.listen(scroll);
    props.parentEventBus.onMouseMove?.listen(mouseMove);
    props.parentEventBus.onMouseDown?.listen(mouseDown);
    props.parentEventBus.onMouseUp?.listen(mouseUp);
    props.parentEventBus.onMouseEnter?.listen(mouseEnter);
    props.parentEventBus.onMouseLeave?.listen(mouseLeave);
    props.parentEventBus.onNavSetContainerDimensions?.listen(setContainerDimensions);
});

onBeforeUnmount(()=>{
    window.removeEventListener('keydown', hotkeyDown as EventListener);
    window.removeEventListener('keyup', hotkeyUp as EventListener);
    props.parentEventBus.onMouseWheel?.remove(scroll);
    props.parentEventBus.onMouseMove?.remove(mouseMove);
    props.parentEventBus.onMouseDown?.remove(mouseDown);
    props.parentEventBus.onMouseUp?.remove(mouseUp);
    props.parentEventBus.onMouseEnter?.remove(mouseEnter);
    props.parentEventBus.onMouseLeave?.remove(mouseLeave);
    props.parentEventBus.onNavSetContainerDimensions?.remove(setContainerDimensions);
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
    emit('nav-changed', props.navState);
}

function setContainerDimensions({width, height}: {width: number, height: number}): void {
    containerDimensions.x = width;
    containerDimensions.y = height;
}

function setZoom(newZoom: number): void {
    newZoom = Math.min(Math.max(newZoom, 0.5), props.maxZoom);
    props.navState.setZoom(newZoom);
}

function pan(): void {
    const curMouse = mouse.position.clone();
    const downPos = mouse.lastPosition.clone();
    const difference = curMouse.subtract(downPos);

    if (props.invertYAxis){
        difference.y *= -1;
    }

    difference.divideScalar(props.navState.zoomFac * props.unitScale).multiplyScalar(devicePixelRatio);
    props.navState.offset.add(difference);

    props.navState.setOffset(props.navState.offset);

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
    const dpiScale = props.dpiScale;

    const cornerUL = new Vector(
        props.contentsBounds[0],
        props.contentsBounds[1]
    );
    const cornerBR = new Vector(
        props.contentsBounds[2],
        props.contentsBounds[3]
    );
    const dimensions = new Vector(
        Math.abs(cornerUL.x - cornerBR.x),
        Math.abs(cornerUL.y - cornerBR.y)
    );
    const midPoint = new Vector(
        (props.contentsBounds[0] + props.contentsBounds[2]) / -2,
        (props.contentsBounds[1] + props.contentsBounds[3]) / 2
    );
    const maxContentsDim = Math.max(dimensions.x, dimensions.y);
    let minContainerDim = Math.min(
        containerDimensions.x,
        containerDimensions.y
    );

    minContainerDim /= props.unitScale;

    setZoom((minContainerDim / maxContentsDim) * dpiScale);
    props.navState.setOffset(midPoint);
    emit('nav-changed', props.navState);
}

defineExpose({centerView});
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