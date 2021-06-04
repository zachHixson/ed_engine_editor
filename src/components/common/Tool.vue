<template>
    <div class="tool" :class="{toolSelected : isSelected}" @click="click" :title="name">
        <inline-svg v-show="iconLoaded" class="icon" ref="iconImg" :src="require(`@/${icon}.svg`)" @error="iconLoaded = false"
            :transformSource="removeStroke"/>
        <div v-show="!iconLoaded" class="altText" ref="altText">
            {{name}}
        </div>
    </div>
</template>

<script>
import {removeStroke} from '@/common/Util.js';

export default {
    name: 'Tool',
    props: ['icon', 'tool', 'name', 'curSelection', 'toggled'],
    data() {
        return {
            iconLoaded: true
        }
    },
    computed: {
        isSelected(){
            return (this.curSelection == this.tool) || (this.toggled);
        }
    },
    methods: {
        click(event){
            this.$emit('toolClicked', this.tool);
        },
        removeStroke
    }
}
</script>

<style scoped>
.tool{
    display: flex;
    justify-content: center;
    align-items: center;
    width: 30pt;
    height: 30pt;
    background: var(--button-norm);
    margin: 5px;
    border-radius: 8pt;
    border: 2px solid var(--border);
}

.tool:hover:not(.controlSelected){
    background: var(--button-hover);
}

.tool:active:hover{
    background: var(--button-hover);
    filter: brightness(0.8);
}

.tool > *{
    pointer-events: none;
}

.toolSelected {
    background: var(--button-down);
}

.icon {
    width: 30px;
    height: 30px;
    fill: var(--button-icon);
    stroke: var(--button-icon);
}
</style>