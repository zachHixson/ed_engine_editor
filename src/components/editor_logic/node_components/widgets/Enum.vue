<script lang="ts">
const textSizeCtx = (()=>{
    const canvas = document.createElement('canvas') as HTMLCanvasElement;
    return canvas.getContext('2d')!;
})();
</script>
<script setup lang="ts">
import SearchDropdown from '@/components/common/SearchDropdown.vue';

import { computed, nextTick, onMounted } from 'vue';
import { useI18n } from 'vue-i18n';

const { t, te } = useI18n();

const props = defineProps<{
    widget: any,
    widgetData: any,
    setWidgetData: (data: any, commit?: boolean)=>void,
}>();

const enumOptions = computed(()=>{
    if (typeof props.widget.options.items[0] == 'string'){
        return props.widget.options.items.map((o: any) => ({
            name: t('node.' + o),
            value: o,
            id: o,
        }));
    }

    return props.widget.options.items;
});
const selectWidth = computed(()=>{
    if (enumOptions.value.length <= 0) return '40px';
    
    textSizeCtx.font = '15px Arial';

    const nodeKey = 'node.' + enumOptions.value[0].value;
    const nodeText = te(nodeKey) ? t(nodeKey) : '';
    let largest = textSizeCtx.measureText(nodeText).width;

    enumOptions.value.forEach(({ value }: {value: string}) => {
        const key = 'node.' + value
        const curText = te(key) ? t(key) : '';
        const curLength = textSizeCtx.measureText(curText).width;

        if (curLength > largest){
            largest = curLength;
        }
    });

    largest = Math.max(Math.min((largest * 2), 160), 50);

    return `${largest + 15}px`;
});
const enumValue = computed(()=>props.widgetData ?? enumOptions.value[0]);
const showSearch = computed(()=>props.widget.options.showSearch);
const showThumbnail = computed(()=>props.widget.options.showThumbnail);

onMounted(()=>{
    nextTick(()=>{
        const curVal = enumValue.value;

        if (curVal.value){
            props.setWidgetData(curVal.value);
        }
        else{
            props.setWidgetData(curVal);
        }
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
            @change="setWidgetData($event, true)"></SearchDropdown>
    </div>
</template>

<style scoped>
@import '@/components/common/formStyles.css';

.enum{
    padding: 5px;
}
</style>