<template>
    <div class="varList">
        <div class="heading">
            <div>{{$t('room_editor.custom_var_name')}}</div>
            <div>{{$t('room_editor.custom_var_val')}}</div>
        </div>
        <div class="list">
            <div
                v-for="(item, idx) in editList"
                :key="item.name"
                class="item">
                <input class="inpName" type="text" :value="item.name"
                    @change="validateNewName($event.target, item.name, $event.target.value)"/>
                <input class="inpVal" type="text" :value="item.val"
                    @change="$emit('var-changed', {
                        varName: item.name,
                        oldVal: item.val,
                        newVal: $event.target.value
                    })"/>
                <button @click="$emit('var-changed', {varName: item.name, newVal: item.val, remove: true, oldIdx: idx})">X</button>
            </div>
        </div>
        <button class="addBtn" :title="tooltip_text" @click="$emit('var-changed', {
                add: true,
                varName: $t('room_editor.new_var_prefix') + editList.length,
                newVal: 0
            })">
            +
        </button>
    </div>
</template>

<script>
export default {
    name: 'VarList',
    props: ['editList', 'tooltip_text'],
    methods: {
        validateNewName(target, varName, newName){
            let newNameExists = false;

            for (let i = 0; i < this.editList.length; i++){
                newNameExists |= (this.editList[i].name == newName);
            }

            if (newNameExists){
                target.value = varName;
            }
            else{
                this.$emit('var-changed', {
                    varName: varName,
                    newName: newName
                })
            }
        }
    }
}
</script>

<style scoped>
.varList{
    display: flex;
    flex-direction: column;
    background: #008888;
    border-radius: 10px;
    overflow: hidden;
}

.heading{
    display: flex;
    flex-direction: row;
    justify-content: center;
}

.heading > div{
    flex-grow: 1;
    text-align: center;
}

.list{
    min-height: 15px;
}

.item{
    display: flex;
    flex-direction: row;
    justify-content: center;
}

.item > input{
    min-width: 0;
    flex-grow: 0;
    border: 0;
    padding: 5px;
    border-bottom: 1px solid #DDD;
}

.item > .inpName{
    text-align: right;
    border-right: 1px solid black;
}

.addBtn{
    display: flex;
    flex-direction: row;
    justify-content: center;
    background: #EEEEEE;
    border: none;
}

.addBtn:hover{
    background: #DDDDDD;
}
</style>