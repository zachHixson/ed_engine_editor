<script setup lang="ts">
import { ref, computed, watch } from 'vue';

import checkIcon from '@/assets/checkmark.svg';

const props = defineProps<{
    value: boolean | null,
    triple?: boolean,
    disabled?: boolean,
}>();

const emit = defineEmits(['change']);

const state = ref(props.value);
const showCheck = computed(()=>state.value);
const showInt = computed(()=>state.value == null);
const styles = computed(()=>{
    const outStyles = [];

    if (state.value) outStyles.push('checked');
    if (props.disabled) outStyles.push('disabled');

    return outStyles.join(' ');
});

watch(()=>props.value, (newVal: boolean | null)=>state.value = newVal);

function onClick(): void {
    if (props.disabled) return;

    if (state.value){
        state.value = false;
    }
    else{
        const intermediate = props.triple && state.value == false;
        state.value =  intermediate ? null : true;
    }

    emit('change', state.value);
}

defineExpose({value: state.value, checked: state.value});
</script>

<template>
    <div class="checkbox" :class="styles" @click="onClick">
        <img v-if="showCheck" style="margin: 2px;" :src="checkIcon" draggable="false"/>
        <svg v-if="showInt" width="20px" height="20px">
            <path d="M4 10 L14 10" stroke="#333333" stroke-width="3px" stroke-linecap="round"/>
        </svg>
    </div>
</template>

<style scoped>
.checkbox{
    display: flex;
    justify-content: center;
    align-items: center;
    width: 20px;
    height: 20px;
    background: white;
    border: 1px solid var(--border);
    border-radius: 5px;
}

.checkbox:hover:not(.disabled){
    filter: brightness(0.9);
}

.checkbox:active:not(.disabled){
    filter: brightness(0.7);
}

.checked {
    background: #84cdeb;
}

.disabled {
    background: #888888;
}
</style>