<script setup lang="ts">
import Decorator from '@/components/common/Decorator.vue';

import { ref, computed } from 'vue';
import { useI18n } from 'vue-i18n';
import { useLogicEditorStore } from '@/stores/LogicEditor';
import type Logic from './Logic';
import Core from '@/core';
import errorIcon from '@/assets/error_decorator.svg';
import warningIcon from '@/assets/warning_decorator.svg';

const CHAR_LIMIT = 50;

const { t } = useI18n();
const logicEditorStore = useLogicEditorStore();

const props = defineProps<{
    selectedAsset: Logic,
    callback: (positive: boolean, varInfo: Core.iNewVarInfo)=>void,
}>();

const emit = defineEmits(['close']);

const errorRef = ref<InstanceType<typeof Decorator>>();
const warningRef = ref<InstanceType<typeof Decorator>>();

const varName = ref('');
const type = ref(Core.Node_Enums.SOCKET_TYPE.NUMBER);
const isGlobal = ref(false);
const isList = ref(false);

const globalVariableMap = computed(()=>logicEditorStore.getGlobalVariableMap);
const error = computed(()=>{
    const varMap = isGlobal.value ? globalVariableMap.value : props.selectedAsset.localVariables;
    const name = varName.value.trim().toLowerCase();
    const nameCollision = !!varMap.get(name);
    const containsSpace = /\s/.test(name);
    const isError = nameCollision || containsSpace;

    nameCollision && errorRef.value!.setTooltipText(t('logic_editor.variable_name_collision'));
    containsSpace && errorRef.value!.setTooltipText(t('logic_editor.variable_name_spaces'));

    return isError;
});
const warning = computed(()=>{
    const name = varName.value.trim().toLowerCase();
    let shouldWarn = false;

    if (!isGlobal.value && globalVariableMap.value.get(name)){
        shouldWarn = true;
        warningRef.value!.setTooltipText(t('logic_editor.local_global_name_warning'));
    }

    if (name.length == CHAR_LIMIT){
        shouldWarn = true;
        warningRef.value!.setTooltipText(t('logic_editor.variable_length_warning', {limit: CHAR_LIMIT}));
    }

    return shouldWarn && !error.value;
});
const isValid = computed(()=>!error.value && !!varName.value.length);

function createVariable(): void {
    props.callback(true, {
        name: varName.value,
        type: type.value,
        isGlobal: isGlobal.value,
        isList: isList.value,
    });
    close();
}

function cancel(): void {
    props.callback(false, {} as any);
    close();
}

function close(): void {
    varName.value = '';
    type.value = Core.Node_Enums.SOCKET_TYPE.NUMBER;
    isGlobal.value = false;
    isList.value = false;
    emit('close');
}
</script>

<template>
    <div class="DialogNewVariable">
        <div class="dialog">
            <div class="heading">
                {{$t('logic_editor.new_variable')}}:
            </div>
            <div class="controlsWrapper">
                <div class="control">
                    <label for="name">Name: </label>
                    <input id="name" type="text" v-model="varName" :maxlength="CHAR_LIMIT" autocomplete="off"/>
                    <div class="decorator-wrapper">
                        <Decorator v-show="error" ref="errorRef" class="decorator" :src="errorIcon" />
                        <Decorator v-show="warning" ref="warningRef" class="decorator" :src="warningIcon" />
                    </div>
                </div>
                <div class="control">
                    <label for="type">{{$t('logic_editor.type')}}: </label>
                    <select style="background: white" v-model="type">
                        <option :value="Core.Node_Enums.SOCKET_TYPE.NUMBER">{{$t('logic_editor.number')}}</option>
                        <option :value="Core.Node_Enums.SOCKET_TYPE.STRING">{{$t('logic_editor.string')}}</option>
                        <option :value="Core.Node_Enums.SOCKET_TYPE.BOOL">{{$t('logic_editor.boolean')}}</option>
                        <option :value="Core.Node_Enums.SOCKET_TYPE.OBJECT">{{$t('logic_editor.object')}}</option>
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
                <button class="button" @click="cancel">{{$t('generic.cancel')}}</button>
                <button class="button" @click="createVariable" :disabled="!isValid">{{$t('logic_editor.create')}}</button>
            </div>
        </div>
    </div>
</template>

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

.decorator-wrapper{
    position: absolute;
    right: 0;
    display: flex;
    flex-direction: row;
    align-items: center;
    width: 0px;
    height: 100%;
    background: red;
}

.decorator{
    position: absolute;
    left: 3px;
    width: 25px;
}
</style>