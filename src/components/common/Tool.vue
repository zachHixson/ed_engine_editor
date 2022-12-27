<script setup lang="ts">
import { ref, defineProps, computed } from 'vue';

const props = defineProps<{
    icon: string,
    tool: any,
    name: string,
    curSelection?: any,
    toggled?: boolean,
}>();

const emit = defineEmits(['tool-clicked']);

const iconLoaded = ref(true);

const isSelected = computed(()=>(props.curSelection == props.tool) || (props.toggled));

function click(event: MouseEvent): void {
    emit('tool-clicked', props.tool);
}
</script>

<template>
    <div class="tool" :class="{toolSelected : isSelected}" @click="click" v-tooltip="name">
        <img v-show="iconLoaded" class="icon" ref="iconImg" :src="props.icon" @error="iconLoaded = false"/>
        <div v-show="!iconLoaded" class="altText" ref="altText">
            {{name}}
        </div>
    </div>
</template>

<style scoped>
.tool{
    display: flex;
    justify-content: center;
    align-items: center;
    width: 30pt;
    height: 30pt;
    background: var(--button-norm);
    margin: 5px;
    border-radius: 8pt;
    border: 2px solid var(--border);
}

.tool:hover:not(.toolSelected){
    background: var(--button-hover);
}

.tool:active{
    background: var(--button-down);
    filter: brightness(0.8);
}

.tool > *{
    pointer-events: none;
}

.toolSelected {
    background: var(--button-down);
}

.icon {
    width: 30px;
    height: 30px;
    fill: var(--button-icon);
    stroke: var(--button-icon);
}
</style>