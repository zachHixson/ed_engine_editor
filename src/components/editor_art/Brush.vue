<template>
    <div class="brush" @click="click">
        <img class="icon" ref="iconImg" />
        <div class="altText" ref="altText">
            {{name}}
        </div>
    </div>
</template>

<script>
export default {
    name: 'Brush',
    props: ['icon', 'tool', 'name'],
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

    .brush:hover{
        background: #AA0000;
    }

    .brush > *{
        pointer-events: none;
    }

    .icon {
        width: 30px;
        height: 30px;
    }
</style>