<script setup lang="ts">
import Svg from './Svg.vue';

import { ref, computed, watch } from 'vue';

import arrowIcon from '@/assets/arrow_01.svg';

const props = withDefaults(defineProps<{
    type: 'number' | 'text',
    value?: number | string,
    required?: boolean,
    disabled?: boolean,
}>(), {
    required: true,
    disabled: false,
});

const emit = defineEmits(['input', 'change', 'focus', 'blur']);

const inputRef = ref<HTMLInputElement>();
const internalValue = ref(props.value ?? ((props.required ?? true) && props.type == 'number' ? 0 : ''));
const focused = ref(false);
let lastVal = internalValue.value;

const disabled = computed(()=>props.disabled);
const showButtons = computed(()=>props.type == 'number');
const isEmpty = computed(()=>!!(internalValue.value as string).length);
const styles = computed(()=>{
    const classes: string[] = [];

    if (focused.value) classes.push('focused');
    if (disabled.value) classes.push('input-main-disabled');

    return classes.join(' ');
})

watch(()=>props.value, (newVal)=>internalValue.value = newVal!);

function onFocus(event: FocusEvent): void {
    focused.value = true;
    emit('focus', event);
}

function onBlur(event: FocusEvent): void {
    focused.value = false;
    emit('blur', event);
}

function onChange(event: InputEvent): void {
    const target = event.target as HTMLInputElement;
    const parsedVal = parseFloat(target.value);

    if (props.type == 'number'){
        const needsReplace = target.value.length || props.required;

        if (!isNaN(parsedVal)){
            internalValue.value = parsedVal;
        }
        else if (needsReplace){
            internalValue.value = lastVal;
            return;
        }
    }

    lastVal = internalValue.value;
    emit('change', {target, value: internalValue.value});
}

function numButton(increment: number): void {
    if (props.disabled) return;

    const curVal = isEmpty.value ? 0 : (internalValue.value as number);
    let eventData;

    internalValue.value = curVal + increment;
    lastVal = internalValue.value;
    eventData = {target: inputRef.value, value: internalValue.value};
    emit('change', eventData);
    emit('input', eventData);
}

defineExpose({value: internalValue.value});
</script>

<template>
    <div class="input-main" :class="styles">
        <input
            type="text"
            ref="inputRef"
            class="text-display"
            :class="disabled ? 'text-display-disabled':''"
            v-model="internalValue"
            :disabled="disabled"
            @change="onChange"
            @input="emit('input', $event)"
            @focus="onFocus"
            @blur="onBlur"
            v-input-active/>
        <div v-if="showButtons" class="button-wrapper">
            <div class="button" @click="numButton(1)" :class="disabled ? 'button-disabled':''">
                <Svg :src="arrowIcon"></Svg>
            </div>
            <div class="button" @click="numButton(-1)" :class="disabled ? 'button-disabled':''">
                <Svg style="transform: rotate(180deg)" :src="arrowIcon"></Svg>
            </div>
        </div>
    </div>
</template>

<style scoped>
.input-main {
    position: relative;
    display: flex;
    flex-direction: row;
    align-items: center;
    background: white;
    border: 1px solid var(--border);
    border-radius: 5px;
    overflow: hidden;
}

.input-main:hover:enabled {
    border-color: #AAAAAA;
}

.focused {
    border: none;
    outline: #006eff solid 3px;
}

.input-main-disabled {
    border: 1px solid #999999;
    background: #DDDDDD;
}

.text-display {
    flex-shrink: 1;
    height: 100%;
    overflow: hidden;
    border: none;
    box-sizing: border-box;
    background: none;
}

.text-display:focus {
    border: none;
    outline: none;
}

.text-display-disabled {
    color: black;
}

.button-wrapper {
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    height: 100%;
    padding-right: 2px;
}

.button {
    width: 10px;
    height: 10px;
    border-radius: 2px;
}

.button-disabled {
    opacity: 50%;
}

.button:hover:not(.button-disabled) {
    background: #AAAAAA;
}
</style>