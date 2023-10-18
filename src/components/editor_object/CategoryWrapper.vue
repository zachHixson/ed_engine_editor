<script setup lang="ts">
import Svg from '@/components/common/Svg.vue';

defineProps<{
    heading: string,
    iconPath: string,
}>();
</script>

<template>
    <div class="categoryWrapper">
        <div class="title">
            <Svg class="icon" :src="iconPath"></Svg>
            {{heading}}
        </div>
        <div class="contents"><slot></slot></div>
    </div>
</template>

<style>
.categoryWrapper{
    display: flex;
    flex-direction: column;
    justify-content: flex-end;
    align-items: flex-end;
    background: var(--tool-panel-bg);
    padding: 10px;
    box-sizing: border-box;
    border: 2px solid var(--border);
    border-radius: 10px;
    user-select: none;
    overflow: hidden;
}

.icon{
    width: 30px;
    height: 30px;
    fill: var(--text-dark);
    stroke: var(--text-dark);
}

.title{
    display: flex;
    align-items: center;
    width: 100%;
    color: var(--text-dark);
    font-weight: bold;
    font-size: 1.5em;
}

.title > *{
    margin-right: 10px;
}

.contents{
    display: flex;
    flex-direction: row;
    justify-content: flex-end;
    align-items: flex-start;
    gap: 10px;
    flex-grow: 1;
    overflow-y: auto;
}
</style>