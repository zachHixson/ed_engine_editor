<script setup lang="ts">
import { defineProps, computed } from 'vue';
import { useI18nStore } from '@/stores/I18n';
import Svg from '@/components/common/Svg.vue';
import decoratorMap from '@/components/editor_logic/decoratorMap';
import type { WidgetVarInfo } from '@engine/core/core';

const { t } = useI18nStore();

const props = defineProps<{
    widget: unknown;
}>();

const globalDecoratorPath = decoratorMap.get('global_variable')!;

const infoWidget = computed(()=><WidgetVarInfo['widget']>props.widget);
const varName = computed(()=>infoWidget.value.options?.name ?? "Undefined");
const varType = computed(()=>t(`node.${infoWidget.value.options?.type}`));
const isGlobal = computed(()=>infoWidget.value.options?.isGlobal);

</script>

<template>
    <div class="varInfoWidget">
        <div class="infoLine">
            <div class="lineTitle">{{ t('node.create_var_display_name') }}</div>
            <div>{{ varName }}</div>
            <Svg
                v-if="isGlobal"
                class="decorator"
                :src="globalDecoratorPath"
                v-tooltip="t('node.global_variable')"></Svg>
        </div>
        <div class="infoLine">
            <div class="lineTitle">{{ t('node.create_var_display_type') }}</div>
            <div>{{ varType }}</div>
        </div>
    </div>
</template>

<style scoped>
.varInfoWidget {
    display: flex;
    flex-direction: column;
    width: 100%;
    padding-left: 25px;
}

.infoLine {
    display: flex;
    flex-direction: row;
    align-items: center;
    height: 25px;
    gap: 5px;
}

.lineTitle {
    font-weight: bold;
}

.decorator{
    width: 25px;
    height: auto;
}
</style>
