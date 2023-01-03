<script setup lang="ts">
import Svg from '@/components/common/Svg.vue';

import { ref } from 'vue';

const props = defineProps<{
    src: string,
    tooltipText?: string,
}>();

const text = ref(props.tooltipText ?? '');

function setTooltipText(txt: string): void {
    text.value = txt;
}

defineExpose({setTooltipText});
</script>

<template>
    <div class="decorator">
        <Svg name="decorator" class="img" :src="src" v-tooltip="text"></Svg>
    </div>
</template>

<style scoped>
.decorator{
    display: flex;
    flex-direction: row;
    justify-content: center;
    height: auto;
}
</style>