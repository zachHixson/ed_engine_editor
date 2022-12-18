<template>
    <div
        class="viewportControl"
        ref="navControl"
        @click="onClick"
        :class="{controlSelected : isSelected}"
        v-tooltip="control.altText">
        <img v-show="iconLoaded" class="icon" ref="iconImg" :src="require(`@/${this.control.icon}.svg`)" @error="iconLoaded = false"/>
        <div v-show="!iconLoaded" class="altText" ref="altText">
            {{control.altText}}
        </div>
    </div>
</template>

<script>
export default {
    name: 'NavControl',
    props: ['stateModule', 'control', "isSelected"],
    data() {
        return {
            iconLoaded: true
        }
    },
    methods: {
        onClick() {
            this.$emit('click', this.control);
        }
    }
}
</script>

<style scoped>
@import './viewportButtons.css';
</style>