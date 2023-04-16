<script setup lang="ts">
import Checkbox from '@/components/common/Checkbox.vue';

import { useRoomEditorStore } from '@/stores/RoomEditor';

const roomEditorStore = useRoomEditorStore();
</script>

<template>
    <div class="propContents">
        <div class="heading">Add Brush Properties</div>
        <div class="control">
            <label for="copySelected">Copy Selected Instance:</label>
            <Checkbox id="copySelected" class="custom-checkbox" :value="roomEditorStore.addBrushCopy"
                @change="roomEditorStore.addBrushCopy = $event"/>
        </div>
        <div class="control">
            <label for="paintOverlap">Allow Overlap:</label>
            <Checkbox id="paintOverlap" class="custom-checkbox" :value="roomEditorStore.addBrushOverlap"
                @change="roomEditorStore.addBrushOverlap = $event"/>
        </div>
        <div class="control">
            <label for="fps">Paint at depth:</label>
            <input id="fps" type="number" :value="roomEditorStore.addBrushDepth" v-tooltip="$t('room_editor.tt_fps_nullable')"
                @change="roomEditorStore.addBrushDepth = ($event as any).target.value" v-input-active/>
        </div>
    </div>
</template>

<style scoped>
@import '@/components/common/formStyles.css';
</style>