<script setup lang="ts">
import Svg from '@/components/common/Svg.vue';
import SearchDropdown from '../common/SearchDropdown.vue';

import { ref, computed, onMounted } from 'vue';
import { useI18n } from 'vue-i18n';
import { useMainStore } from '@/stores/Main';
import { useLogicEditorStore } from '@/stores/LogicEditor';
import type Logic from './node_components/Logic';
import Core from '@/core';

import errorIcon from '@/assets/error_decorator.svg';
import warningIcon from '@/assets/warning_decorator.svg';

const CHAR_LIMIT = 50;

const { t } = useI18n();
const mainStore = useMainStore();
const logicEditorStore = useLogicEditorStore();

const props = defineProps<{
    selectedAsset: Logic,
    editVarInfo: Core.iVarInfo | null,
    callback: (positive: boolean, varInfo: Core.iVarInfo)=>void,
}>();

const emit = defineEmits(['close']);

const varName = ref('');
const type = ref(Core.Node_Enums.SOCKET_TYPE.NUMBER);
const isGlobal = ref(false);
const isList = ref(false);

const globalVariableMap = computed(()=>logicEditorStore.getGlobalVariableMap);
const nameError = computed<string>(()=>{
    const varMap = isGlobal.value ? globalVariableMap.value : props.selectedAsset.localVariables;
    const name = varName.value.trim().toLowerCase();
    const nameCollision = !!varMap.get(name) && name != props.editVarInfo?.name.toLowerCase();
    const containsSpace = /\s/.test(name);

    if (nameCollision) return t('logic_editor.variable_name_collision');
    if (containsSpace) return t('logic_editor.variable_name_spaces');
    return '';
});
const nameWarning = computed<string>(()=>{
    const name = varName.value.trim().toLowerCase();

    if (nameError.value) return '';

    if (!isGlobal.value && globalVariableMap.value.get(name)){
        return t('logic_editor.local_global_name_warning');
    }

    if (name.length == CHAR_LIMIT){
        return t('logic_editor.variable_length_warning', {limit: CHAR_LIMIT});
    }

    if (name.length > 0 && props.editVarInfo && name != props.editVarInfo.name.toLowerCase()){
        return t('logic_editor.variable_name_change_warning');
    }

    return '';
});
const typeWarning = computed<string>(()=>{
    if (!props.editVarInfo) return '';

    const nodeAPI = mainStore.getNodeAPI;

    if (!Core.canConvertSocket(type.value, props.editVarInfo.type) && nodeAPI.getVariableUsage(varName.value, null, isGlobal.value).length > 0){
        const newTypeKey = Core.Node_Enums.SOCKET_TYPE[type.value];
        const oldTypeKey = Core.Node_Enums.SOCKET_TYPE[props.editVarInfo.type];
        const newTypeText = t(`node.${newTypeKey}`);
        const oldTypeText = t(`node.${oldTypeKey}`)
        return t('logic_editor.variable_incompatible_type_warning', {newType: newTypeText, oldType: oldTypeText});
    }

    return '';
});
const isValid = computed(()=>!nameError.value && !!varName.value.trim().length);

onMounted(()=>{
    if (props.editVarInfo){
        varName.value = props.editVarInfo.name;
        type.value = props.editVarInfo.type;
        isGlobal.value = !!props.editVarInfo.isGlobal;
        isList.value = !!props.editVarInfo.isList;
    }
});

function confirm(): void {
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
    <div class="DialogVariable">
        <div class="dialog">
            <div class="heading">
                {{editVarInfo ? $t('logic_editor.edit_variable') : $t('logic_editor.new_variable')}}:
            </div>
            <div class="controlsWrapper">
                <div class="control">
                    <label for="name">Name: </label>
                    <input id="name" type="text" v-model="varName" :maxlength="CHAR_LIMIT" autocomplete="off"/>
                    <div class="decorator-wrapper">
                        <Svg v-show="nameError.length > 0" class="decorator" :src="errorIcon" v-tooltip="()=>nameError"></Svg>
                        <Svg v-show="nameWarning.length > 0" class="decorator" :src="warningIcon" v-tooltip="()=>nameWarning"></Svg>
                    </div>
                </div>
                <div class="control">
                    <label for="type">{{$t('logic_editor.type')}}: </label>
                    <SearchDropdown id="type" :value="type" @change="type = $event" :items="[
                        { name: t('logic_editor.number'), id: Core.Node_Enums.SOCKET_TYPE.NUMBER, value: Core.Node_Enums.SOCKET_TYPE.NUMBER },
                        { name: t('logic_editor.string'), id: Core.Node_Enums.SOCKET_TYPE.STRING, value: Core.Node_Enums.SOCKET_TYPE.STRING },
                        { name: t('logic_editor.boolean'), id: Core.Node_Enums.SOCKET_TYPE.BOOL, value: Core.Node_Enums.SOCKET_TYPE.BOOL },
                        { name: t('logic_editor.instance'), id: Core.Node_Enums.SOCKET_TYPE.INSTANCE, value: Core.Node_Enums.SOCKET_TYPE.INSTANCE },
                    ]"></SearchDropdown>
                    <div class="decorator-wrapper">
                        <Svg v-show="typeWarning.length > 0" class="decorator" :src="warningIcon" v-tooltip="()=>typeWarning"></Svg>
                    </div>
                </div>
                <div v-if="!editVarInfo" class="control">
                    <label for="isGlobal">{{$t('logic_editor.is_global')}}: </label>
                    <input id="isGlobal" type="checkbox" v-model="isGlobal" />
                </div>
                <div v-if="editVarInfo" class="control">
                    <label for="isGlobal">{{$t('logic_editor.is_global')}}: </label>
                    <input id="isGlobal" type="checkbox" v-model="isGlobal" disabled/>
                </div>
                <div class="control">
                    <label for="isList">{{$t('logic_editor.is_list')}}: </label>
                    <input id="isList" type="checkbox" v-model="isList" />
                </div>
            </div>
            <div class="buttonWrapper">
                <button class="button" @click="cancel">{{$t('generic.cancel')}}</button>
                <button class="button" @click="confirm" :disabled="!isValid">{{editVarInfo ? $t('logic_editor.edit') : $t('logic_editor.create')}}</button>
            </div>
        </div>
    </div>
</template>

<style scoped>
@import '../common/formStyles.css';

.DialogVariable{
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