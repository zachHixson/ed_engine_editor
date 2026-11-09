<script setup lang="ts">
import { ref, computed, onBeforeMount, onBeforeUnmount } from 'vue';
import { useI18nStore } from '@/stores/I18n';
import type { WidgetKey } from '@engine/core/core';

const { t } = useI18nStore();

const props = defineProps<{
    widget: unknown,
    widgetData: unknown,
    setWidgetData: (data: WidgetKey['widget']['data'], commit?: boolean)=>void,
}>();

const active = ref(false);

const keyDisplay = computed(()=>{
    const data = props.widgetData as WidgetKey['widget']['data'];

    if (data.code == 'Space'){
        return data.code;
    }

    if (!data.key){
        return '';
    }

    return data.key.length > 1 ? data.key : data.key.toUpperCase();
});

onBeforeMount(()=>{
    if (!props.widgetData){
        props.setWidgetData({code: null, key: null});
    }
});

onBeforeUnmount(()=>{
    document.removeEventListener('keydown', onKey);
});

function setActive(): void {
    active.value = true;
    document.addEventListener('keydown', onKey);
}

function onKey(event: KeyboardEvent): void {
    event.preventDefault();
    deactivate();
    props.setWidgetData({
        code: event.code,
        key: event.key,
    }, true);
}

function deactivate(): void {
    active.value = false;
    document.removeEventListener('keydown', onKey);
}

function deactivateSpace(event: KeyboardEvent): void {
    event.preventDefault();
}
</script>

<template>
    <div class="key-main">
        <button
            class="button"
            :class="active ? 'button-active':''"
            @click="setActive"
            @mousedown="$event.stopPropagation()"
            @keyup.space="deactivateSpace"
            v-click-outside="deactivate">
                <div v-show="!(<WidgetKey['widget']['data']>widgetData).key && !active">{{ t('node.no_key_set') }}</div>
                <div v-show="active">{{ t('node.press_any_key') }}</div>
                <div v-show="(<WidgetKey['widget']['data']>widgetData).key && !active">{{keyDisplay}}</div>
        </button>
    </div>
</template>

<style scoped>
.key-main{
    padding: 5px;
    width: 100%;
}

.button{
    width: 100%;
    height: 2em;
    background: #DDDDDD;
    border: 2px solid var(--border);
    border-radius: var(--corner-radius);
}

.button:hover{
    background: var(--button-dark-hover);
}

.button-active,
.button-active:hover{
    border-color: var(--button-norm);
}
</style>
