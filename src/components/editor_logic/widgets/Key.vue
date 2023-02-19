<script setup lang="ts">
import { ref, computed, onBeforeMount, onMounted, onBeforeUnmount } from 'vue';

const props = defineProps<{
    widget: any,
    widgetData: any,
    setWidgetData: (data: any)=>void,
}>();

const active = ref(false);
const key = ref<string | null>(null);
const code = ref<string | null>(null);

const keyDisplay = computed(()=>{
    if (code.value == 'Space'){
        return code.value;
    }

    if (!key.value){
        return '';
    }

    return key.value.length > 1 ? key.value : key.value.toUpperCase();
});

onBeforeMount(()=>{
    if (!props.widgetData){
        props.setWidgetData({code: null, key: null});
    }
});

onMounted(()=>{
    if (props.widgetData){
        key.value = props.widgetData.key;
        code.value = props.widgetData.code;
    }
});

onBeforeUnmount(()=>{
    document.removeEventListener('keydown', onKey);
});

function setActive(): void {
    active.value = true;
    document.addEventListener('keydown', onKey);
}

function onKey(event: KeyboardEvent): void {
    event.preventDefault();
    deactivate();
    props.setWidgetData({
        code: event.code,
        key: event.key,
    });
    key.value = event.key;
    code.value = event.code;
}

function deactivate(): void {
    active.value = false;
    document.removeEventListener('keydown', onKey);
}

function deactivateSpace(event: KeyboardEvent): void {
    event.preventDefault();
}
</script>

<template>
    <div class="key-main">
        <button
            class="button"
            name="debug"
            :class="active ? 'button-active':''"
            @click="setActive"
            @mousedown="$event.stopPropagation()"
            @keyup.space="deactivateSpace"
            v-click-outside="deactivate">
                <div v-show="!key && !active">No Key Set</div>
                <div v-show="active">Press any key</div>
                <div v-show="key && !active">{{keyDisplay}}</div>
        </button>
    </div>
</template>

<style scoped>
.key-main{
    padding: 5px;
    width: 100%;
}

.button{
    width: 100%;
    height: 2em;
    background: #DDDDDD;
    border: 2px solid var(--border);
    border-radius: var(--corner-radius);
}

.button:hover{
    background: var(--button-dark-hover);
}

.button-active,
.button-active:hover{
    border-color: var(--button-norm);
}
</style>