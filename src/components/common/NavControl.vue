<template>
    <div
        class="navControl"
        ref="navControl"
        @click="onClick"
        :class="{controlSelected : isSelected}">
        <img class="icon" ref="iconImg" />
        <div class="altText" ref="altText">
            {{control.altText}}
        </div>
    </div>
</template>

<script>
import {store} from 'vuex';

export default {
    name: 'NavControl',
    props: ['stateModule', 'control'],
    mounted() {
        let iconPath = this.control.icon || '';

        if (iconPath.length > 0){
            this.$refs.iconImg.src = require(`@/${iconPath}.svg`);
            this.$refs.altText.style.display = 'none';
        }
        else{
            this.$refs.iconImg.style.display = 'none';
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
    .navControl{
        display: flex;
        justify-content: center;
        align-items: center;
        width: 30pt;
        height: 30pt;
        background: #AAAAFF;
        border: 3px solid #AAAAAA;
        border-radius: 1000px;
        margin: 5px;
    }

    .navControl:hover:not(.controlSelected){
        background: #9999DD;
    }

    .controlSelected{
        background: #7676b9;
    }

    .icon{
        width: 20pt;
        height: 20pt;
    }
</style>