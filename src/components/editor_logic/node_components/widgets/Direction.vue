<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import type { WidgetDirection } from '@engine/core/nodes/Widget';
import Core from '@/core';

const props = defineProps<{
    widget: unknown,
    widgetData: unknown,
    setWidgetData: (data: WidgetDirection['widget']['data'], commit?: boolean)=>void,
}>();

const wheelRef = ref<HTMLDivElement>();

const rad = computed(()=>{
    const widgetData = props.widgetData as WidgetDirection['widget']['data'];

    if (!widgetData) return 0;

    const x = widgetData[0];
    const y = -widgetData[1];
    return Math.atan2(y, x);
});

let startPos: number[] | null = null;
let mouseBtnDown = false;

onMounted(()=>{
    const widget = props.widget as WidgetDirection['widget'];
    const widgetData = props.widgetData as WidgetDirection['widget']['data'];

    if (widgetData){
        props.setWidgetData(widgetData, false);
        return;
    }

    if (widget.options.startDir){
        props.setWidgetData(widget.options.startDir, false);
        return;
    }

    props.setWidgetData([1, 0], false);
});

function mouseDown(event: MouseEvent){
    const widgetData = props.widgetData as WidgetDirection['widget']['data'];

    event.preventDefault();
    event.stopPropagation();
    startPos = [...widgetData];
    mouseBtnDown = true;
}

function mouseMove(event: MouseEvent){
    event.preventDefault();
    event.stopPropagation();

    if (mouseBtnDown){
        setArbitrary(event);
    }
}

function mouseUp(event: MouseEvent){
    event.preventDefault();
    event.stopPropagation();
    if (!mouseBtnDown) return;
    commit();
    startPos = null;
    mouseBtnDown = false;
}

function setCardinal(event: MouseEvent, x: number, y: number){
    const widgetData = props.widgetData as WidgetDirection['widget']['data'];

    event.stopPropagation();
    startPos = [...widgetData];
    widgetData[0] = x;
    widgetData[1] = y;
    commit();
}

function setArbitrary(event: MouseEvent){
    const { left: wheelLeft, top: wheelTop, right: wheelRight} = wheelRef.value!.getBoundingClientRect();
    const pos = new Core.Vec2(
            event.clientX - wheelLeft,
            event.clientY - wheelTop
        )
        .subtractScalar((wheelRight - wheelLeft) / 2)
        .normalize();
    const widgetData = props.widgetData as WidgetDirection['widget']['data'];

    widgetData[0] = pos.x;
    widgetData[1] = -pos.y;

    event.stopPropagation();
}

function commit(){
    const widgetData = props.widgetData as WidgetDirection['widget']['data'];

    if (startPos && startPos[0] == widgetData[0] && startPos![1] == widgetData[1]) return;

    const newData: [number, number] = [...widgetData];
    widgetData[0] = startPos![0];
    widgetData[1] = startPos![1];
    props.setWidgetData(newData, true);
}
</script>

<template>
    <div ref="wheelRef" class="wheel">
        <div
            class="circle"
            @mousedown="mouseDown"
            @mousemove="mouseMove"
            @mouseup="mouseUp"
            @mouseleave="mouseUp"></div>
        <div class="cardinal-dot" style="top: 50%;" @mousedown="setCardinal($event, -1, 0)"></div>
        <div class="cardinal-dot" style="left:50%;" @mousedown="setCardinal($event, 0, 1)"></div>
        <div class="cardinal-dot" style="top: 50%; left:100%;" @mousedown="setCardinal($event, 1, 0)"></div>
        <div class="cardinal-dot" style="top: 100%; left:50%;" @mousedown="setCardinal($event, 0, -1)"></div>
        <svg class="arrow" width="100" height="100" :style="`transform:rotate(${rad}rad)`">
            <g fill="#6988F0">
                <polygon points="50,45 80,45 80,40 100,50 80,60 80,55 50,55"></polygon>
                <circle cx="50" cy="50" r="5"></circle>
            </g>
        </svg>
    </div>
</template>

<style scoped>
.wheel{
    position: relative;
    width: 100px;
    height: 100px;
}

.circle{
    position: absolute;
    top: 0;
    left: 0;
    width: 100px;
    height: 100px;
    background: white;
    border-radius: 50%;
    border: 2px solid var(--border);
    z-index: 0;
    box-sizing: border-box;
}

.circle:hover{
    background: #c9e5ff;
}

.cardinal-dot{
    position: absolute;
    width: 15px;
    height: 15px;
    background: #EDEDED;
    border: 2px solid var(--border);
    transform: translate(-50%, -50%);
    border-radius: 50%;
    box-sizing: border-box;
}

.cardinal-dot:hover{
    background: #c9e5ff;
}

.arrow{
    position: relative;
    z-index: 10;
    pointer-events: none;
}
</style>
