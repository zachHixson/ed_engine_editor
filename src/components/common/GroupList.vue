<script lang="ts">
import Core from '@/core';

export interface iGroupChangedProps {
    groupName: string,
    add?: boolean,
    remove?: boolean,
    newName?: string,
    oldIdx?: number,
    instRef?: Core.Instance_Base,
}
</script>

<script setup lang="ts">
import Svg from '@/components/common/Svg.vue';

import { ref, nextTick } from 'vue';
import { useI18nStore } from '@/stores/I18n';
import plusIcon from '@/assets/plus.svg';

const { t } = useI18nStore();

const props = defineProps<{
    editList: string[],
    readOnlyList?: string[],
}>();

const emit = defineEmits<{
    groupChanged: [iGroupChangedProps],
}>();

const list = ref();

function validateName(name: string, oldname: string): string {
    const roCollisions = props.readOnlyList?.includes(name);
    const editCollisions = props.editList.includes(name);

    if (name.length <= 0){
        return oldname;
    }

    if (roCollisions || editCollisions){
        return oldname;
    }

    return name;
}

function addGroup(): void {
    const nextNum = Math.max(
        Core.Util.getHighestEndingNumber(props.editList),
        props.readOnlyList ? Core.Util.getHighestEndingNumber(props.readOnlyList) : 0
    ) + 1;

    emit('groupChanged', {
        add: true,
        groupName: t('object_editor.group_prefix') + nextNum
    });
    nextTick(()=>{
        const listEl = list.value;
        listEl.scrollTop = listEl.scrollHeight - listEl.clientHeight;
    });
}

function groupNameChanged(group: string, event: any): void {
    const obj = {groupName: group, newName: validateName(event.target.value, group)};
    emit('groupChanged', obj);
}

function groupDeleted(group: string, idx: number): void {
    const obj = {groupName: group, remove: true, oldIdx: idx};
    emit('groupChanged', obj);
}
</script>

<template>
    <div class="editList">
        <div class="editListTitle">
            {{ t('object_editor.groups') }}
        </div>
        <div ref="list" class="list">
            <div>
                <div
                    v-for="group in readOnlyList"
                    :key="group"
                    class="item">
                    <input class="listInput readOnly" :value="group" disabled/>
                </div>
            </div>
            <div>
                <div
                    v-for="(group, idx) in editList"
                    :key="group"
                    class="item">
                    <input class="listInput" :value="group" @change="groupNameChanged(group, $event)"/>
                    <button class="deleteBtn" @click="groupDeleted(group, idx)">
                        <Svg :src="plusIcon" style="transform: rotate(45deg)"></Svg>
                    </button>
                </div>
            </div>
        </div>
        <button class="addBtn" @click="addGroup" v-tooltip="t('object_editor.tt_groups')">
            <Svg :src="plusIcon"></Svg>
        </button>
    </div>
</template>

<style scoped>
@import './editList.css';

.editList{
    width: 100%;
}

.item{
    display: flex;
    flex-direction: row;
}

.listInput{
    flex-grow: 1;
}

.readOnly{
    opacity: 75%;
}

.addBtn{
    position: relative;
}
</style>
