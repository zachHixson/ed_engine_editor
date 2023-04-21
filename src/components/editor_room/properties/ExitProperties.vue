<script setup lang="ts">
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

const destinationRoomExits = computed(()=>{
    if (props.selectedExit?.TYPE != Core.INSTANCE_TYPE.EXIT) return null;
    
    const allRooms = gameDataStore.getAllRooms;
    const destRoom = allRooms.find(r => r.id == props.selectedExit.destinationRoom);

    return destRoom?.instances.toArray().filter(instance => instance.TYPE == Core.INSTANCE_TYPE.EXIT && instance.id != props.selectedExit.id);
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
            <label for="exitTrans">{{$t('room_editor.transition')}}:</label>
            <select id="exitTrans" :value="selectedExit.transition" v-tooltip="$t('room_editor.tt_exit_trans')"
                @change="setExitProp({transition: ($event.target! as any).value})">
                <option :value="Core.Instance_Exit.TRANSITION_TYPES.NONE">{{$t('generic.no_option')}}</option>
                <option :value="Core.Instance_Exit.TRANSITION_TYPES.FADE">{{$t('room_editor.trans_fade')}}</option>
            </select>
        </div>
        <div class="control">
            <label for="exitEnding">{{$t('room_editor.is_ending')}}:</label>
            <input id="exitEnding" type="checkbox" :checked="selectedExit.isEnding" v-tooltip="$t('room_editor.tt_exit_is_ending')"
                @change="setExitProp({isEnding: ($event.target as any).checked})"/>
        </div>
        <div v-show="!selectedExit.isEnding" class="control">
            <label for="exitDestRoom">{{$t('room_editor.dest_room')}}:</label>
            <select id="exitDestRoom" :value="selectedExit.destinationRoom" v-tooltip="$t('room_editor.tt_exit_dest_room')"
                @change="setExitProp({destinationRoom: nanToNull(parseInt(($event.target as any).value))})">
                <option value="">{{$t('generic.no_option')}}</option>
                <option
                    v-for="room in gameDataStore.getAllRooms"
                    :key="room.id"
                    :value="room.id">{{room.name}}</option>
            </select>
        </div>
        <div v-show="!selectedExit.isEnding && selectedExit.destinationRoom !== null" class="control">
            <label for="exitDestExit">{{$t('room_editor.dest_exit')}}:</label>
            <select id="exitDestExit" :value="selectedExit.destinationExit" v-tooltip="$t('room_editor.tt_exit_dest_exit')"
                @change="setExitProp({destinationExit: nanToNull(parseInt(($event.target as any).value))})">
                <option value="">{{$t('generic.no_option')}}</option>
                <option
                    v-for="exit in destinationRoomExits"
                    :key="exit.id"
                    :value="exit.id">{{exit.name}}</option>
            </select>
        </div>
        <div v-show="selectedExit.isEnding" class="control">
            <label for="endingDialog">{{$t('room_editor.end_dialog')}}:</label>
            <textarea id="endingDialog" :value="selectedExit.endingDialog" v-tooltip="$t('room_editor.tt_exit_end_dialog')"
                @change="setExitProp({endingDialog: ($event.target as any).value})"></textarea>
        </div>
    </div>
</template>

<style scoped>
@import '@/components/common/formStyles.css';
</style>