<script lang="ts">
import type Shared from '@/Shared';

export interface iControl {
    id: typeof Shared.NAV_TOOL_TYPE,
    altText: string,
    icon: string,
    action: (...args: any)=>void;
}
</script>

<script setup lang="ts">
import { ref, defineProps, defineEmits } from 'vue';

const props = defineProps<{
    control: iControl,
    isSelected: boolean,
}>();

const emit = defineEmits(['click']);

const iconLoaded = ref<boolean>(true);

function onClick(): void {
    emit('click', props.control);
}
</script>

<template>
    <div
        class="viewportControl"
        ref="navControl"
        @click="onClick"
        :class="{controlSelected : isSelected}"
        v-tooltip="control.altText">
        <img v-show="iconLoaded" class="icon" ref="iconImg" :src="props.control.icon" @error="iconLoaded = false"/>
        <div v-show="!iconLoaded" class="altText" ref="altText">
            {{control.altText}}
        </div>
    </div>
</template>

<style scoped>
@import './viewportButtons.css';
</style>