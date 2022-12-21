<script setup lang="ts">
import UndoButton from '@/components/common/UndoButton.vue';
import HotkeyMap from '@/components/common/HotkeyMap';
import undoButtonSVG from '@/assets/undo.svg';
import redoButtonSVG from '@/asset/redo.svg';

import {
    computed,
    defineProps,
    defineEmits,
    onMounted,
    onBeforeUnmount
} from 'vue';

const props = defineProps<{
    undoLength: number,
    redoLength: number,
}>();

const emit = defineEmits(['undo', 'redo']);

const hotkeyMap = new HotkeyMap();
const keyDown = hotkeyMap.keyDown.bind(hotkeyMap);
const keyUp = hotkeyMap.keyUp.bind(hotkeyMap);

const undoActive = computed(()=>props.undoLength > 0);
const redoActive = computed(()=>props.redoLength > 0);

onMounted(()=>{
    document.addEventListener('keydown', keyDown as EventListener);
    document.addEventListener('keyup', keyUp as EventListener);

    hotkeyMap.enabled = true;
    hotkeyMap.bindKey(['control', 'z'], ()=>emit('undo'));
    hotkeyMap.bindKey(['control', 'shift', 'z'], ()=>emit('undo'));
});

onBeforeUnmount(()=>{
    document.removeEventListener('keydown', keyDown as EventListener);
    document.removeEventListener('keyup', keyUp as EventListener);
});
</script>

<template>
    <div class="undoPanel">
        <UndoButton :icon="undoButtonSVG" :altText="$t('undo.undo')" :isActive="undoActive" @click="$emit('undo')"/>
        <UndoButton :icon="redoButtonSVG" :altText="$t('undo.redo')" :isActive="redoActive" @click="$emit('redo')"/>
    </div>
</template>

<style scoped>
    .undoPanel{
        display: flex;
        flex-direction: row;
    }
</style>