<script setup lang="ts">
import GroupList from '@/components/common/GroupList.vue';

import { computed } from 'vue';
import { checkNameCollisions, nanToNull } from '../Properties.vue';
import { useI18n } from 'vue-i18n';
import { useGameDataStore } from '@/stores/GameData';
import type Core from '@/core';

const gameDataStore = useGameDataStore();

const props = defineProps<{
    selectedLogic: Core.Instance_Logic;
}>();

const emit = defineEmits([
    'inst-prop-set',
    'inst-group-changed',
]);

const logicName = computed(()=>{
    const logicScript = gameDataStore.getAllLogic.find(l => l.id == props.selectedLogic.logicId);
    return logicScript?.name;
});
</script>

<template>
    <div class="propContents">
        <div class="heading">Logic</div>
        <div class="info" style="margin: var(--margin); margin-left: 0px;">
            <div>Logic Type:</div>
            <div>{{logicName}}</div>
        </div>
        <GroupList
            :editList="selectedLogic.groups"
            @group-changed="emit('inst-group-changed', $event)"/>
    </div>
</template>

<style scoped>
@import '@/components/common/formStyles.css';
</style>