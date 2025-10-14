<script setup lang="ts">
import Checkbox from '@/components/common/Checkbox.vue';
import { useRoomEditorStore } from '@/stores/RoomEditor';
import { useI18nStore } from '@/stores/I18n';
import type Core from '@/core';

const { t } = useI18nStore();

const roomEditorStore = useRoomEditorStore();

const props = defineProps<{
    selectedAsset: Core.Asset_Base | null;
    selectedRoom: Core.Room;
}>();

const emit = defineEmits(['inst-deleted']);

function deleteAllType(): void {
    if (!props.selectedAsset) return;

    const instances: Array<Core.Instance_Base> = [];

    props.selectedRoom.instances.forEach(i => {
        if (i.sourceId == props.selectedAsset!.id){
            instances.push(i);
        }
    });

    instances.forEach(i => emit('inst-deleted', {id: i.id, commit: false}));
    emit('inst-deleted', {commit: true});
}
</script>

<template>
    <div class="propContents">
        <div class="heading">{{ t('room_editor.eraser_properties') }}</div>
        <div class="control">
            <label for="copySelected">{{ t('room_editor.erase_top_only') }}:</label>
            <Checkbox id="copySelected" class="custom-checkbox" :value="roomEditorStore.eraserTopOnly"  v-tooltip="t('room_editor.tt_erase_top_only')"
                @change="roomEditorStore.eraserTopOnly = $event"/>
        </div>
        <div class="control">
            <label for="copySelected">{{ t('room_editor.erase_selected_type') }}:</label>
            <Checkbox id="copySelected" class="custom-checkbox" :value="roomEditorStore.eraserSelectedType" v-tooltip="t('room_editor.tt_erase_selected_type')"
                @change="roomEditorStore.eraserSelectedType = $event"/>
        </div>
        <div class="control">
            <button
                style="width: 150px"
                @click="deleteAllType"
                v-tooltip="t('room_editor.tt_delete_all_selected')">{{ t('room_editor.delete_all_selected') }}</button>
        </div>
    </div>
</template>

<style scoped>
@import '@/components/common/formStyles.css';
</style>