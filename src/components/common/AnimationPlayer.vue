<script setup lang="ts">
import { ref, computed, watch, nextTick, onMounted } from 'vue';
import Core from '@/core';
import type { Event_Bus } from './Event_Listener';

const props = defineProps<{
    sprite: Core.Sprite,
    fps: number,
    startFrame: number,
    loop: boolean,
    parentEventBus: Event_Bus
}>();

const curFrameIdx = ref(0);
const canvasRef = ref<HTMLCanvasElement>();
const checkerBGBuff = Core.Draw.createHDPICanvas(500, 500);
const pixelBuff = Core.Draw.createCanvas(Core.Sprite.DIMENSIONS, Core.Sprite.DIMENSIONS);
const animationLoop = ref(-1);
const dimensions = 150;

const isPlaying = computed(()=>animationLoop.value >= 0);
const sprite = computed(()=>props.sprite);
const startFrame = computed(()=>props.startFrame);

watch(sprite, ()=>newSpriteSelection());
watch(startFrame, (newVal)=>{
    curFrameIdx.value = newVal;
    drawFrame();
});

onMounted(()=>{
    const canvas = canvasRef.value!;

    Core.Draw.resizeCanvas(checkerBGBuff, canvas.width, canvas.height);
    Core.Draw.drawCheckerBG(checkerBGBuff, 4, "#B5B5B5", '#CCCCCC');

    props.parentEventBus.addEventListener('frame-deleted', onFrameDelete);
    props.parentEventBus.addEventListener('fps-changed', fpsChanged);
    props.parentEventBus.addEventListener('frame-data-changed', frameDataChanged);
    newSpriteSelection();
});

function drawFrame(): void {
    const canvas = canvasRef.value!;
    const ctx = canvas.getContext('2d')!;

    Core.Draw.resizeHDPICanvas(canvas, dimensions, dimensions);
    
    ctx.drawImage(checkerBGBuff, 0, 0, canvas.width, canvas.height);

    if (props.sprite && props.sprite.frames[curFrameIdx.value] != null){
        const scaleFac = canvas.width / Core.Sprite.DIMENSIONS;

        props.sprite.drawToCanvas(curFrameIdx.value, pixelBuff);

        ctx.imageSmoothingEnabled = false;

        ctx.scale(scaleFac, scaleFac);
        ctx.drawImage(pixelBuff, 0, 0, pixelBuff.width, pixelBuff.height);
        ctx.resetTransform();
    }
}

function advanceFrame(): void {
    const nextFrame = (curFrameIdx.value + 1);

    if (props.loop){
        curFrameIdx.value = nextFrame % props.sprite.frames.length;
    }
    else{
        curFrameIdx.value = Math.min(nextFrame, props.sprite.frames.length - 1);
    }
}

function playAnimation(): void {
    if (props.sprite && animationLoop.value < 0 && props.fps > 0){
        let intervalTime = 1000/props.fps;

        animationLoop.value = setInterval(()=>{
            advanceFrame();
            drawFrame();
        }, intervalTime);
    }
    else{
        pauseAnimation();
    }
}

function pauseAnimation(): void {
    clearInterval(animationLoop.value);
    animationLoop.value = -1;
}

function stopAnimation(): void {
    pauseAnimation();
    curFrameIdx.value = props.startFrame;
    drawFrame();
}

function frameDataChanged(): void {
    drawFrame();
}

function fpsChanged(): void {
    if (animationLoop.value >= 0){
        pauseAnimation();
        playAnimation();
    }
}

function newSpriteSelection(): void {
    if (props.sprite){
        pixelBuff.width = Core.Sprite.DIMENSIONS;
        pixelBuff.height = Core.Sprite.DIMENSIONS;
    }

    curFrameIdx.value = props.startFrame;

    nextTick(()=>{
        drawFrame();
    });
}

function onFrameDelete(): void {
    curFrameIdx.value = Math.min(curFrameIdx.value, props.sprite.frames.length - 1);
    drawFrame();
}
</script>

<template>
    <div class="animationPlayer">
        <canvas ref="canvasRef" width="150" height="150">
            //Error loading HTML5 canvas
        </canvas>
        <div class="buttons">
            <button @click="playAnimation()">
                <img class="btnImg" src="@/assets/play.svg" v-show="!isPlaying"/>
                <img class="btnImg" src="@/assets/pause.svg" v-show="isPlaying"/>
            </button>
            <button @click="stopAnimation()">
                <img class="btnImg" src="@/assets/box_filled.svg"/>
            </button>
        </div>
    </div>
</template>

<style scoped>
.animationPlayer{
    display: flex;
    flex-direction: column;
    border: 2px solid var(--border);
    border-radius: var(--corner-radius);
    overflow: hidden;
}

.buttons{
    display: flex;
    flex-direction: row;
    justify-content: center;
    background: var(--button-dark-norm);
}

.buttons > button{
    display: flex;
    align-items: center;
    background: none;
    border: none;
    border-radius: 3px;
    padding: 3px;
    margin: 2px;
}

.buttons > button:hover{
    background: var(--button-dark-hover);
}

.buttons > button:active{
    background: var(--button-dark-down);
}

.btnImg{
    width: 20px;
    height: 20px;
    fill: var(--text-dark);
    stroke: var(--text-dark);
}
</style>