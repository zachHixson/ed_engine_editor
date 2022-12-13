<template>
    <div class="DialogNewVariable">
        <div class="dialog">
            <div class="heading">
                {{$t('logic_editor.new_variable')}}:
            </div>
            <div class="controlsWrapper">
                <div class="control">
                    <label for="name">Name: </label>
                    <input id="name" type="text" v-model="varName" autocomplete="off"/>
                    <Decorator v-show="error" ref="error" style="width: 25px" :src="require(`@/assets/error_decorator.svg`)" />
                    <Decorator v-show="warning" ref="warning" style="width: 25px" :src="require(`@/assets/warning_decorator.svg`)" />
                </div>
                <div class="control">
                    <label for="type">{{$t('logic_editor.type')}}: </label>
                    <select style="background: white" v-model="type">
                        <option :value="Shared.SOCKET_TYPE.NUMBER">{{$t('logic_editor.number')}}</option>
                        <option :value="Shared.SOCKET_TYPE.STRING">{{$t('logic_editor.string')}}</option>
                        <option :value="Shared.SOCKET_TYPE.BOOL">{{$t('logic_editor.boolean')}}</option>
                        <option :value="Shared.SOCKET_TYPE.OBJECT">{{$t('logic_editor.object')}}</option>
                    </select>
                </div>
                <div class="control">
                    <label for="isGlobal">{{$t('logic_editor.is_global')}}: </label>
                    <input id="isGlobal" type="checkbox" v-model="isGlobal" />
                </div>
                <div class="control">
                    <label for="isList">{{$t('logic_editor.is_list')}}: </label>
                    <input id="isList" type="checkbox" v-model="isList" />
                </div>
            </div>
            <div class="buttonWrapper">
                <button class="button" @click="close">{{$t('generic.cancel')}}</button>
                <button class="button" @click="createVariable" :disabled="!isValid">{{$t('logic_editor.create')}}</button>
            </div>
        </div>
    </div>
</template>

<script>
import Decorator from '@/components/common/Decorator';

export default {
    name: 'DialogNewVariable',
    props: ['selectedAsset', 'callback'],
    components: {
        Decorator,
    },
    data(){
        return {
            varName: '',
            type: Shared.SOCKET_TYPE.NUMBER,
            isGlobal: false,
            isList: false,
        }
    },
    computed: {
        Shared(){
            return Shared;
        },
        globalVariableMap(){
            return this.$store.getters['LogicEditor/getGlobalVariableMap'];
        },
        error(){
            const varMap = this.isGlobal ? this.globalVariableMap : this.selectedAsset.localVariables;
            const isError = !!varMap.get(this.varName.trim().toLowerCase());

            isError && this.$refs.error.setTooltipText(this.$t('logic_editor.variable_name_collision'));

            return isError;
        },
        warning(){
            const varName = this.varName.trim().toLowerCase();
            let shouldWarn = false;

            if (!this.isGlobal && this.globalVariableMap.get(varName)){
                shouldWarn = true;
                this.$refs.warning.setTooltipText(this.$t('logic_editor.local_global_name_warning'));
            }

            return shouldWarn && !this.error;
        },
        isValid(){
            return !this.error && !!this.varName.length;
        },
    },
    methods: {
        createVariable(){
            const {varName, type, isGlobal, isList} = this;

            this.callback({
                name: varName,
                type,
                global: isGlobal,
                isList,
            });
            this.close();
        },
        close(){
            this.varName = '';
            this.type = Shared.SOCKET_TYPE.NUMBER;
            this.isGlobal = false;
            this.isList = false;
            this.$emit('close');
        }
    }
}
</script>

<style scoped>
@import '../common/formStyles.css';

.DialogNewVariable{
    position: absolute;
    left: 0;
    top: 0;
    display: flex;
    justify-content: center;
    align-items: center;
    width: 100%;
    height: 100%;
    background: var(--modal-bg);
    z-index: 9999;
}

.dialog{
    display: flex;
    flex-direction: column;
    justify-content: flex-start;
    align-items: center;
    background: white;
    min-width: max-content;
    min-height: max-content;
    width: 300px;
    padding: 5px;
    box-sizing: border-box;
    border-radius: var(--corner-radius);
    border: 2px solid var(--border);
}

.heading{
    width: 100%;
    color: var(--heading);
    font-size: 2em;
    margin-bottom: 10px;
}

.controlsWrapper{
    display: flex;
    flex-direction: column;
    flex-shrink: 1;
    gap: 5px;
}

.control{
    position: relative;
    display: flex;
    flex-direction: row;
    justify-content: flex-end;
    align-items: center;
    gap: 5px;
}

.buttonWrapper{
    display: flex;
    flex-direction: row;
    align-self: flex-end;
    margin-top: 10px;
    gap: 5px;
}

.button{
    background: var(--button-norm);
    border-radius: var(--corner-radius);
    border: 2px solid var(--border);
    font-size: medium;
    padding: 5px;
}

.button:hover{
    background: var(--button-hover);
}

.button:active{
    background: var(--button-down);
}

.button:disabled{
    background: var(--button-disabled);
}
</style>