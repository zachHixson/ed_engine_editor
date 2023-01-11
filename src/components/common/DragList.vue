<script lang="ts">
export interface iChangeEventProps {
    itemIdx: number,
    newIdx: number,
}
</script>

<script setup lang="ts">
import { ref, shallowRef, computed, nextTick, onMounted, onBeforeUnmount } from 'vue';
import Core from '@/core';

const DRAG_DIST = 20;

const { Vector } = Core;

const emit = defineEmits(['order-changed']);

const rootEl = shallowRef<HTMLDivElement>();
const dragLineRef = shallowRef<HTMLDivElement>();
const observer = new MutationObserver(onContentsChange);
const mousePos = new Vector(-5, -5);
const dragOffset = new Vector(0, 0);
const mouseDownPos = new Vector(0, 0);
let downEl: HTMLDivElement | null;
let dragEl: HTMLDivElement | null;
let elHeight: number = 0;
let hoverIdx: number | null;
let hoverEl: HTMLDivElement | null;
let originalDisplay: string;
let overY: number = 0;
let dragIdx: number | null;
let isDragging = false;
let hasMoved = false;

onMounted(()=>{
    onContentsChange();
});

onBeforeUnmount(()=>{
    document.removeEventListener('mousemove', mouseMove);
    document.removeEventListener('mouseup', mouseMove);
});

function enableObserver(): void {
    const observerConfig = {childList: true};
    observer.observe(rootEl.value!, observerConfig);
}

function onContentsChange(): void {
    const root = rootEl.value!;
    const dragLine = dragLineRef.value!;
    const children = [...root.children];
    let idx = 0;

    observer.disconnect();

    //add new draglines as necessary
    children.forEach((node) => {
        const el = node as HTMLDivElement;
        const isDragLine = el.getAttribute('name') == 'dragLine';
        const isDraggableEl = el.tagName == 'DIV' && el.style.display != 'none' && !isDragLine;
        const isNew = el.getAttribute('instanced-item') == null;
        const nextIsDragline = el.nextElementSibling?.getAttribute('name') == 'dragLine';

        if (isDraggableEl){
            if (isNew){
                el.setAttribute('instanced-item', '1');
                el.addEventListener('mousedown', mouseDown as EventListener);
                el.addEventListener('mouseover', debugHover as EventListener);
            }

            if (!nextIsDragline){
                const newDragLine = dragLine.cloneNode(true) as HTMLDivElement;

                el.after(newDragLine);
                newDragLine.addEventListener('mouseover', debugHover);
            }
        }
        else if (nextIsDragline){
            //if dragLines are doubled up (such as after an asset has been removed) remove it.
            el.nextElementSibling.remove();
        }
    });

    //re-index list
    for (let i = 0; i < root.children.length; i++){
        const curChild = root.children[i] as HTMLDivElement;
        const isDraggable = curChild.getAttribute('name') != 'dragLine';

        curChild.setAttribute('idx', idx.toString());
        if (isDraggable) idx++;
    }

    enableObserver();
}

function activateHoverBoundaries(): void {
    const root = rootEl.value!;
    const boundaries = root.querySelectorAll<HTMLDivElement>('.hover-boundary');

    boundaries.forEach(boundary => {
        boundary.style.height= elHeight + 'px';
    });
}

function deactivateHoverBoundaries(): void {
    const root = rootEl.value!;
    const boundaries = root.querySelectorAll<HTMLDivElement>('.hover-boundary');

    boundaries.forEach(boundary => {
        boundary.style.height= '0px';
        boundary.parentElement!.style.height = '1px';
        boundary.parentElement?.classList.remove('drag-line-animation');
    });
}

function mouseDown(event: MouseEvent): void {
    const topLevelEl = getItemParent(event.target as HTMLDivElement);
    const elBounds = topLevelEl.getBoundingClientRect();

    event.preventDefault();
    document.addEventListener('mousemove', mouseMove);
    document.addEventListener('mouseup', mouseUp);
    mouseDownPos.set(event.clientX, event.clientY);
    downEl = topLevelEl;
    dragOffset.copy(mouseDownPos).subtract(new Vector(elBounds.left, elBounds.top));
    elHeight = elBounds.bottom - elBounds.top;
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

        overY = overTop + underBottom;
        console.log("OOB")
        hoverIdx = null;
    }
    else{
        overY = 0;
    }

    //check which separator item is being dragged over
    if (isDragging){
        handleScroll();
        updateDragIdx();
    }

    //check if mouse has started dragging
    if (mouseDownPos){
        const distance = mouseDownPos.distanceTo(mousePos);
        
        if (distance > DRAG_DIST && !isDragging){
            dragStart();
        }
    }

    //if mouse is already dragging update dragEl position
    if (dragEl){
        const newPos = mousePos.clone().subtract(dragOffset);
        dragEl.style.left = newPos.x + 'px';
        dragEl.style.top = newPos.y + 'px';
    }
}

function mouseUp(): void {
    hasMoved = false;

    document.removeEventListener('mousemove', mouseMove);
    document.removeEventListener('mouseup', mouseMove);

    if (isDragging){
        dragEnd();
    }
}

function dragStart(): void {
    isDragging = true;
    dragEl = cloneEl(downEl!);
    dragIdx = parseInt(dragEl!.getAttribute('idx')!);
    hoverIdx = dragIdx;

    console.warn(dragIdx);

    dragEl.style.position = 'absolute';
    dragEl.style.top = '0px';
    dragEl.style.left = '0px';
    dragEl.style.zIndex = '2000';
    document.body.append(dragEl);

    originalDisplay = downEl!.style.display;
    downEl!.style.display = 'none';

    onContentsChange();

    if (downEl!.previousElementSibling){
        const prevDragLine = downEl!.previousElementSibling as HTMLDivElement;
        hoverEl = prevDragLine.children[0] as HTMLDivElement;
        prevDragLine.style.height = (elHeight) + 'px';
    }
    
    activateHoverBoundaries();
}

function dragEnd(): void {
    const newIdx = hoverIdx! > dragIdx! ? hoverIdx! - 1 : hoverIdx;

    console.warn(newIdx);

    if (hoverIdx != null){
        emit('order-changed', {
            itemIdx: dragIdx,
            newIdx
        });
        console.log(dragIdx, newIdx);
    }

    deactivateHoverBoundaries();

    downEl!.style.display = originalDisplay;

    hoverIdx = null;
    hoverEl = null;
    downEl = null;
    dragIdx = null;
    isDragging = false;
    dragEl!.parentNode!.removeChild(dragEl!);

    onContentsChange();
}

function handleScroll(): void {
    if (overY != 0 && isDragging){
        const scrollAmt = overY * devicePixelRatio * 0.1;
        rootEl.value!.parentElement!.scrollBy(0, scrollAmt);
        requestAnimationFrame(handleScroll);
    }
}

function updateDragIdx(): void {
    const separators = rootEl.value!.querySelectorAll('.hover-boundary');
    
    for (let i = 0; i < separators.length; i++){
        const hoverBoundary = separators[i] as HTMLDivElement;
        const bounds = hoverBoundary.getBoundingClientRect();
        const {x, y} = mousePos;

        if (
            x > bounds.left &&
            x < bounds.right &&
            y > bounds.top &&
            y < bounds.bottom
        ){
            const boundaryParent = hoverBoundary.parentElement as HTMLDivElement;
            hoverIdx = parseInt(boundaryParent.getAttribute('idx')!);
            hoverBoundary.style.height = (2 * elHeight) + 'px';
            setHoverEl(boundaryParent);
            hasMoved ||= hoverIdx != dragIdx;
            console.log(hoverIdx);
        }
        else{
            hoverBoundary.style.height = elHeight + 'px';
        }
    }
}

function setHoverEl(el: HTMLDivElement): void {
    if (hoverEl) {
        hoverEl.style.height = '1px';
        hoverEl.classList.add('drag-line-animation');
    }

    hoverEl = el;
    hoverEl.classList.add('drag-line-animation');
    hoverEl.style.height = elHeight + 'px';
}

function getItemParent(item: HTMLDivElement): HTMLDivElement {
    const isInstanceItem = item.getAttribute('instanced-item') == '1';
    return isInstanceItem ? item : getItemParent(item.parentNode as HTMLDivElement);
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

function debugHover(e: MouseEvent){
    //@ts-ignore
    console.log(e.target.getAttribute('idx'));
}
</script>

<template>
    <div ref="rootEl">
        <div ref="dragLineRef" name="dragLine" class="drag-line">
            <div name="hoverBoundary" class="hover-boundary"></div>
        </div>
        <slot ref="slotEl"></slot>
    </div>
</template>

<style scoped>
.drag-line{
    display: block;
    position: relative;
    width: 100%;
    pointer-events: none;
    height: 1px;
    background: black;
}

.drag-line-animation{
    transition: height 0.1s;
}

.hover-boundary{
    position: absolute;
    width: 100%;
    top: 50%;
    transform: translateY(-50%);
    pointer-events: none;
    border: 1px solid red;
}
</style>