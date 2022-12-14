<template>
    <div class="dataSocket" :class="isInput ? 'isInput' : ''">
        <div class="decorator-placeholder"></div>
        <div v-if="showLabel" class="socket_name">
            <div>{{$t('node.' + socket.id)}}</div>
            <Decorator
                v-if="socket.decoratorIcon"
                class="decorator"
                :src="require(`@/assets/${socket.decoratorIcon}.svg`)"
                :tooltipText="$te(socket.decoratorText) ? $t(socket.decoratorText, socket.decoratorTextVars || {}): ''"/>
        </div>
        <div v-if="isInput && !isConnected && !hideInput" class="inputBox">
            <input v-if="socket.type == SOCKET_TYPE.NUMBER" type="number" :value="getValue()" @change="numValueChanged($event.target)" @input="onInput($event)" v-input-active/>
            <input v-if="socket.type == SOCKET_TYPE.STRING" type="text" :value="getValue()"  @change="valueChanged($event.target)" @input="onInput($event)" v-input-active/>
            <div v-if="socket.type == SOCKET_TYPE.OBJECT" class="selfBox">{{$t('logic_editor.self')}}</div>
            <input v-if="socket.type == SOCKET_TYPE.BOOL" type="checkbox" :checked="getValue()"  @change="boolValueChanged($event.target)" @input="onInput($event)" ref="boolCheckbox"/>
        </div>
        <div v-if="socket.type == SOCKET_TYPE.INFO && socket.value" class="infoBox">
            <div v-html="$t(socket.value.titleId)" class="infoTitle"></div>
            <div>{{$te(socket.value.data) && socket.value.translate ? $t(socket.value.data) : socket.value.data}}</div>
            <Decorator
                v-if="socket.decoratorIcon"
                class="decorator"
                :src="require(`@/assets/${socket.decoratorIcon}.svg`)"
                :tooltipText="$te(socket.decoratorText) ? $t(socket.decoratorText, socket.decoratorTextVars || {}): ''"/>
        </div>
        <div
            v-if="!(isTrigger || hideSocket)"
            ref="socketConnection"
            width="20" height="20"
            class="socket_icon"
            :class="socket.disabled ? 'disabled' :''"
            @mousedown="mouseDown"
            @mouseenter="mouseEnter"
            @mouseleave="mouseLeave">
            <img :src="require(`@/${iconMap.get(socket.type)}.svg`)" draggable="false"/>
        </div>
        <div v-if="hideSocket" class="hidden-socket"></div>
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
import Node_Connection from '@/components/editor_logic/Node_Connection';
import DragList from '../common/DragList.vue';
import Decorator from '@/components/common/Decorator';

export default {
    components: { DragList },
    name: 'Socket',
    props: ['socket', 'isInput', 'parentConnections', 'parentId'],
    components: {
        Decorator,
    },
    data(){
        return {
            hasSize: null,
        }
    },
    computed: {
        showLabel(){
            return this.socket.id.charAt(0) != '_';
        },
        SOCKET_TYPE(){
            return Shared.SOCKET_TYPE;
        },
        hideSocket(){
            return this.socket.hideSocket;
        },
        hideInput(){
            return this.socket.hideInput;
        },
        isTrigger(){
            return this.socket.type == undefined;
        },
        isConnected(){
            return !!this.parentConnections.find(c => (
                c.startSocketId == this.socket.id && c.startNode.nodeId == this.parentId ||
                c.endSocketId == this.socket.id && c.endNode.nodeId == this.parentId
            )) && !!this.hasSize;
        },
        canConnect(){
            return !(this.isConnected && (this.isTrigger ^ this.isInput));
        },
        required(){
            return !!this.socket.required;
        },
        iconMap(){
            return new Map([
                [Shared.SOCKET_TYPE.ANY, 'assets/socket_any'],
                [Shared.SOCKET_TYPE.NUMBER, 'assets/socket_number'],
                [Shared.SOCKET_TYPE.STRING, 'assets/socket_string'],
                [Shared.SOCKET_TYPE.OBJECT, 'assets/socket_object'],
                [Shared.SOCKET_TYPE.BOOL, 'assets/socket_bool'],
            ]);
        },
    },
    mounted(){
        this.$nextTick(()=>{
            this.hasSize = true;

            if (this.socket.type == Shared.SOCKET_TYPE.BOOL && this.$refs.boolCheckbox){
                this.$refs.boolCheckbox.indeterminate = this.socket.value == null;
            }
        });
    },
    methods: {
        onInput(event){
            this.socket.value = event.target.value;
            this.$emit('on-input', event);
        },
        valueChanged(target){
            this.emitValueChanged(target.value);
        },
        numValueChanged(target){
            let inputValNum = parseFloat(target.value);
            let validated = inputValNum;

            if (isNaN(inputValNum) && this.socket.required){
                validated = parseFloat(this.socket.value);
            }
            
            target.value = validated;
            this.emitValueChanged(validated);
        },
        boolValueChanged(target){
            let value = target.checked;

            if (this.socket.triple && this.socket.value){
                value = null;
                target.indeterminate = true;
            }

            if (this.socket.value == null){
                target.checked = false;
                value = false;
            }

            this.emitValueChanged(value);
        },
        emitValueChanged(newVal){
            this.$emit('value-changed', {
                socket: this.socket,
                oldVal: this.socket.value,
                newVal: newVal,
            });
        },
        mouseDown(event){
            let connection = new Node_Connection();

            event.stopPropagation();

            if (this.socket.disabled){
                return;
            }

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
            connection.graphId = this.$store.getters['AssetBrowser/getSelectedAsset'].selectedGraphId;

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
        getValue(){
            return this.socket.value;
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

.hidden-socket{
    width: 20px;
    height: 20px;
}

.trigger_icon{
    fill: #444444;
    stroke: white;
    stroke-width: 2px;
    stroke-linejoin: round;
}

.trigger_icon:hover:not(.disabled){
    filter: brightness(2);
}

.disabled{
    opacity: 50%;
}

.socket_name{
    position: relative;
    display: flex;
    flex-direction: row;
    align-items: center;
}

.socket_icon{
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
}

.socket_icon > img {
    width: 20px;
    height: auto;
    padding: 2px;
}

.socket_icon:hover:not(.disabled){
    filter: brightness(2);
}

.inputBox > *{
    width: 4rem;
    margin-right: 3px;
    box-sizing: border-box;
}

.infoBox {
    position: relative;
    display: flex;
    flex-direction: row;
}

.infoBox > * {
    margin-right: 10px;
}

.infoTitle{
    font-weight: bold;
}

.selfBox{
    background: var(--tool-panel-bg);
    filter: brightness(0.7);
    border-radius: 4px;
    text-align: center;
}

input[type="checkbox"]{
    width: min-content;
    padding: 0px;
    margin: 0px;
}

.decorator{
    width: 25px;
    height: auto;
    transform: translateX(5px);
}

.decorator-placeholder{
    display: block;
    width: 25px;
}
</style>