<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useLogicEditorStore } from '@/stores/LogicEditor';
import Core from '@/core';

const props = defineProps<{
    position: Core.Vector,
}>();

const emit = defineEmits(['copy', 'paste']);

const logicEditorStore = useLogicEditorStore();

const contextMenuEl = ref<HTMLDivElement>();

const showPaste = computed(()=>logicEditorStore.getClipboard.nodeData.length > 0);

onMounted(()=>{
    contextMenuEl.value!.style.left = props.position.x + 'px';
    contextMenuEl.value!.style.top = props.position.y + 'px';
});
</script>

<template>
    <div ref="contextMenuEl" class="context-menu">
        <button class="context-option" @click="emit('copy');">Copy</button>
        <button class="context-option" :disabled="!showPaste" @click="emit('paste');">Paste</button>
    </div>
</template>

<style scoped>
.context-menu{
    position: absolute;
    left: 0;
    top: 0;
    display: flex;
    flex-direction: column;
    border: 2px solid var(--border);
    border-radius: var(--corner-radius);
    background: var(--tool-panel-bg);
    overflow: hidden;
    z-index: 2000;
}

.context-option{
    text-align: start;
    font-size: 1.2em;
    background: var(--tool-panel-bg);
    border: none;
}

.context-option:hover{
    filter: brightness(1.2);
}

.context-option:active{
    filter: brightness(0.8);
}
</style>