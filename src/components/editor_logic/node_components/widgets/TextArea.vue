<script setup lang="ts">
import { computed, nextTick, onMounted } from 'vue';
import type { WidgetTextArea } from '@engine/core/nodes/Widget';

const props = defineProps<{
    widget: unknown,
    widgetData: unknown,
    setWidgetData: (data: WidgetTextArea['widget']['data'])=>void,
}>();

const text = computed(()=>(props.widgetData as WidgetTextArea['widget']['data']) ?? '');

onMounted(()=>{
    nextTick(()=>{
        props.setWidgetData(text.value);
    });
});
</script>

<template>
    <div>
        <textarea
            rows="4"
            cols="31"
            style="resize: none; margin-top: 5px"
            @change="setWidgetData(($event.target as HTMLInputElement).value)" :value="text" v-input-active></textarea>
    </div>
</template>
