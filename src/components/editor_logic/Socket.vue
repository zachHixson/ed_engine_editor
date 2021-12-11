<template>
    <div class="dataSocket" :class="isInput ? 'isInput' : ''">
        <div class="socket_name">{{$t('node.' + socket.id)}}</div>
        <div v-if="isInput && !isConnected" class="inputBox">
            <input v-if="socket.type == SOCKET_TYPE.NUMBER" ref="input" type="number" :value="socket.value" @change="valueChanged" @mousemove="$event.stopPropagation()"/>
            <input v-if="socket.type == SOCKET_TYPE.STRING" ref="input" type="text" :value="socket.value"  @change="valueChanged" @mousemove="$event.stopPropagation()"/>
            <div v-if="socket.type == SOCKET_TYPE.OBJECT" ref="input" class="selfBox">{{$t('logic_editor.self')}}</div>
            <input v-if="socket.type == SOCKET_TYPE.BOOL" ref="input" type="checkbox" :value="socket.value"  @change="valueChanged"/>
        </div>
        <svg
            v-if="!isTrigger"
            ref="socketConnection"
            width="20" height="20"
            class="socket_icon"
            @mousedown="mouseDown"
            @mouseenter="mouseEnter"
            @mouseLeave="mouseLeave">
            <circle v-if="socket.type == SOCKET_TYPE.ANY" cx="10" cy="10" r="6" style="fill: #222222" />
            <polygon v-if="socket.type == SOCKET_TYPE.NUMBER" points="10,3 17,10 10,17 3,10" style="fill: #FFCE52" />
            <rect v-if="socket.type == SOCKET_TYPE.STRING" x="4" y="8" width="12" height="6" style="fill: #5280FF" />
            <rect v-if="socket.type == SOCKET_TYPE.OBJECT" x="4" y="4" width="12" height="12" style="fill: #FF85AE" />
            <polygon v-if="socket.type == SOCKET_TYPE.BOOL" points="3,10 7,4 13,4 17,10 13,16 7,16" style="fill: #FF5555" />
        </svg>
        <svg
            v-if="isTrigger"
            ref="socketConnection"
            width="20"
            height="20"
            class="trigger_icon"
            @mousedown="mouseDown"
            @mouseenter="mouseEnter"
            @mouseleave="mouseLeave">
            <polygon points="3,3 17,10 3,16" :fill="isConnected ? 'white':''" stroke="#444444" stroke-width="2px"/>
        </svg>
    </div>
</template>

<script>
import {SOCKET_TYPE} from '@/common/data_classes/Node_Enums';
import Node_Connection from '@/common/data_classes/Node_Connection';

export default {
    name: 'Socket',
    props: ['socket', 'isInput', 'parentConnections', 'parentId'],
    computed: {
        SOCKET_TYPE(){
            return SOCKET_TYPE;
        },
        isTrigger(){
            return this.socket.type == undefined;
        },
        isConnected(){
            return !!this.parentConnections.find(c => (
                c.startSocketId == this.socket.id && c.startNode.nodeId == this.parentId ||
                c.endSocketId == this.socket.id && c.endNode.nodeId == this.parentId
            ));
        },
        canConnect(){
            return !(this.isConnected && (this.isTrigger ^ this.isInput));
        },
    },
    methods: {
        valueChanged(){
            let rawInputVal = this.$refs.input.value;
            let inputValNum = parseFloat(rawInputVal);

            this.$emit('value-changed', {
                socket: this.socket,
                oldVal: this.socket.value,
                newVal: inputValNum || rawInputVal,
            });
        },
        mouseDown(event){
            let connection = new Node_Connection();

            event.stopPropagation();

            if (this.isInput){
                connection.endSocketId = this.socket.id;
                connection.endSocketEl = this.$refs.socketConnection;
            }
            else{
                connection.startSocketId = this.socket.id;
                connection.startSocketEl = this.$refs.socketConnection;
            }

            connection.type = this.socket.type;
            connection.canConnect = this.canConnect;

            this.$emit('mouse-down', connection);
        },
        mouseEnter(event){
            this.$emit('socket-over', {
                socketData: this.socket,
                isInput: this.isInput,
                canConnect: this.canConnect,
                socketEl: this.$refs.socketConnection,
            });
        },
        mouseLeave(event){
            this.$emit('socket-over', null);
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

.trigger_icon{
    fill: #444444;
    stroke: white;
    stroke-width: 2px;
    stroke-linejoin: round;
}

.trigger_icon:hover{
    filter: brightness(2);
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