<script setup lang="ts">
import Checkbox from '@/components/common/Checkbox.vue';
import SearchDropdown from '@/components/common/SearchDropdown.vue';

import { computed } from 'vue';
import Core from '@/core';
import { useI18n } from 'vue-i18n';
import { checkNameCollisions, nanToNull } from '../Properties.vue';
import { useGameDataStore } from '@/stores/GameData';

const { t } = useI18n();
const gameDataStore = useGameDataStore();

const props = defineProps<{
    selectedExit: Core.Instance_Exit;
    room: Core.Room;
}>();

const emit = defineEmits([
    'exit-prop-set',
]);

const genericNoOption = { name: t('generic.no_option'), id: -1, value: null };

const destinationRooms = computed(()=>{
    const rooms = gameDataStore.getAllRooms.map(r => ({
        name: r.name,
        id: r.id,
        value: r.id,
    }));

    return [genericNoOption, ...rooms];
});
const destinationRoomExits = computed(()=>{
    if (props.selectedExit?.TYPE != Core.INSTANCE_TYPE.EXIT) return [genericNoOption];
    
    const allRooms = gameDataStore.getAllRooms;
    const destRoom = allRooms.find(r => r.id == props.selectedExit.destinationRoom);
    const destExits = destRoom?.instances.toArray().filter(instance => instance.TYPE == Core.INSTANCE_TYPE.EXIT && instance.id != props.selectedExit.id);
    const options = destExits?.map(e => ({
        name: e.name,
        id: e.id,
        value: e.id,
    })) ?? [];

    return [genericNoOption, ...options];
});

function setExitProp(propObj: any): void {
    emit('exit-prop-set', propObj);
}

function setExitName(newName: string): void {
    const instanceList = props.room.instances;
    newName = checkNameCollisions(props.selectedExit!.id, newName, instanceList, t('room_editor.duplicate_name_suffix'));

    setExitProp({name: newName});
}
</script>

<template>
    <div class="propContents">
        <div class="heading">{{$t('room_editor.exit_properties_heading')}}</div>
        <div class="control">
            <label for="exitName">{{$t('room_editor.exit_name')}}:</label>
            <input id="exitName" type="text" :value="selectedExit.name" v-tooltip="$t('room_editor.tt_exit_name')"
                @change="setExitName(($event.target as any).value)" v-input-active/>
        </div>
        <div class="control">
            <label for="detectBacktrack">{{$t('room_editor.detect_backtrack')}}:</label>
            <Checkbox id="detectBacktrack" class="custom-checkbox" :value="selectedExit.detectBacktracking" v-tooltip="$t('room_editor.tt_exit_detect_backtrack')"
                @change="setExitProp({detectBacktracking: $event})"></Checkbox>
        </div>
        <div class="control">
            <label for="exitEnding">{{$t('room_editor.is_ending')}}:</label>
            <Checkbox id="exitEnding" class="custom-checkbox" :value="selectedExit.isEnding" v-tooltip="$t('room_editor.tt_exit_is_ending')"
                @change="setExitProp({isEnding: $event})"></Checkbox>
        </div>
        <div v-show="selectedExit.isEnding" class="control">
            <label for="endingDialog">{{$t('room_editor.end_dialog')}}:</label>
            <textarea id="endingDialog" :value="selectedExit.endingDialog" v-tooltip="$t('room_editor.tt_exit_end_dialog')"
                @change="setExitProp({endingDialog: ($event.target as any).value})"></textarea>
        </div>
        <div class="control">
            <label for="exitTrans">{{$t('room_editor.transition')}}:</label>
            <SearchDropdown
                id="exitTrans"
                class="custom-select"
                :value="selectedExit.transition"
                :items="[
                    { name: t('generic.no_option'), id: Core.Instance_Exit.TRANSITION_TYPES.NONE, value: Core.Instance_Exit.TRANSITION_TYPES.NONE},
                    { name: t('room_editor.trans_fade'), id: Core.Instance_Exit.TRANSITION_TYPES.FADE, value: Core.Instance_Exit.TRANSITION_TYPES.FADE},
                ]"
                @change="setExitProp({transition: $event})"
                v-tooltip="$t('room_editor.tt_exit_trans')"></SearchDropdown>
        </div>
        <div v-show="!selectedExit.isEnding" class="control">
            <label for="exitDestRoom">{{$t('room_editor.dest_room')}}:</label>
            <SearchDropdown
                id="exitTrans"
                class="custom-select"
                :value="selectedExit.destinationRoom"
                :items="destinationRooms"
                @change="setExitProp({destinationRoom: nanToNull(parseInt($event))})"
                v-tooltip="$t('room_editor.tt_exit_dest_room')"></SearchDropdown>
        </div>
        <div v-show="!selectedExit.isEnding && selectedExit.destinationRoom !== null" class="control">
            <label for="exitDestExit">{{$t('room_editor.dest_exit')}}:</label>
            <SearchDropdown
                id="exitTrans"
                class="custom-select"
                :value="selectedExit.destinationExit"
                :items="destinationRoomExits"
                @change="setExitProp({destinationExit: nanToNull(parseInt($event))})"
                v-tooltip="$t('room_editor.tt_exit_dest_exit')"></SearchDropdown>
        </div>
    </div>
</template>

<style scoped>
@import '@/components/common/formStyles.css';
</style>