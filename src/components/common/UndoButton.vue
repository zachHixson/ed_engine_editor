<template>
    <div class="viewportControl" :title="altText" @click="onClick">
        <img
            v-show="iconLoaded"
            class="icon"
            :class="{iconDisabled : !isActive}"
            ref="iconImg"
            :src="require(`@/${icon}.svg`)"
            @error="iconLoaded = false" />
        <div v-show="!iconLoaded" class="altText" ref="altText">
            {{altText}}
        </div>
    </div>
</template>

<script>
export default {
    name: 'UndoButton',
    props: ['icon', 'altText', 'isActive'],
    data() {
        return {
            iconLoaded: true
        }
    },
    methods: {
        onClick(event){
            if (this.isActive){
                this.$emit('click');
            }
        }
    }
}
</script>

<style scoped>
@import './viewportButtons.css';
</style>