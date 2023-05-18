<script setup lang="ts">
import Enum from './widgets/Enum.vue';
import Key from './widgets/Key.vue';
import TextArea from './widgets/TextArea.vue';
import Direction from './widgets/Direction.vue';

import { computed } from 'vue';
import Core from '@/core';

const props = defineProps<{
    widget: any,
    widgetData: any,
    setWidgetData: (data: Core.iAnyObj)=>void,
}>();

const emit = defineEmits(['input']);

const currentWidget = computed(()=>{
    const WIDGET = Core.Node_Enums.WIDGET;

    switch(props.widget.type){
        case WIDGET.ENUM: return Enum;
        case WIDGET.KEY: return Key;
        case WIDGET.TEXT_AREA: return TextArea;
        case WIDGET.DIRECTION: return Direction;
    }
});
</script>

<template>
    <div class="widget">
        <component
            :is="currentWidget"
            :widget="widget"
            :widgetData="widgetData"
            :setWidgetData="setWidgetData"
            @input="emit('input', $event)"/>
    </div>
</template>

<style scoped>
.widget{
    display: flex;
    flex-direction: row;
    justify-content: center;
}
</style>