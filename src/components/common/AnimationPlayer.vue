<script setup lang="ts">
import Svg from '@/components/common/Svg.vue';

import { ref, computed, watch, nextTick, onMounted, onBeforeUnmount } from 'vue';
import Core from '@/core';
import playIcon from '@/assets/play.svg';
import pauseIcon from '@/assets/pause.svg';
import boxFilledIcon from '@/assets/box_filled.svg';

const props = defineProps<{
    sprite: Core.Sprite,
    fps: number,
    startFrame: number,
    loop: boolean,
    parentEventBus: {
        onFrameDeleted?: Core.Event_Emitter<()=>void>,
        onFPSChanged?: Core.Event_Emitter<()=>void>,
        onFrameDataChanged?: Core.Event_Emitter<()=>void>,
        onNewSpriteSelected?: Core.Event_Emitter<()=>void>,
    }
}>();

const curFrameIdx = ref(0);
const canvasRef = ref<HTMLCanvasElement>();
const checkerBGBuff = Core.Draw.createHDPICanvas(500, 500);
const pixelBuff = Core.Draw.createCanvas(Core.Sprite.DIMENSIONS, Core.Sprite.DIMENSIONS);
const animationLoop = ref(-1);
const dimensions = 150;

const isPlaying = computed(()=>animationLoop.value >= 0);

watch(()=>props.sprite, ()=>newSpriteSelection());
watch(()=>props.startFrame, (newVal)=>{
    curFrameIdx.value = newVal;
    drawFrame();
});

onMounted(()=>{
    const canvas = canvasRef.value!;

    Core.Draw.resizeCanvas(checkerBGBuff, canvas.width, canvas.height);
    Core.Draw.drawCheckerBG(checkerBGBuff, 4, "#B5B5B5", '#CCCCCC');

    props.parentEventBus.onFrameDeleted?.listen(onFrameDelete);
    props.parentEventBus.onFPSChanged?.listen(fpsChanged);
    props.parentEventBus.onFrameDataChanged?.listen(frameDataChanged);
    props.parentEventBus.onNewSpriteSelected?.listen(newSpriteSelection);
    newSpriteSelection();
});

onBeforeUnmount(()=>{
    props.parentEventBus.onFrameDeleted?.remove(onFrameDelete);
    props.parentEventBus.onFPSChanged?.remove(fpsChanged);
    props.parentEventBus.onFrameDataChanged?.remove(frameDataChanged);
    props.parentEventBus.onNewSpriteSelected?.remove(newSpriteSelection);
});

function drawFrame(): void {
    if (!canvasRef.value){
        return;
    }

    const canvas = canvasRef.value;
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
        const intervalTime = 1000/props.fps;

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
                <Svg class="btnImg" :src="playIcon" v-show="!isPlaying"></Svg>
                <Svg class="btnImg" :src="pauseIcon" v-show="isPlaying"></Svg>
            </button>
            <button @click="stopAnimation()">
                <Svg class="btnImg" :src="boxFilledIcon"></Svg>
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