<script setup lang="ts">
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
        <img name="decorator" class="img" :src="src" draggable="false" v-tooltip="text"/>
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