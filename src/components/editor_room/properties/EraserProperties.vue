<script setup lang="ts">
import Checkbox from '@/components/common/Checkbox.vue';
import { useRoomEditorStore } from '@/stores/RoomEditor';
import type Core from '@/core';

const roomEditorStore = useRoomEditorStore();

const props = defineProps<{
    selectedInstance: Core.Instance_Base | null;
    selectedRoom: Core.Room;
}>();

const emit = defineEmits(['inst-deleted']);

function deleteAllType(): void {
    if (!props.selectedInstance) return;

    const instances: Array<Core.Instance_Base> = [];

    props.selectedRoom.instances.forEach(i => {
        if (i.sourceId == props.selectedInstance!.sourceId){
            instances.push(i);
        }
    });

    instances.forEach(i => emit('inst-deleted', {id: i.id, commit: false}));
    emit('inst-deleted', {commit: true});
}
</script>

<template>
    <div class="propContents">
        <div class="heading">Eraser</div>
        <div class="control">
            <label for="copySelected">Erase top only:</label>
            <Checkbox id="copySelected" class="custom-checkbox" :value="roomEditorStore.eraserTopOnly"
                @change="roomEditorStore.eraserTopOnly = $event"/>
        </div>
        <div class="control">
            <label for="copySelected">Only Erase selected type:</label>
            <Checkbox id="copySelected" class="custom-checkbox" :value="roomEditorStore.eraserSelectedType"
                @change="roomEditorStore.eraserSelectedType = $event"/>
        </div>
        <div class="control">
            <button style="width: 150px" @click="deleteAllType">Delete all of selected type</button>
        </div>
    </div>
</template>

<style scoped>
@import '@/components/common/formStyles.css';
</style>