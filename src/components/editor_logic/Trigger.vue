<template>
    <div class="trigger" :class="isInput ? 'isInput' : ''">
        <div class="trigger_name">{{$t('node.' + triggerId)}}</div>
        <svg
            width="20"
            height="20"
            class="trigger_icon"
            @mousedown="mouseDown">
            <polygon points="3,3 17,10 3,16"/>
        </svg>
    </div>
</template>

<script>
import Victor from 'victor';

export default {
    name: 'Trigger',
    props: ['triggerId', 'isInput'],
    data(){
        return {
            mouseUpBinding: null,
        }
    },
    mounted(){
        this.mouseUpBinding = this.mouseUp.bind(this);

        window.addEventListener('click', this.mouseUpBinding);
    },
    beforeDestroy(){
        window.removeEventListener('click', this.mouseUpBinding);
    },
    methods: {
        mouseDown(event){
            event.stopPropagation();
            this.$emit('mouse-down', {
                id: this.triggerId,
                pos: new Victor(event.clientX, event.clientY),
            });
        },
        mouseUp(event){
            this.$emit('mouse-up', {
                id: this.triggerId,
                pos: new Victor(event.clientX, event.clientY),
            });
        },
    }
}
</script>

<style scoped>
.trigger{
    display: flex;
    flex-direction: row;
    align-items: center;
}

.isInput{
    justify-content: flex-start;
    flex-direction: row-reverse;
}

.trigger_icon{
    fill: none;
    stroke: white;
    stroke-width: 2px;
    stroke-linejoin: round;
}

.trigger_icon:hover{
    fill: #FFFFFF88;
}
</style>