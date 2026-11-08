<script lang="ts">
const textSizeCtx = (()=>{
    const canvas = document.createElement('canvas') as HTMLCanvasElement;
    return canvas.getContext('2d')!;
})();
</script>
<script setup lang="ts">
import SearchDropdown from '@/components/common/SearchDropdown.vue';
import type { WidgetEnum } from '@engine/core/nodes/Widget';

import { computed, nextTick, onMounted } from 'vue';
import { useI18nStore } from '@/stores/I18n';

type EnumOption = NonNullable<WidgetEnum['widget']['options']['items']>[number]

const { t, te } = useI18nStore();

const props = defineProps<{
    widget: unknown,
    widgetData: unknown,
    setWidgetData: (data: WidgetEnum['widget']['data'], commit?: boolean)=>void,
}>();

const enumOptions = computed<Array<EnumOption>>(()=>{
    const widget = props.widget as WidgetEnum['widget'];

    if (widget.options.stringItems){;
        widget.options.items = widget.options.stringItems.map<EnumOption>(i => ({
            name: t('node.' + i),
            value: i,
            id: i,
        }));
        widget.options.stringItems = undefined;
    }

    if (!widget.options.items) {
        throw new Error('No items in enum widget');
    }

    return widget.options.items;
});
const selectWidth = computed(()=>{
    if (enumOptions.value.length <= 0) return '40px';

    textSizeCtx.font = '15px Arial';

    const nodeKey = 'node.' + enumOptions.value[0].value;
    const nodeText = te(nodeKey) ? t(nodeKey) : '';
    let largest = textSizeCtx.measureText(nodeText).width;

    enumOptions.value.forEach(({ name, value }: EnumOption) => {
        const key = 'node.' + value
        const curText = te(key) ? t(key) : name;
        const curLength = textSizeCtx.measureText(curText).width;

        if (curLength > largest){
            largest = curLength;
        }
    });

    largest = Math.min(Math.max(largest, 50), 160);

    return `${largest + 20}px`;
});
const enumValue = computed(()=>(<WidgetEnum['widget']['data']>props.widgetData) ?? enumOptions.value[0]);
const showSearch = computed(()=>(<WidgetEnum['widget']>props.widget).options.showSearch);
const showThumbnail = computed(()=>(<WidgetEnum['widget']>props.widget).options.showThumbnail);

onMounted(()=>{
    nextTick(()=>{
        const curVal = enumValue.value;
        props.setWidgetData(curVal);
    });
});
</script>

<template>
    <div class="enum">
        <SearchDropdown
            :style="`width: ${selectWidth};`"
            :items="enumOptions"
            :value="enumValue"
            :search="showSearch"
            :thumbnail="showThumbnail"
            @change="setWidgetData($event as string, true)"></SearchDropdown>
    </div>
</template>

<style scoped>
@import '@/components/common/formStyles.css';

.enum{
    padding: 5px;
}
</style>
