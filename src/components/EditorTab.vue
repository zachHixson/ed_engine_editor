<script setup lang="ts">
import { ref, defineProps, computed } from 'vue';
import { useMainStore } from '@/stores/Main';
import type Core from '@/core';

const mainStore = useMainStore();

const props = defineProps<{
    tabText: string;
    logoPath: string;
    editorID: typeof Core.EDITOR_ID;
}>();

const isSelected = computed<boolean>(()=>mainStore.getSelectedEditor == props.editorID);

function tabClick(): void {
    mainStore.setSelectedEditor(props.editorID);
}
</script>

<template>
    <div class="editorTab" @click="tabClick" :class="{tabSelected : isSelected}">
        <div class="tabEl logoBox">
            <img class="tabImg" :src="logoPath"/>
        </div>
        <div class="tabEl name">
            {{tabText}}
        </div>
    </div>
</template>

<style scoped>
*{
    --border-width: 2px;
}

.editorTab{
    border: 2px solid var(--border);
    background: var(--tab-inactive);
    flex-grow: 1;
    display: flex;
    flex-direction: row;
    align-items: center;
    max-width: 50%;
    border-radius: var(--corner-radius) var(--corner-radius) 0px 0px;
    color: var(--text-dark);
}

.editorTab:not(:last-child){
    margin-right: -12px;
}

.editorTab:hover:not(.tabSelected){
    filter: brightness(0.8);
}

.tabSelected{
    background: var(--tab-active);
    border-bottom: none;
    z-index: 100;
}

.tabImg{
    width: 50px;
    height: 50px;
    fill: var(--text-dark);
    stroke: var(--text-dark);
}

.tabEl{
    display: flex;
    justify-content: center;
}

.logoBox{
    margin-left: 1vw;
}

.name{
    flex-grow: 1;
    font-weight: bold;
    font-size: 2em;
}
</style>