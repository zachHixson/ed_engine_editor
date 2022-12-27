<script lang="ts">
export const TooltipEventBus = new Event_Bus();
</script>

<script setup lang="ts">
import { ref, nextTick, onMounted } from 'vue';
import { Event_Bus } from './Event_Listener';

const messageTextRef = ref<HTMLDivElement>();
const tooltipRef = ref<HTMLDivElement>();

const HOVER_TIME = 0.8;
const x = ref(0);
const y = ref(0);
const showTooltip = ref(false);
const hOffset = ref(0);
const invert = ref(false);
const text = ref('');
let timeout = -1;

onMounted(()=>{
    TooltipEventBus.addEventListener('activate-tooltip', activateTooltip);
    TooltipEventBus.addEventListener('hide-tooltip', hideTooltip);
});

function activateTooltip({el, text: txt}: {el: HTMLDivElement, text: string}): void {
    const timeLimit = HOVER_TIME * 1000;
    text.value = txt;

    if (!text.value.length){
        return;
    }

    timeout = setTimeout(()=>{
        const elBounds = el.getBoundingClientRect();

        x.value = (elBounds.left + elBounds.right) / 2;
        hOffset.value = 0;
        showTooltip.value = true;
        nextTick(()=>{
            recalculateOffsets(el);
        });
    }, timeLimit);
}

function hideTooltip(){
    clearTimeout(timeout);
    showTooltip.value = false;
}

function recalculateOffsets(el: HTMLDivElement){
    setClientYPos(el);
    hOffset.value = getTextOffset();
    invert.value = getInvertedState(el);
}

function setClientYPos(el: HTMLDivElement){
    const elBounds = el.getBoundingClientRect();
    y.value = getInvertedState(el) ? elBounds.bottom : elBounds.top;
}

function getTextOffset(){
    const textBounds = messageTextRef.value!.getBoundingClientRect();
    const windowBorder = document.documentElement.clientWidth;
    const rOverflow = Math.min(0, windowBorder - textBounds.right);
    const lOverflow = Math.max(0, -textBounds.left);

    return rOverflow + lOverflow;
};

function getInvertedState(el: HTMLDivElement){
    const elBounds = el.getBoundingClientRect();
    const textBounds = messageTextRef.value!.getBoundingClientRect();
    const textHeight = textBounds.bottom - textBounds.top;

    return textHeight > elBounds.top;
}
</script>

<template>
    <div
        v-show="showTooltip"
        ref="tooltipRef"
        class="tooltip"
        :style="`
            position: absolute;
            left: ${x}px;
            top: ${y}px;
        `">
        <div ref="positionWrapper"
            class="position-wrapper"
            :class="invert ? 'below':'above'">
            <svg v-if="invert" width="20" height="15" class="arrow arrow-top">
                <path d="M0 15 L10 0 L20 15"/>
            </svg>
            <div ref="messageTextRef" class="message-text" :style="`transform: translateX(${hOffset}px)`">
                <div v-if="invert" class="arrow-blocker">
                    <svg v-if="invert" width="20" height="15">
                        <path d="M0 15 L10 0 L20 15"/>
                    </svg>
                </div>
                <div v-html="text"></div>
            </div>
            <svg v-if="!invert" width="20" height="15" class="arrow arrow-bottom">
                <path d="M0 0 L10 15 L20 0"/>
            </svg>
        </div>
    </div>
</template>

<style scoped>
.tooltip{
    position: absolute;
    flex-direction: column;
    pointer-events: none;
    z-index: 1000;
}

.tooltip > *{
    --bg: #EEEEEE;
}

.position-wrapper{
    position: absolute;
    display: flex;
    flex-direction: column;
    align-items: center;
    width: 100%;
    height: min-content;
}

.above{
    transform: translateY(-100%);
}

.message-text{
    position: relative;
    height: max-content;
    width: max-content;
    max-width: 300px;
    padding: 10px;
    background: var(--bg);
    border: 2px solid var(--border);
    border-radius: 10px;
}

.arrow{
    position: relative;
    fill: var(--bg);
    stroke: var(--border);
    stroke-width: 2px;
}

.arrow-top{
    top: 2px;
}

.arrow-bottom{
    bottom: 2px;
}

.arrow-blocker{
    position: absolute;
    top: 0;
    left: 50%;
}

.arrow-blocker > *{
    transform: translate(-50%, -90%);
    top: -3px;
    fill: var(--bg);
}
</style>