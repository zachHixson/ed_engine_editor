<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import Core from '@/core';

const props = defineProps<{
    widget: any,
    widgetData: any,
    setWidgetData: (data: any, commit?: boolean)=>void,
}>();

const wheelRef = ref<HTMLDivElement>();

const rad = computed(()=>{
    if (!props.widgetData) return 0;

    const x = props.widgetData[0];
    const y = -props.widgetData[1];
    return Math.atan2(y, x);
});

let startPos: number[] | null = null;
let mouseBtnDown = false;

onMounted(()=>{
    if (props.widgetData){
        props.setWidgetData(props.widgetData, false);
        return;
    }

    if (props.widget.options.starDir){
        props.setWidgetData(props.widget.options.starDir, false);
        return;
    }

    props.setWidgetData([1, 0], false);
});

function mouseDown(event: MouseEvent){
    event.preventDefault();
    event.stopPropagation();
    startPos = [...props.widgetData];
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
    event.stopPropagation();
    startPos = [...props.widgetData];
    props.widgetData[0] = x;
    props.widgetData[1] = y;
    commit();
}

function setArbitrary(event: MouseEvent){
    const { left: wheelLeft, top: wheelTop, right: wheelRight} = wheelRef.value!.getBoundingClientRect();
    const pos = new Core.Vector(
            event.clientX - wheelLeft,
            event.clientY - wheelTop
        )
        .subtractScalar((wheelRight - wheelLeft) / 2)
        .normalize();

    props.widgetData[0] = pos.x;
    props.widgetData[1] = -pos.y;

    event.stopPropagation();
}

function commit(){
    if (startPos && startPos[0] == props.widgetData[0] && startPos![1] == props.widgetData[1]) return;

    const newData = [...props.widgetData];
    props.widgetData[0] = startPos![0];
    props.widgetData[1] = startPos![1];
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