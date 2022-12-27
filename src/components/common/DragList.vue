<script lang="ts">
export interface iChangeEventProps {
    itemIdx: number,
    newIdx: number,
}
</script>

<script setup lang="ts">
import { ref, computed, defineProps, nextTick, onMounted, onBeforeUnmount } from 'vue';
import Core from '@/core';

const DRAG_DIST = 20;

const { Vector } = Core;

const props = defineProps<{
    items: any[],
    keylist: string[] | null,
}>();

const emit = defineEmits(['order-changed']);

const rootEl = ref<HTMLDivElement>();
const elHeight = ref(0);
const hoverIdx = ref<number | null>(null);
const isDragging = ref(false);
const hasMoved = ref(false);
const overY = ref(0);
const downEl = ref<HTMLDivElement | null>(null);
const dragEl = ref<HTMLDivElement | null>(null);
const dragIdx = ref<number | null>(null);
let mouseDownPos: Core.Vector | null;
let mousePos = new Vector(-5, -5);
let dragOffset = new Vector(0, 0);

const assembled = computed(()=>{
    nextTick(()=>{
        const root = rootEl.value!;
        const children = [...root.childNodes!].filter((node: any) => node.name == 'instancedElement');
        const listEl = children[0] as HTMLElement;
        elHeight.value = listEl ? listEl.clientHeight : 0;
    });

    return props.items.map((item, idx) => {return {item, index: idx}});
});
const isSamePos = computed(()=>hoverIdx.value! == dragIdx.value! || hoverIdx.value == dragIdx.value! - 1 || hoverIdx == null);
const keys = computed(()=>props.keylist ?? props.items.map(i => i.id));

onMounted(()=>{
    document.addEventListener('mousemove', mouseMove);
    document.addEventListener('mouseup', mouseUp);
});

onBeforeUnmount(()=>{
    document.removeEventListener('mousemove', mouseMove);
    document.removeEventListener('mouseup', mouseMove);
});

function mouseDown(event: MouseEvent): void {
    const topLevelEl = getItemParent(event.target as HTMLDivElement);
    const elBounds = topLevelEl.getBoundingClientRect();

    event.preventDefault();
    mouseDownPos = new Vector(event.clientX, event.clientY);
    downEl.value = topLevelEl;
    dragOffset.copy(mouseDownPos).subtract(new Vector(elBounds.left, elBounds.top));
}

function mouseMove(event: MouseEvent): void {
    const listBounds = rootEl.value!.getBoundingClientRect();
    const {clientX, clientY} = event;

    //update mouse position
    mousePos.x = clientX;
    mousePos.y = clientY;

    //detect if mouse has left the bounds of the list
    if (
        mousePos.x > listBounds.right ||
        mousePos.x < listBounds.left ||
        mousePos.y > listBounds.bottom ||
        mousePos.y < listBounds.top
    ){
        const overTop = -Math.max(listBounds.top - mousePos.y, 0);
        const underBottom = Math.max(mousePos.y - listBounds.bottom, 0);

        overY.value = overTop + underBottom;
        hoverIdx.value = null;
    }
    else{
        overY.value = 0;
    }

    //check which separator item is being dragged over
    if (isDragging.value){
        handleScroll();
        updateDragIdx();
    }

    //check if mouse has started dragging
    if (mouseDownPos){
        const distance = mouseDownPos.distanceTo(mousePos);
        
        if (distance > DRAG_DIST && !isDragging.value){
            dragStart();
        }
    }

    //if mouse is already dragging update dragEl position
    if (dragEl.value){
        const newPos = mousePos.clone().subtract(dragOffset);
        dragEl.value.style.left = newPos.x + 'px';
        dragEl.value.style.top = newPos.y + 'px';
    }
}

function mouseUp(): void {
    mouseDownPos = null;
    hasMoved.value = false;

    if (isDragging.value){
        dragEnd();
    }
}

function dragStart(): void {
    isDragging.value = true;
    dragEl.value = cloneEl(downEl.value!);
    dragIdx.value = parseInt(dragEl.value!.getAttribute('idx')!);
    hoverIdx.value = dragIdx.value;

    dragEl.value!.style.position = 'absolute';
    dragEl.value!.style.top = '0px';
    dragEl.value!.style.left = '0px';
    dragEl.value!.style.zIndex = '2000';
    document.body.append(dragEl.value);
}

function dragEnd(): void {
    const newIdx = dragIdx.value! < hoverIdx.value! ? hoverIdx.value! : hoverIdx.value! + 1;

    if (hoverIdx.value != null && !isSamePos.value){
        emit('order-changed', {
            itemIdx: dragIdx.value,
            newIdx
        });
    }

    hoverIdx.value = null;
    downEl.value = null;
    dragIdx.value = null;
    isDragging.value = false;
    dragEl.value!.parentNode!.removeChild(dragEl.value!);
}

function handleScroll(): void {
    if (overY.value != 0 && isDragging.value){
        const scrollAmt = overY.value * devicePixelRatio * 0.1;
        rootEl.value!.parentElement!.scrollBy(0, scrollAmt);
        requestAnimationFrame(handleScroll);
    }
}

function updateDragIdx(): void {
    const separators = getSeparatorChildren(rootEl.value!);
    
    for (let i = 0; i < separators.length; i++){
        const bounds = separators[i].getBoundingClientRect();
        const {x, y} = mousePos;

        if (
            x > bounds.left &&
            x < bounds.right &&
            y > bounds.top &&
            y < bounds.bottom
        ){
            hoverIdx.value = parseInt(separators[i].getAttribute('idx')!);
            hasMoved.value ||= hoverIdx.value != dragIdx.value;
        }
    }
}

function getItemParent(item: HTMLDivElement): HTMLDivElement {
    if (item.getAttribute('name') == 'instancedItem'){
        return item;
    }
    else{
        return getItemParent(item.parentNode as HTMLDivElement);
    }
}

function getSeparatorChildren(el: HTMLDivElement): HTMLDivElement[] {
    const separators = [];

    for (let i = 0; i < el.childNodes.length; i++){
        const child = el.childNodes[i] as HTMLDivElement;

        if (child.className == 'hover-boundary'){
            separators.push(child);
        }
        else{
            separators.push(...getSeparatorChildren(child));
        }
    }

    return separators;
}

function getCanvasChildren(el: HTMLDivElement): HTMLCanvasElement[] {
    const canvases = [];

    for (let i = 0; i < el.childNodes.length; i++){
        const child = el.childNodes[i] as HTMLDivElement;

        if (child.tagName == 'CANVAS'){
            canvases.push(child);
        }

        canvases.push(...getCanvasChildren(child));
    }

    return canvases as HTMLCanvasElement[];
}

function cloneEl(el: HTMLDivElement): HTMLDivElement {
    const clone = el.cloneNode(true) as HTMLDivElement;
    const originalCanvases = getCanvasChildren(el);
    const cloneCanvases = getCanvasChildren(clone);

    clone.style.width = el.clientWidth + 'px';
    clone.style.height = el.clientHeight + 'px';

    for (let i = 0; i < originalCanvases.length; i++){
        const ctx = cloneCanvases[i].getContext('2d')!;
        ctx.drawImage(originalCanvases[i], 0, 0);
    }

    return clone;
}
</script>

<template>
    <div ref="rootEl">
        <div
            class="drag-line"
            :class="hasMoved ? 'drag-line-animation':''"
            :style="`
                ${dragIdx == -1 ? 'display: none;':''}
                height: ${hoverIdx == -1 ? elHeight : 0}px;
            `">
            <div :idx="-1" :style="`height: ${elHeight}px`" class="hover-boundary"></div>
        </div>
        <div
            v-for="(item, idx) in assembled"
            name="instancedItem"
            :ref="keys[idx]"
            :key="keys[idx]"
            :idx="idx"
            @mousedown="mouseDown">
            <div
                :style="`
                    transition: height 0.1s;
                    ${dragIdx == idx ? 'opacity: 0; height:' + elHeight +'px;':''}
                    ${dragIdx == idx && hasMoved ? 'height: 0px;':''}
                `">
                <slot name="item" v-bind="item"></slot>
            </div>
            <div
                class="drag-line"
                :class="hasMoved ? 'drag-line-animation':''"
                :style="`
                    ${dragIdx == idx ? 'display: none;':''}
                    height: ${hoverIdx == idx ? elHeight : 0}px;
                `">
                <div :idx="idx" :style="`height: ${elHeight}px`" class="hover-boundary"></div>
            </div>
        </div>
    </div>
</template>

<style scoped>
.drag-line{
    display: block;
    position: relative;
    width: 100%;
    pointer-events: none;
}

.drag-line-animation{
    transition: height 0.1s;
}

.hover-boundary{
    position: absolute;
    width: 100%;
    transform: translateY(-50%);
    pointer-events: none;
}
</style>