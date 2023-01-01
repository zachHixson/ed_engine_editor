<script setup lang="ts">
import type Node_Connection from './Node_Connection';

import { ref, computed, nextTick, onMounted, onBeforeUnmount } from 'vue';
import Core from '@/core';
import type { iRelinkInfo } from './Node.vue';
import type Socket from './Socket.vue';

const enum HANDLE {
    LEFT = -1,
    RIGHT = 1,
    NONE = 0
}

const PADDING = 20;
const HANDLE_WIDTH = 100;
const GRAB_DIST = 70;

const { Vector } = Core;

const props = defineProps<{
    connectionObj: Node_Connection,
    clientToNavSpace: (pos: Core.Vector)=>Core.Vector,
    navWrapper: HTMLDivElement,
    allConnections: Node_Connection[],
    draggingConnection: Node_Connection | null,
}>();

const emit = defineEmits(['drag-start']);

const rootRef = ref<HTMLElement>();

const startPoint = ref(new Vector());
const endPoint = ref(new Vector());
const width = ref(0);
const height = ref(0);
const cssOrigin = ref(new Vector());
const path = ref('');
const grabbedHandle = ref<HANDLE>(0);
const navMouseDown = ref(new Vector());
const navMousePos = ref(new Vector());
const mouseOver = ref(false);

const flipVertical = computed(()=>startPoint.value.y > endPoint.value.y);
const isFullConnection = computed(()=>props.connectionObj.startSocketId != null && props.connectionObj.endSocketId != null);
const isDraggingAnotherConnection = computed(()=>props.draggingConnection && props.draggingConnection != props.connectionObj);

onMounted(()=>{
    //Check if the connection is still in the process of being connected
    if (!isFullConnection.value){
        registerConnectEvents();
        nextTick(()=>{
            setInitialMousePos();
            update();
        });
    }
});

onBeforeUnmount(()=>{
    window.removeEventListener('mousemove', mouseMove);
    window.removeEventListener('mousemove', mouseDrag);
    props.connectionObj.componentDestructor();
});

function registerConnectEvents(): void {
    window.addEventListener('mousemove', mouseMove);
    window.addEventListener('mouseup', ()=>{
        window.removeEventListener('mousemove', mouseMove);
        mouseOver.value = false;
    }, {once: true});
}

function relink(nodeInfoMap: Map<number, iRelinkInfo>): void {
    const start = nodeInfoMap.get(props.connectionObj.startNode!.nodeId)!;
    const end = nodeInfoMap.get(props.connectionObj.endNode!.nodeId)!;
    const startSocketComp = start.sockets.get(props.connectionObj.startSocketId!);
    const endSocketComp = end.sockets.get(props.connectionObj.endSocketId!);

    props.connectionObj.canConnect = true;
    props.connectionObj.startSocketEl = startSocketComp!.$refs.socketConnectionRef as HTMLElement;
    props.connectionObj.endSocketEl = endSocketComp!.$refs.socketConnectionRef as HTMLElement;

    nextTick(()=>{
        update();
    });
}

function setInitialMousePos(): void {
    const socketEl = (props.connectionObj.startSocketEl ?? props.connectionObj.endSocketEl)!;
    const bounds = socketEl.getBoundingClientRect();
    const midPoint = centerFromBounds(bounds);
    const navMidPoint = props.clientToNavSpace(midPoint);

    navMousePos.value.copy(navMidPoint);
}

function update(): void {
    updateStartPoint();
    updateEndPoint();
    updateWidth();
    updateHeight();
    updateCSSPos();
    updatePath();
}

function updateStartPoint(): void {
    if (!props.connectionObj.startSocketEl){
        startPoint.value.copy(navMousePos.value);
        return;
    }

    const bounds = props.connectionObj.startSocketEl.getBoundingClientRect();
    const clientCenter = centerFromBounds(bounds);
    startPoint.value.copy(props.clientToNavSpace(clientCenter));
}

function updateEndPoint(): void {
    if (!props.connectionObj.endSocketEl){
        endPoint.value.copy(navMousePos.value);
        return;
    }

    const bounds = props.connectionObj.endSocketEl.getBoundingClientRect();
    const clientCenter = centerFromBounds(bounds);
    endPoint.value.copy(props.clientToNavSpace(clientCenter));
}

function updateWidth(): void {
    const minX = Math.min(startPoint.value.x, endPoint.value.x - HANDLE_WIDTH) - PADDING;
    const maxX = Math.max(startPoint.value.x + HANDLE_WIDTH, endPoint.value.x) + PADDING;
    width.value = Math.abs(minX - maxX);
}

function updateHeight(): void {
    height.value = Math.abs(startPoint.value.y - endPoint.value.y) + (2 * PADDING);
}

function updateCSSPos(): void {
    const minX = Math.min(startPoint.value.x, endPoint.value.x - HANDLE_WIDTH);
    const minY = Math.min(startPoint.value.y, endPoint.value.y);

    cssOrigin.value.set(
        minX - PADDING,
        minY - PADDING,
    );

    rootRef.value!.style.left = cssOrigin.value.x + 'px';
    rootRef.value!.style.top = cssOrigin.value.y + 'px';
}

function updatePath(): void {
    const Y_SHRINK_LIMIT = 200;

    const startCoord = navToSVGSpace(startPoint.value);
    const endCoord = navToSVGSpace(endPoint.value);
    const vPaddingDir = -flipVertical.value;
    const yShrinkFac = Math.min(startPoint.value.distanceTo(endPoint.value), Y_SHRINK_LIMIT) / Y_SHRINK_LIMIT;
    const handleWidth = HANDLE_WIDTH * yShrinkFac;

    if (flipVertical.value){
        startCoord.y = height.value;
    }

    path.value = `M ${startCoord.x} ${startCoord.y + (vPaddingDir * PADDING)}
                    C ${startCoord.x + handleWidth + PADDING} ${startCoord.y + (vPaddingDir * PADDING)},
                    ${endCoord.x - handleWidth - PADDING} ${endCoord.y},
                    ${endCoord.x} ${endCoord.y}`;
}

function mouseDown(event: MouseEvent): void {
    if (event.button != 0){
        return;
    }

    const clientMouseDown = new Vector(event.clientX, event.clientY);
    navMouseDown.value.copy(props.clientToNavSpace(clientMouseDown));
    const distToStart = navMouseDown.value.distanceTo(startPoint.value);
    const distToEnd = navMouseDown.value.distanceTo(endPoint.value);

    if (distToEnd < GRAB_DIST){
        grabbedHandle.value = HANDLE.RIGHT;
    }
    else if (distToStart < GRAB_DIST){
        grabbedHandle.value = HANDLE.LEFT;
    }

    if (grabbedHandle.value){
        window.addEventListener('mousemove', mouseDrag);
        window.addEventListener('mouseup', ()=>{
            window.removeEventListener('mousemove', mouseDrag);
        }, {once: true});
    }
}

function mouseMove(event: MouseEvent): void {
    updateMousePos(event);
    update();
}

function mouseDrag(event: MouseEvent): void {
    updateMousePos(event);

    const dragDistance = navMouseDown.value.distanceTo(navMousePos.value);

    if (dragDistance > 5){
        emit('drag-start', props.connectionObj);
        
        if (grabbedHandle.value == HANDLE.RIGHT){
            props.connectionObj.endSocketId = null;
            props.connectionObj.endSocketEl = null;
        }
        else{
            props.connectionObj.startSocketId = null;
            props.connectionObj.startSocketEl = null;
        }

        registerConnectEvents();
        grabbedHandle.value = HANDLE.NONE;
        window.removeEventListener('mousemove', mouseDrag);
    }
}

function updateMousePos(event: MouseEvent): void {
    const clientMousePos = new Vector(event.clientX, event.clientY);
    const navPos = props.clientToNavSpace(clientMousePos);

    navMousePos.value.copy(navPos);
}

function centerFromBounds(bounds: {top: number, bottom: number, left: number, right: number}): Core.Vector {
    const ul = new Vector(bounds.left, bounds.top);
    const br = new Vector(bounds.right, bounds.bottom);
    const midPoint = ul.add(br).divideScalar(2);
    
    return midPoint;
}

function navToSVGSpace(point: Core.Vector): Core.Vector {
    return point.clone().subtract(cssOrigin.value);
}

defineExpose({relink});
</script>

<template>
    <div ref="rootRef" class="connection">
        <svg :width="width" :height="height" ref="svg">
            <filter id="blur" x="-20%" y="-20%" width="150%" height="150%">
                <feGaussianBlur in="SourceGraphic" stdDeviation="1.5" />
            </filter>

            <!--blurred line-->
            <path
                v-if="mouseOver && isFullConnection"
                :d="path"
                stroke="gray"
                stroke-width="2"
                fill="none"
                filter="url(#blur)"/>

            <!--main line-->
            <path
                :d="path"
                stroke="gray"
                stroke-width="2"
                fill="none"
                :style="mouseOver && isFullConnection ? 'stroke: #444444' : ''"/>

            <!--invisible line that's thicker to use for hover detection-->
            <path
                v-if="isFullConnection"
                class="line"
                :d="path"
                stroke="none"
                stroke-width="12"
                fill="none"
                @mouseenter="mouseOver = !isDraggingAnotherConnection"
                @mouseleave="mouseOver = false"
                @mousedown="mouseDown"/>
        </svg>
    </div>
</template>

<style scoped>
.connection{
    position: absolute;
    left: 0;
    top: 0;
}

.line{
    pointer-events: visibleStroke;
}
</style>