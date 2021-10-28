<template>
    <div class="dataSocket" :class="isInput ? 'isInput' : ''">
        <div class="socket_name">{{$t('node.' + socket.id)}}</div>
        <div v-if="isInput" class="inputBox">
            <input v-if="socket.type == SOCKET_TYPE.NUMBER" type="number" v-model="socket.value" />
            <input v-if="socket.type == SOCKET_TYPE.STRING" type="text" v-model="socket.value" />
            <div v-if="socket.type == SOCKET_TYPE.OBJECT" class="selfBox">{{$t('logic_editor.self')}}</div>
        </div>
        <svg width="20" height="20" class="socket_icon" @mousedown="mouseDown">
            <circle v-if="socket.type == SOCKET_TYPE.ANY" cx="10" cy="10" r="6" style="fill: #222222" />
            <polygon v-if="socket.type == SOCKET_TYPE.NUMBER" points="10,3 17,10 10,17 3,10" style="fill: #FFCE52" />
            <rect v-if="socket.type == SOCKET_TYPE.STRING" x="4" y="8" width="12" height="6" style="fill: #5280FF" />
            <rect v-if="socket.type == SOCKET_TYPE.OBJECT" x="4" y="4" width="12" height="12" style="fill: #FF85AE" />
        </svg>
    </div>
</template>

<script>
import Victor from 'victor';
import {SOCKET_TYPE} from '@/common/data_classes/Node_Enums';

export default {
    name: 'DataSocket',
    props: ['socket', 'isInput'],
    data(){
        return {
            mouseUpBinding: null,
        }
    },
    computed: {
        SOCKET_TYPE(){
            return SOCKET_TYPE;
        },
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
                id: this.socket.id,
                pos: new Victor(event.clientX, event.clientY),
            });
        },
        mouseUp(event){
            this.$emit('mouse-up', {
                id: this.socket.id,
                pos: new Victor(event.clientX, event.clientY),
            });
        },
    },
}
</script>

<style scoped>
.dataSocket{
    display: flex;
    flex-direction: row;
    align-items: center;
    gap: 5px;
}

.isInput{
    justify-content: flex-start;
    flex-direction: row-reverse;
}

.socket_icon{
    stroke: var(--border);
    stroke-width: 2px;
}

.socket_icon:hover{
    filter: brightness(2);
}

.inputBox > *{
    width: 4rem;
    margin-right: 3px;
    box-sizing: border-box;
}

.selfBox{
    background: var(--tool-panel-bg);
    filter: brightness(0.7);
    border-radius: 4px;
    text-align: center;
}
</style>