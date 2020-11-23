<template>
    <div class="editList">
        <div class="editListTitle">
            {{$t('room_editor.custom_variables')}}
        </div>
        <div class="heading">
            <div>{{$t('room_editor.custom_var_name')}}</div>
            <div>{{$t('room_editor.custom_var_val')}}</div>
        </div>
        <div ref="list" class="list">
            <div
                v-for="(item, idx) in editList"
                :key="item.name"
                class="item">
                <input class="inpName" type="text" :value="item.name"
                    @change="validateNewName($event.target, item.name, $event.target.value)"/>
                <div class="val">
                    <input class="inpVal" type="text" :value="item.val"
                        @change="$emit('var-changed', {
                            varName: item.name,
                            oldVal: item.val,
                            newVal: $event.target.value
                        })"/>
                    <button class="deleteBtn" @click="$emit('var-changed', {varName: item.name, newVal: item.val, remove: true, oldIdx: idx})">X</button>
                </div>
            </div>
        </div>
        <button class="addBtn" :title="tooltip_text" @click="addVar">
            +
        </button>
    </div>
</template>

<script>
import Util from '@/common/Util';

export default {
    name: 'VarList',
    props: ['editList', 'tooltip_text'],
    methods: {
        validateNewName(target, varName, newName){
            let newNameExists = false;

            for (let i = 0; i < this.editList.length; i++){
                newNameExists |= (this.editList[i].name == newName);
            }

            if (newNameExists || newName.length <= 0){
                target.value = varName;
            }
            else{
                this.$emit('var-changed', {
                    varName: varName,
                    newName: newName
                })
            }
        },
        addVar(){
            let nameList = this.editList.map(v => v.name);
            let nextNum = Util.getHighestEndingNumber(nameList) + 1;

            this.$emit('var-changed', {
                add: true,
                varName: this.$t('room_editor.new_var_prefix') + nextNum,
                newVal: 0
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
@import '../common/editList.css';

.item{
    display: flex;
    flex-direction: row;
    justify-content: center;
}

.item > .inpName{
    text-align: right;
    border-right: 1px solid black;
    width: 50%;
}

.val{
    display: flex;
    flex-direction: row;
    width: 50%;
    background: blue;
}
</style>