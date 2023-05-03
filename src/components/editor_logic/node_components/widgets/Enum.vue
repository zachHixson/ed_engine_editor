<script setup lang="ts">
import SearchDropdown from '@/components/common/SearchDropdown.vue';

import { computed, nextTick, onMounted } from 'vue';
import { useI18n } from 'vue-i18n';

const { t } = useI18n();

const props = defineProps<{
    widget: any,
    widgetData: any,
    setWidgetData: (data: any)=>void,
}>();

const enumOptions = computed(()=>
    props.widget.options.map((o: any) => ({
            name: t('node.' + o),
            value: o,
            id: o,
    }))
);
const selectWidth = computed(()=>{
    if (enumOptions.value.length <= 0) return '20px';

    let largest = t('node.' + enumOptions.value[0].value).length;

    enumOptions.value.forEach(({ value }: {value: string}) => {
        let curLength = t('node.' + value).length;
        if (curLength > largest){
            largest = curLength;
        }
    });

    return `${largest + 2}em`;
});
const enumValue = computed(()=>props.widgetData ?? enumOptions.value[0]);

onMounted(()=>{
    nextTick(()=>{
        props.setWidgetData(enumValue.value);
    });
});
</script>

<template>
    <div class="enum">
        <SearchDropdown :style="`width: ${selectWidth};`" :items="enumOptions" @change="setWidgetData($event)" :value="enumValue"></SearchDropdown>
    </div>
</template>

<style scoped>
@import '@/components/common/formStyles.css';

.enum{
    padding: 5px;
}
</style>