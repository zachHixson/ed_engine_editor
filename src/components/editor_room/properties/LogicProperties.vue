<script setup lang="ts">
import GroupList from '@/components/common/GroupList.vue';

import { watch, computed } from 'vue';
import { checkNameCollisions, nanToNull } from '../Properties.vue';
import { useI18n } from 'vue-i18n';
import { useGameDataStore } from '@/stores/GameData';
import type Core from '@/core';

const { t } = useI18n();
const gameDataStore = useGameDataStore();

const props = defineProps<{
    selectedLogic: Core.Instance_Logic;
    selectedRoom: Core.Room;
}>();

const emit = defineEmits([
    'inst-prop-set',
    'inst-group-changed',
]);

const logicName = computed(()=>{
    const logicScript = gameDataStore.getAllLogic.find(l => l.id == props.selectedLogic.logicId);
    return logicScript?.name;
});

function setInstProp(propObj: any): void {
    emit('inst-prop-set', propObj);
}

function setInstanceName(newName: string): void {
    const instanceList = props.selectedRoom.instances;
    newName = checkNameCollisions(props.selectedLogic.id, newName, instanceList, t('room_editor.duplicate_name_suffix'));

    setInstProp({name: newName});
}
</script>

<template>
    <div class="propContents">
        <div class="heading">Logic</div>
        <div class="info" style="margin: var(--margin); margin-left: 0px;">
            <div>Logic Type:</div>
            <div>{{logicName}}</div>
        </div>
        <div class="control">
            <label for="name">{{$t('room_editor.instance_name')}}:</label>
            <input id="name" type="text" :value="selectedLogic.name" v-tooltip="$t('room_editor.tt_inst_name')"
                @change="setInstanceName(($event.target as any).value)" v-input-active/>
        </div>
        <GroupList
            :editList="selectedLogic.groups"
            @group-changed="emit('inst-group-changed', $event)"/>
    </div>
</template>

<style scoped>
@import '@/components/common/formStyles.css';
</style>