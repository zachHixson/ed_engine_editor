<script lang="ts">
export interface iHoverSocket {
    socketData: Core.iAnyObj,
    isInput: boolean,
    canConnect: boolean,
    socketEl: HTMLDivElement,
    node?: Node;
}

export interface iValueChanged {
    socket: any;
    newVal: any;
    oldVal: any;
    node?: Node;
}
</script>

<script setup lang="ts">
import Node_Connection from '@/components/editor_logic/Node_Connection';
import Decorator from '@/components/common/Decorator.vue';
import type Node from './Node';

import { ref, computed, nextTick, onMounted } from 'vue';
import { useAssetBrowserStore } from '@/stores/AssetBrowser';
import Core from '@/core';
import socketAnyIcon from '@/assets/socket_any.svg';
import socketNumberIcon from '@/assets/socket_number.svg';
import socketStringIcon from '@/assets/socket_string.svg';
import socketObjectIcon from '@/assets/socket_object.svg';
import socketBoolIcon from '@/assets/socket_bool.svg';
import type Logic from './Logic';

const assetBrowserStore = useAssetBrowserStore();

const props = defineProps<{
    socket: Core.iEditorNodeInput & {node: Node};
    isInput: boolean;
    parentConnections: Node_Connection[];
    parentId: number;
}>();

const emit = defineEmits(['on-input', 'value-changed', 'mouse-down', 'socket-over']);

const boolCheckboxRef = ref<HTMLInputElement>();
const socketConnectionRef = ref<HTMLDivElement>();
const hasSize = ref(false);

const showLabel = computed(()=>props.socket.id.charAt(0) != '_');
const hideSocket = computed(()=>props.socket.hideSocket);
const hideInput = computed(()=>props.socket.hideInput);
const isTrigger = computed(()=>(props.socket.type == undefined));
const isConnected = computed(()=>(!!props.parentConnections.find(c => (
    c.startSocketId == props.socket.id && c.startNode!.nodeId == props.parentId ||
    c.endSocketId == props.socket.id && c.endNode!.nodeId == props.parentId
)) && !!hasSize));
const canConnect = computed(()=>!(isConnected.value && (isTrigger.value != props.isInput)));
const required = computed(()=>!!props.socket.required);
const iconMap = computed(()=>new Map<Core.Node_Enums.SOCKET_TYPE, string>([
    [Core.Node_Enums.SOCKET_TYPE.ANY, socketAnyIcon],
    [Core.Node_Enums.SOCKET_TYPE.NUMBER, socketNumberIcon],
    [Core.Node_Enums.SOCKET_TYPE.STRING, socketStringIcon],
    [Core.Node_Enums.SOCKET_TYPE.OBJECT, socketObjectIcon],
    [Core.Node_Enums.SOCKET_TYPE.BOOL, socketBoolIcon],
]));
const customStyles = computed(()=>{
    const width = props.socket.node.inputBoxWidth;
    return width ? `width: ${width}rem` : '';
});
const decoratorIconPath = computed(()=>new URL(`../../assets/${props.socket.decoratorIcon}.svg`, import.meta.url).href);

onMounted(()=>{
    props.socket.node.addEventListener('forceSocketUpdate', forceSocketUpdate);

    nextTick(()=>{
        hasSize.value = true;

        if (props.socket.type == Core.Node_Enums.SOCKET_TYPE.BOOL && boolCheckboxRef.value){
            boolCheckboxRef.value.indeterminate = props.socket.value == null;
        }
    });
});

function forceSocketUpdate(): void {
    nextTick(()=>{
        props.socket.value = props.socket.value;
    });
}

function onInput(event: InputEvent): void {
    props.socket.value = (event.target as HTMLInputElement).value;
    emit('on-input', event);
}

function valueChanged(target: HTMLInputElement): void {
    emitValueChanged(target.value);
}

function numValueChanged(target: HTMLInputElement): void {
    let inputValNum = parseFloat(target.value);
    let validated = inputValNum;

    if (isNaN(inputValNum) && props.socket.required){
        validated = parseFloat(props.socket.value);
    }
    
    target.value = validated.toString();
    emitValueChanged(validated);
}

function boolValueChanged(target: HTMLInputElement): void {
    let value: boolean | null = target.checked;

    if (props.socket.triple && props.socket.value){
        value = null;
        target.indeterminate = true;
    }

    if (props.socket.value == null){
        target.checked = false;
        value = false;
    }

    emitValueChanged(value);
}

function emitValueChanged(newVal: any): void {
    emit('value-changed', {
        socket: props.socket,
        oldVal: props.socket.value,
        newVal: newVal,
    });
}

function mouseDown(event: MouseEvent): void {
    const connection = new Node_Connection();

    event.stopPropagation();

    if (props.socket.disabled){
        return;
    }

    if (props.isInput){
        connection.endSocketId = props.socket.id;
        connection.endSocketEl = socketConnectionRef.value!;
    }
    else{
        connection.startSocketId = props.socket.id;
        connection.startSocketEl = socketConnectionRef.value!;
    }

    connection.type = props.socket.type;
    connection.canConnect = canConnect.value;
    connection.graphId = (assetBrowserStore.getSelectedAsset as unknown as Logic).selectedGraphId;

    emit('mouse-down', connection);
}

function mouseEnter(event: MouseEvent): void {
    emit('socket-over', {
        socketData: props.socket,
        isInput: props.isInput,
        canConnect: canConnect.value,
        socketEl: socketConnectionRef.value,
    });
}

function mouseLeave(event: MouseEvent): void {
    emit('socket-over', null);
}

function onTextBlur(event: FocusEvent): void {
    const target = event.target as HTMLInputElement;
    target.selectionStart = target.selectionEnd = 0;
}

function getValue(): any {
    return props.socket.value;
}

defineExpose({socket: props.socket});
</script>

<template>
    <div class="dataSocket" :class="isInput ? 'isInput' : ''">
        <div v-if="socket.enableDecorators" class="decorator-wrapper">
            <Decorator
                v-if="socket.decoratorIcon"
                class="decorator"
                :src="decoratorIconPath"
                :tooltipText="$te(socket.decoratorText!) ? $t(socket.decoratorText!, socket.decoratorTextVars || {}): ''"/>
        </div>
        <div class="name-input-wrapper" :style="isInput && !socket.flipInput ? 'flex-direction: row-reverse;':''">
            <div v-if="showLabel" class="socket_name" :class="socket.hideLabel ? 'invisible':''">
                <div>{{$t('node.' + socket.id)}}</div>
            </div>
            <div v-if="isInput && !isConnected && !hideInput" class="inputBox">
                <input
                    v-if="socket.type == Core.Node_Enums.SOCKET_TYPE.NUMBER"
                    type="number"
                    :style="customStyles"
                    :value="getValue()"
                    @change="numValueChanged($event.target as HTMLInputElement)"
                    @input="onInput($event as InputEvent)"
                    :disabled="socket.disabled"
                    v-input-active/>
                <input
                    v-if="socket.type == Core.Node_Enums.SOCKET_TYPE.STRING"
                    name="textInput"
                    type="text"
                    :style="customStyles"
                    :value="getValue()"
                    @change="valueChanged($event.target as HTMLInputElement)"
                    @input="onInput($event as InputEvent)"
                    @blur="onTextBlur($event as FocusEvent)"
                    :disabled="socket.disabled"
                    v-input-active
                    v-tooltip="socket.disabled && socket.value.length > 8 ? socket.value : ''" />
                <div
                    v-if="socket.type == Core.Node_Enums.SOCKET_TYPE.OBJECT"
                    class="selfBox"
                    :style="customStyles">
                        {{$t('logic_editor.self')}}
                </div>
                <input
                    v-if="socket.type == Core.Node_Enums.SOCKET_TYPE.BOOL"
                    type="checkbox"
                    :style="customStyles"
                    :checked="getValue()"
                    @change="boolValueChanged($event.target as HTMLInputElement)"
                    @input="onInput($event as InputEvent)"
                    :disabled="socket.disabled"
                    ref="boolCheckboxRef"/>
            </div>
        </div>
        <div v-if="socket.type == Core.Node_Enums.SOCKET_TYPE.INFO && socket.value" class="infoBox">
            <div v-html="$t(socket.value.titleId)" class="infoTitle"></div>
            <div>{{$te(socket.value.data) && socket.value.translate ? $t(socket.value.data) : socket.value.data}}</div>
        </div>
        <div
            v-if="!(isTrigger || hideSocket)"
            ref="socketConnectionRef"
            width="20" height="20"
            class="socket_icon"
            :class="socket.disabled ? 'disabled' :''"
            @mousedown="mouseDown"
            @mouseenter="mouseEnter"
            @mouseleave="mouseLeave">
            <img :src="iconMap.get(socket.type)" draggable="false"/>
        </div>
        <div v-if="hideSocket" class="hidden-socket"></div>
        <svg
            v-if="isTrigger"
            ref="socketConnectionRef"
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

.invisible{
    opacity: 0%;
}

.name-input-wrapper{
    display: flex;
    flex-direction: row;
    align-items: center;
    gap: 5px;
}

.socket_name{
    position: relative;
    display: flex;
    flex-direction: row;
    justify-content: center;
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

.inputBox{
    position: relative;
    display: flex;
    flex-direction: row;
    height: 25px;
}

.inputBox > *{
    width: 4rem;
    box-sizing: border-box;
}

.inputBox > *:disabled{
    color: black;
    font-weight: bold;
    background: none;
    border: none;
    text-overflow: ellipsis;
}

.infoBox {
    position: relative;
    display: flex;
    flex-direction: row;
    align-items: center;
    gap: 10px;
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

.decorator-wrapper{
    position: relative;
    display: block;
    width: 25px;
    height: 25px;
}

.decorator{
    width: 25px;
    height: auto;
}
</style>