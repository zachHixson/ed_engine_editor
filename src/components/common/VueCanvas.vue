<script setup lang="ts">
import { ref, onMounted } from 'vue';
import Core from '@/core';

const props = defineProps<{
    imageData?: ImageData;
    onMounted?: (el: HTMLCanvasElement)=>void;
}>();

const canvas = ref<HTMLCanvasElement>();

onMounted(()=>{
    if (!canvas.value) return;

    const { width, height } = canvas.value;

    canvas.value.width *= devicePixelRatio;
    canvas.value.height *= devicePixelRatio;
    canvas.value.style.width = width + 'px';
    canvas.value.style.height = height + 'px';

    props.onMounted && props.onMounted(canvas.value);

    if (props.imageData){
        applyImageData(canvas.value, props.imageData);
    }
});

function applyImageData(canvas: HTMLCanvasElement, imgData: ImageData){
    const canvasBuffer = Core.Draw.createCanvas(imgData.width, imgData.height);
    const ctx = canvas.getContext('2d')!;
    const bufferCtx = canvasBuffer.getContext('2d')!;
    const scaleFac = canvas.width / imgData.width;

    if (scaleFac > 1){
        ctx.imageSmoothingEnabled = false;
        bufferCtx.imageSmoothingEnabled = false;
    }

    bufferCtx.putImageData(imgData, 0, 0);

    ctx.scale(scaleFac, scaleFac);
    ctx.drawImage(canvasBuffer, 0, 0);
    ctx.resetTransform();
}
</script>

<template>
    <canvas ref="canvas"></canvas>
</template>

<style scoped>

</style>