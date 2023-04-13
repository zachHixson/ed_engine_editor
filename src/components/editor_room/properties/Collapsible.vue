<script setup lang="ts">
import Svg from '@/components/common/Svg.vue';

import { ref } from 'vue';

import arrowIcon from '@/assets/arrow_01.svg';

const props = defineProps<{
    headingText: string;
}>();

const open = ref(false);
const contentsEl = ref<HTMLDivElement>();

function openPanel(): void {
    let maxHeight = 0;
    let padding = 0;

    open.value = !open.value;

    if (open.value){
        maxHeight = contentsEl.value!.scrollHeight;
        padding = 10;
    }

    contentsEl.value!.style.maxHeight = maxHeight + 'px';
    contentsEl.value!.style.paddingBottom = padding + 'px';
}
</script>

<template>
    <div
        class="collapsible"
        :class="open ? 'collapsible-show':''"
        @click="openPanel">
            <Svg :src="arrowIcon" class="arrow" :style="open ? 'rotate: 180deg':''"></Svg>
            {{headingText}}
    </div>
    <div ref="contentsEl" class="collapsible-content">
        <slot></slot>
    </div>
</template>

<style scoped>
.collapsible{
    display: flex;
    flex-direction: row;
    align-items: center;
    padding-top: 10px;
    border-top: 1px solid #88888888;
    user-select: none;
}

.arrow{
    rotate: 90deg;
    width: 20px;
    margin-right: 10px;
}

.collapsible-content{
    overflow: hidden;
    max-height: 0px;
    border-bottom: 1px solid #88888888;
    transition: max-height 0.3s;
}
</style>