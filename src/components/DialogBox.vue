<script lang="ts">
export const enum DIALOG_TYPE {
    ALERT,
    CONFIRM,
};

export const enum DIALOG_OPTION {
    NONE,
    NEGATIVE,
    POSITIVE,
};

export interface DialogBoxProps {
    type: DIALOG_TYPE,
    textInfo: {
        textId: string,
        rawText?: string,
        vars?: {[keys: string]: any}
    },
    callback?: (...args: any)=>void,
    defaultOpt?: DIALOG_OPTION,
}
</script>

<script setup lang="ts">
import { ref } from 'vue';
import { useI18nStore } from '@/stores/I18n';

const { t } = useI18nStore();

const isOpen = ref<boolean>(false);
const dialogType = ref<DIALOG_TYPE>(DIALOG_TYPE.CONFIRM);
const dialogDefault = ref<DIALOG_OPTION>(DIALOG_OPTION.NEGATIVE);
const text = ref<string>('');
let dialogCallback: ((positive: boolean)=>void) | null = null;

function dialogOpen({type, defaultOpt, textInfo, callback}: DialogBoxProps): void {
    isOpen.value = true;
    dialogType.value = type;
    dialogDefault.value = defaultOpt ?? DIALOG_OPTION.NEGATIVE;
    text.value = textInfo.rawText ?? t(textInfo.textId, textInfo.vars);
    dialogCallback = callback ?? null;
}

function dialogClose(option: DIALOG_OPTION): void {
    if (option == DIALOG_OPTION.NONE && dialogDefault.value == DIALOG_OPTION.NONE) return;

    const confirmedOption = option == DIALOG_OPTION.POSITIVE;

    dialogCallback && dialogCallback(confirmedOption);
    dialogCallback = null;
    isOpen.value = false;
}

defineExpose({dialogOpen});
</script>

<template>
<div v-if="isOpen" class="dialog-bg" @click="dialogClose(DIALOG_OPTION.NONE)">
    <div class="dialog-box">
        <div v-html="text"></div>
        <div class="dialog-buttons">
            <button v-if="dialogType == DIALOG_TYPE.CONFIRM" @click="dialogClose(DIALOG_OPTION.NEGATIVE)">
                {{ t('generic.cancel') }}
            </button>
            <button @click="dialogClose(DIALOG_OPTION.POSITIVE)">
                {{ t('generic.ok') }}
            </button>
        </div>
    </div>
</div>
</template>

<style scoped>
.dialog-bg{
    position: absolute;
    display: flex;
    justify-content: center;
    align-items: center;
    width: 100%;
    height: 100%;
    background: var(--modal-bg);
    z-index: 2000;
}

.dialog-box{
    padding: 10px;
    background: white;
    overflow: hidden;
    border: 2px solid var(--border);
    border-radius: var(--corner-radius);
    max-width: 400px;
}

.dialog-buttons{
    display: flex;
    justify-content: end;
    width: 100%;
    margin-top: 10px;
    gap: 3px;
}

.dialog-buttons > button{
    background: var(--button-norm);
    border-radius: var(--corner-radius);
    border: 2px solid var(--border);
    font-size: medium;
    padding: 5px;
}

.dialog-buttons > button:hover{
    background: var(--button-hover);
}

.dialog-buttons > button:active{
    background: var(--button-down);
}
</style>
