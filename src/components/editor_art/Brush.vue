<template>
    <div class="brush" :class="{brushSelected : isSelected}" @click="click">
        <img class="icon" ref="iconImg" />
        <div class="altText" ref="altText">
            {{name}}
        </div>
    </div>
</template>

<script>
export default {
    name: 'Brush',
    props: ['icon', 'tool', 'name', 'curSelection'],
    mounted() {
        let iconPath = this.icon || '';

        if (iconPath.length > 0){
            this.$refs.iconImg.src = require(`@/${iconPath}.svg`);
            this.$refs.altText.style.display = 'none';
        }
        else{
            this.$refs.iconIMg.style.display = 'none';
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