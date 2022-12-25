<script lang="ts">
export interface iGroupChangedProps {
    groupName: string,
    add?: boolean,
    remove?: boolean,
    newName?: string,
    oldIdx?: number,
}
</script>

<script setup lang="ts">
import { ref, defineProps, defineEmits, nextTick } from 'vue';
import { useI18n } from 'vue-i18n';
import Core from '@/core';

const { t } = useI18n();

const props = defineProps<{
    editList: string[],
    readOnlyList: string[],
    tooltip_text?: string,
}>();

const emit = defineEmits(['group-changed']);

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
        Shared.getHighestEndingNumber(props.editList),
        (props.readOnlyList) ? Shared.getHighestEndingNumber(props.readOnlyList) : []
    ) + 1;

    emit('group-changed', {
        add: true,
        groupName: t('object_editor.group_prefix') + nextNum
    } satisfies iGroupChangedProps);
    nextTick(()=>{
        const listEl = list.value;
        listEl.scrollTop = listEl.scrollHeight - listEl.clientHeight;
    });
}

function groupNameChanged(group: string, event: any): void {
    const obj = {groupName: group, newName: validateName(event.target.value, group)} satisfies iGroupChangedProps;
    emit('group-changed', obj);
}

function groupDeleted(group: string, idx: number, event: any): void {
    const obj = {groupName: group, remove: true, oldIdx: idx} satisfies iGroupChangedProps;
    emit('group-changed', obj);
}
</script>

<template>
    <div class="editList">
        <div class="editListTitle">
            {{$t('object_editor.groups')}}
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
                    <button class="deleteBtn" @click="groupDeleted(group, idx, $event)">
                        <img src="@/assets/plus.svg" style="transform: rotate(45deg)"/>
                    </button>
                </div>
            </div>
        </div>
        <button class="addBtn" @click="addGroup" v-tooltip="tooltip_text">
            <img name="plusBtn" src="@/assets/plus.svg" />
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