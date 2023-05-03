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
const showSearch = computed(()=>props.widget.options.showSearch);
const showThumbnail = computed(()=>props.widget.options.showThumbnail);

onMounted(()=>{
    nextTick(()=>{
        props.setWidgetData(enumValue.value);
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
            @change="setWidgetData($event)"></SearchDropdown>
    </div>
</template>

<style scoped>
@import '@/components/common/formStyles.css';

.enum{
    padding: 5px;
}
</style>