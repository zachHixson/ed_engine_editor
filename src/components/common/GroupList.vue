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
                    <input :value="group" disabled/>
                </div>
            </div>
            <div>
                <div
                    v-for="(group, idx) in editList"
                    :key="group"
                    class="item">
                    <input :value="group" @change="$emit('group-changed', {groupName: group, newName: validateName($event.target.value, group)})"/>
                    <button class="deleteBtn" @click="$emit('group-changed', {groupName: group, remove: true, oldIdx: idx})">X</button>
                </div>
            </div>
        </div>
        <button class="addBtn" @click="addGroup">
            +
        </button>
    </div>
</template>

<script>
import Util from '@/common/Util';

export default {
    name: 'GroupList',
    props: ['editList', 'readOnlyList'],
    methods: {
        validateName(name, oldname){
            let roCollisions = this.readOnlyList?.includes(name);
            let editCollisions = this.editList.includes(name);

            if (name.length <= 0){
                return oldname;
            }

            if (roCollisions || editCollisions){
                return oldname;
            }

            return name;
        },
        addGroup(){
            let nextNum = Math.max(
                Util.getHighestEndingNumber(this.editList),
                (this.readOnlyList) ? Util.getHighestEndingNumber(this.readOnlyList) : []
            ) + 1;

            this.$emit('group-changed', {
                add: true,
                groupName: this.$t('object_editor.group_prefix') + nextNum
            });
            this.$nextTick(()=>{
                let list = this.$refs.list;
                list.scrollTop = list.scrollHeight - list.clientHeight;
            });
        }
    }
}
</script>

<style scoped>
@import './editList.css';

.editList{
    width: 100%;
}

.item{
    display: flex;
    flex-direction: row;
}

input{
    flex-grow: 1;
}
</style>