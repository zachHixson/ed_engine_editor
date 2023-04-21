<script setup lang="ts">
import { ref, computed, onMounted, onBeforeUnmount } from 'vue';
import { useMainStore } from '@/stores/Main';
import Core, { Engine } from '@/core';
import { PLAY_STATE } from '@/stores/Main';

const mainStore = useMainStore();

const canvasWrapper = ref<HTMLElement>();
const canvas = ref<HTMLCanvasElement>();

let engine: Engine | null = null;
let resizeInterval: number;

const playState = computed<PLAY_STATE>({
    get(){
        return mainStore.getPlayState;
    },
    set(newState: PLAY_STATE){
        mainStore.setPlayState(newState);
    }
});

onMounted(()=>{
    start();
});

onBeforeUnmount(()=>{
    engine = null;
});

function start(): void {
    const restart = ()=>{
        clearInterval(resizeInterval);
        start();
    };

    resizeInterval = setInterval(()=>{
        const wrapper = canvasWrapper.value as HTMLElement;
        const minDim = Math.min(wrapper.clientWidth, wrapper.clientHeight);

        Core.Draw.resizeHDPICanvas(canvas.value!, minDim, minDim);
    }, 20);

    engine = new Engine(
        canvas.value!,
        mainStore.getSaveData(),
        {restart}
    );
    engine.start();
}

function close(): void {
    playState.value = PLAY_STATE.NOT_PLAYING;
    clearInterval(resizeInterval);
    engine!.stop();
}
</script>

<template>
    <div class="playWindow">
        <div class="headerBar">
            <div class="headerText">
                {{playState == PLAY_STATE.PLAYING ? $t('editor_main.run') : $t('editor_main.debug')}}
            </div>
            <button class="closeBtn" @click="close">
                X
            </button>
        </div>
        <div ref="canvasWrapper" class="canvasWrapper">
            <canvas ref="canvas" class="canvas">//Error loading canvas</canvas>
        </div>
    </div>
</template>

<style scoped>
.playWindow{
    display: flex;
    flex-direction: column;
    width: 100%;
    height: 100%;
    background: var(--tool-panel-bg);
}

.headerBar{
    position: relative;
    display: flex;
    flex-direction: row;
    justify-content: center;
    align-items: center;
    width: 100%;
    height: 50px;
    background: var(--heading);
    overflow: hidden;
    border: 2px solid var(--border);
    border-radius: 0 0 var(--corner-radius) var(--corner-radius);
    box-sizing: border-box;
}

.closeBtn{
    position: absolute;
    right: 3px;
    top: 3px;
    width: 40px;
    height: 40px;
    background: var(--button-norm);
    border: 2px solid var(--border);
    border-radius: var(--corner-radius);
}

.closeBtn:hover{
    background: var(--button-hover);
}

.closeBtn:active{
    background: var(--button-down);
}

.canvasWrapper{
    position: relative;
    display: flex;
    justify-content: center;
    flex-grow: 1;
}

.canvas{
    position: absolute;
}
</style>