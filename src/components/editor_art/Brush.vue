<template>
    <div class="brush" :class="{brushSelected : isSelected}" @click="click" :title="name">
        <img v-show="iconLoaded" class="icon" ref="iconImg" :src="require(`@/${icon}.svg`)" @error="iconLoaded = false" />
        <div v-show="!iconLoaded" class="altText" ref="altText">
            {{name}}
        </div>
    </div>
</template>

<script>
export default {
    name: 'Brush',
    props: ['icon', 'tool', 'name', 'curSelection'],
    data() {
        return {
            iconLoaded: true
        }
    },
    computed: {
        isSelected(){
            return (this.curSelection == this.tool);
        }
    },
    methods: {
        click(event){
            this.$emit('toolClicked', this.tool);
        }
    }
}
</script>

<style scoped>
    .brush{
        display: flex;
        justify-content: center;
        align-items: center;
        width: 30pt;
        height: 30pt;
        background: red;
        margin: 5px;
        border-radius: 8pt;
        border: 2px solid black;
    }

    .brush:hover:not(.controlSelected){
        background: #AA0000;
    }

    .brush > *{
        pointer-events: none;
    }

    .brushSelected {
        background: #880000;
    }

    .icon {
        width: 30px;
        height: 30px;
    }
</style>