<script setup lang="ts">
import { computed, nextTick, onMounted } from 'vue';
import { useI18n } from 'vue-i18n';

const { t } = useI18n();

const props = defineProps<{
    widget: any,
    widgetData: any,
    setWidgetData: (data: any)=>void,
}>();

const enumOptions = computed(()=>props.widget.options);
const selectWidth = computed(()=>{
    if (enumOptions.value.length <= 0) return '20px';

    let largest = t('node.' + enumOptions.value[0]).length;

    enumOptions.value.forEach((option: string) => {
        let curLength = t('node.' + option).length;
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
        <select
            :style="`width: ${selectWidth};`"
            @change="setWidgetData(($event.target as HTMLInputElement).value)" :value="enumValue">
            <option
                v-for="option in enumOptions"
                :key="option"
                :value="option">{{t('node.' + option)}}</option>
        </select>
    </div>
</template>

<style scoped>
.enum{
    padding: 5px;
}
</style>