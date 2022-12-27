<script setup lang="ts">
import { ref } from 'vue';

const props = defineProps<{
    icon: string,
    altText: string,
    isActive: boolean,
}>();

const emit = defineEmits(['click']);

const iconLoaded = ref<boolean>(true);

function onClick(){
    if (props.isActive){
        emit('click');
    }
}
</script>

<template>
    <div class="viewportControl" @click="onClick" v-tooltip="altText">
        <img
            v-show="iconLoaded"
            class="icon"
            :class="{iconDisabled : !isActive}"
            ref="iconImg"
            :src="props.icon"
            @error="iconLoaded = false" />
        <div v-show="!iconLoaded" class="altText" ref="altText">
            {{altText}}
        </div>
    </div>
</template>

<style scoped>
@import './viewportButtons.css';
</style>