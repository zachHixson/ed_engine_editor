<script setup lang="ts">
import { computed, nextTick, onMounted } from 'vue';

const props = defineProps<{
    widget: any,
    widgetData: any,
    setWidgetData: (data: any)=>void,
}>();

const text = computed(()=>props.widgetData ?? '');

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