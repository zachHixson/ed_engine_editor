<template>
    <div class="viewportControl" :title="altText" @click="onClick">
        <img class="icon" :class="{iconDisabled : !isActive}" ref="iconImg" />
        <div class="altText" ref="altText">
            {{altText}}
        </div>
    </div>
</template>

<script>
export default {
    name: 'UndoButton',
    props: ['icon', 'altText', 'isActive'],
    mounted() {
        if (this.icon != null){
            this.$refs.iconImg.src = require(`@/${this.icon}.svg`);
            this.$refs.altText.style.display = 'none';
        }
        else{
            this.$refs.iconImg.style.display = 'none';
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