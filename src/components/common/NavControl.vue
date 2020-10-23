<template>
    <div
        class="viewportControl"
        ref="navControl"
        :title="control.altText"
        @click="onClick"
        :class="{controlSelected : isSelected}">
        <img v-show="iconLoaded" class="icon" ref="iconImg" :src="require(`@/${this.control.icon}.svg`)" @error="iconLoaded = false" />
        <div v-show="!iconLoaded" class="altText" ref="altText">
            {{control.altText}}
        </div>
    </div>
</template>

<script>
import {store} from 'vuex';

export default {
    name: 'NavControl',
    props: ['stateModule', 'control'],
    data() {
        return {
            iconLoaded: true
        }
    },
    computed: {
        isSelected() {
            return this.$store.getters[
                this.stateModule + '/getSelectedNavTool'
            ] == this.control.id;
        }
    },
    methods: {
        onClick() {
            this.$emit('click', this.control);

            if (!this.control.oneshot){
                this.$store.dispatch(
                    this.stateModule + '/setSelectedNavTool',
                    this.control.id
                );
            }
        }
    }
}
</script>

<style scoped>
@import './viewportButtons.css';
</style>