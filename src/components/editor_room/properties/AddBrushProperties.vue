<script setup lang="ts">
import Checkbox from '@/components/common/Checkbox.vue';

import { useRoomEditorStore } from '@/stores/RoomEditor';
import { useI18n } from 'vue-i18n';

const { t } = useI18n();

const roomEditorStore = useRoomEditorStore();
</script>

<template>
    <div class="propContents">
        <div class="heading">{{ t('room_editor.add_brush_properties') }}</div>
        <div class="control">
            <label for="copySelected">{{ t('room_editor.copy_selected_instance') }}:</label>
            <Checkbox id="copySelected" class="custom-checkbox" :value="roomEditorStore.addBrushCopy" v-tooltip="t('room_editor.tt_copy_selected_instance')"
                @change="roomEditorStore.addBrushCopy = $event"/>
        </div>
        <div class="control">
            <label for="paintOverlap">{{ t('room_editor.allow_overlap') }}:</label>
            <Checkbox id="paintOverlap" class="custom-checkbox" :value="roomEditorStore.addBrushOverlap" v-tooltip="t('room_editor.tt_allow_overlap')"
                @change="roomEditorStore.addBrushOverlap = $event"/>
        </div>
        <div class="control">
            <label for="fps">{{ t('room_editor.paint_at_depth') }}:</label>
            <input id="fps" type="number" :value="roomEditorStore.addBrushDepth" v-tooltip="t('room_editor.tt_paint_at_depth')"
                @change="roomEditorStore.addBrushDepth = ($event as any).target.value" v-input-active/>
        </div>
    </div>
</template>

<style scoped>
@import '@/components/common/formStyles.css';
</style>