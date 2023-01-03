<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';

const props = defineProps<{
    src: string,
}>();

const rgxPattern = /(^<\?xml)|(^<svg)/;
const isRaw = computed(()=>rgxPattern.test(props.src));
const rawSVG = computed(()=>{
    const svgOpenIdx = props.src.search(/<svg/);
    return props.src.substring(svgOpenIdx, props.src.length);
});
const innerHTML = computed(()=>{
    if (isRaw.value){
        return rawSVG.value;
    }
    else{
        return `<img src="${props.src}" draggable="false" />`;
    }
});
</script>

<template>
    <div class="Svg" v-html="innerHTML"></div>
</template>

<style scoped>
.Svg{
    display: flex;
    flex-direction: row;
    justify-content: center;
    align-items: center;
}

.Svg > *{
    margin: auto;
}
</style>