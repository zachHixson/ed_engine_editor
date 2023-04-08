<script setup lang="ts">
import { ref, onMounted } from 'vue';

const props = defineProps<{
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
});
</script>

<template>
    <canvas ref="canvas"></canvas>
</template>

<style scoped>

</style>