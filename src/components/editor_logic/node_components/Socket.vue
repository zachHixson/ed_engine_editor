<script lang="ts">
export interface iHoverSocket {
    socketData: Core.iAnyObj,
    isInput: boolean,
    canConnect: boolean,
    socketEl: HTMLDivElement,
    node?: Node;
}

export interface iValueChanged {
    widget?: boolean;
    socket: any;
    newVal: any;
    oldVal: any;
    node?: Node;
}
</script>

<script setup lang="ts">
import Node_Connection from './Node_Connection';
import Svg from '@/components/common/Svg.vue';
import type Node from './Node';
import Checkbox from '@/components/common/Checkbox.vue';
import Input from '@/components/common/Input.vue';

import { ref, computed, nextTick, onMounted, onBeforeUnmount } from 'vue';
import { useI18n } from 'vue-i18n';
import { useAssetBrowserStore } from '@/stores/AssetBrowser';
import Core from '@/core';
import socketAnyIcon from '@/assets/socket_any.svg';
import socketNumberIcon from '@/assets/socket_number.svg';
import socketStringIcon from '@/assets/socket_string.svg';
import socketAssetIcon from '@/assets/socket_asset.svg';
import socketInstanceIcon from '@/assets/socket_instance.svg';
import socketBoolIcon from '@/assets/socket_bool.svg';
import type Logic from './Logic';
import decoratorMap from '../decoratorMap';

const { t, te } = useI18n();
const assetBrowserStore = useAssetBrowserStore();

const props = defineProps<{
    socket: Core.iEditorNodeInput & {node: Node};
    isInput: boolean;
    parentConnections: Node_Connection[];
    parentId: number;
}>();

const emit = defineEmits(['on-input', 'value-changed', 'mouse-down', 'socket-over']);

const numInputRef = ref<InstanceType<typeof Input>>();
const boolCheckboxRef = ref<HTMLInputElement>();
const socketConnectionRef = ref<HTMLDivElement>();
const hasSize = ref(false);
const forceRefreshkey = ref(0);
let lastValue: any = 0;

const socketType = computed(()=>{
    forceRefreshkey.value;
    return props.socket.type;
});
const socketValue = computed(()=>{
    forceRefreshkey.value;
    return props.socket.value;
});
const showLabel = computed(()=>props.socket.id.charAt(0) != '_');
const hideSocket = computed(()=>{
    forceRefreshkey.value;
    return props.socket.hideSocket
});
const hideInput = computed(()=>{
    forceRefreshkey.value;
    return props.socket.hideInput
});
const isTrigger = computed(()=>(socketType.value == undefined));
const isConnected = computed(()=>(!!props.parentConnections.find(c => (
    c.startSocketId == props.socket.id && c.startNode!.nodeId == props.parentId ||
    c.endSocketId == props.socket.id && c.endNode!.nodeId == props.parentId
)) && !!hasSize));
const canConnect = computed(()=>!(isConnected.value && (isTrigger.value != props.isInput)));
const required = computed(()=>!!props.socket.required ?? true);
const iconMap = new Map<Core.Node_Enums.SOCKET_TYPE, string>([
    [Core.Node_Enums.SOCKET_TYPE.ANY, socketAnyIcon],
    [Core.Node_Enums.SOCKET_TYPE.NUMBER, socketNumberIcon],
    [Core.Node_Enums.SOCKET_TYPE.STRING, socketStringIcon],
    [Core.Node_Enums.SOCKET_TYPE.ASSET, socketAssetIcon],
    [Core.Node_Enums.SOCKET_TYPE.INSTANCE, socketInstanceIcon],    
    [Core.Node_Enums.SOCKET_TYPE.BOOL, socketBoolIcon],
]);
const socketIcon = computed(()=>iconMap.get(socketType.value)!);
const customStyles = computed(()=>{
    forceRefreshkey.value;
    const width = props.socket.node.inputBoxWidth;
    return width ? `width: ${width}rem` : '';
});
const decoratorIcon = computed(()=>{
    return props.socket.decoratorIcon
});
const decoratorIconPath = computed(()=>decoratorMap.get(decoratorIcon.value!)!);
const disabled = computed(()=>{
    forceRefreshkey.value;
    return props.socket.disabled;
});

onMounted(()=>{
    props.socket.node.addEventListener('force-socket-update', forceSocketUpdate);
    lastValue = props.socket.value;

    nextTick(()=>{
        hasSize.value = true;

        if (props.socket.type == Core.Node_Enums.SOCKET_TYPE.BOOL && boolCheckboxRef.value){
            boolCheckboxRef.value.indeterminate = props.socket.value == null;
        }
    });
});

onBeforeUnmount(()=>{
    props.socket.node.removeEventListener('force-socket-update', forceSocketUpdate);
})

function forceSocketUpdate(socketId: string | undefined): void {
    if (socketId == props.socket.id || !socketId){
        forceRefreshkey.value++;
    }
}

function onInput(event: InputEvent): void {
    emit('on-input', event);
}

function valueChanged(target: HTMLInputElement): void {
    emitValueChanged(target.value);
}

function numValueChanged({value}:{value: number}): void {
    emitValueChanged(value);
}

function boolValueChanged(newVal: boolean | null): void {
    emitValueChanged(newVal);
}

function emitValueChanged(newVal: any): void {
    emit('value-changed', {
        socket: props.socket,
        oldVal: lastValue,
        newVal: newVal,
    });
    lastValue = newVal;
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

function mouseEnter(): void {
    emit('socket-over', {
        socketData: props.socket,
        isInput: props.isInput,
        canConnect: canConnect.value,
        socketEl: socketConnectionRef.value,
    });
}

function mouseLeave(): void {
    emit('socket-over', null);
}

function onTextBlur(event: FocusEvent): void {
    const target = event.target as HTMLInputElement;
    target.selectionStart = target.selectionEnd = 0;
}

defineExpose({socket: props.socket});
</script>

<template>
    <div class="dataSocket" :class="isInput ? 'isInput' : ''">
        <div v-if="socket.enableDecorators" class="decorator-wrapper">
            <Svg
                v-if="!!decoratorIcon"
                class="decorator"
                :src="decoratorIconPath"
                v-tooltip="te(socket.decoratorText!) ? t(socket.decoratorText!, socket.decoratorTextVars || {}): ''"></Svg>
        </div>
        <div class="name-input-wrapper" :style="isInput && !socket.flipInput ? 'flex-direction: row-reverse;':''">
            <div
                name="spaceholders"
                v-if="isInput && isConnected && !hideInput"
                class="inputBox"
                style="opacity: 0%;">
                <div
                    v-if="socketType == Core.Node_Enums.SOCKET_TYPE.INSTANCE && socket.required"
                    class="selfBox"
                    :style="customStyles">
                    <div>{{t('logic_editor.self')}}</div>
                </div>
            </div>
            <div v-if="showLabel" class="socket_name" :class="socket.hideLabel ? 'invisible':''">
                <div>{{t('node.' + socket.id)}}</div>
            </div>
            <div v-if="isInput && !isConnected && !hideInput" class="inputBox">
                <Input
                    v-if="socketType == Core.Node_Enums.SOCKET_TYPE.NUMBER"
                    type="number"
                    ref="numInputRef"
                    :style="customStyles"
                    :value="socketValue"
                    :required="required"
                    :disabled="disabled"
                    @change="numValueChanged"
                    @input="onInput($event as InputEvent)" />
                <Input
                    v-if="socketType == Core.Node_Enums.SOCKET_TYPE.STRING"
                    type="text"
                    :style="customStyles"
                    :value="socketValue"
                    :disabled="disabled"
                    @change="valueChanged($event.target as HTMLInputElement)"
                    @input="onInput($event as InputEvent)"
                    @blur="onTextBlur($event as FocusEvent)"
                    v-input-active
                    v-tooltip="disabled && socket.value.length > 8 ? socket.value : ''" />
                <div
                    v-if="socketType == Core.Node_Enums.SOCKET_TYPE.INSTANCE && socket.required"
                    class="selfBox"
                    :style="customStyles">
                        <div>{{t('logic_editor.self')}}</div>
                </div>
                <Checkbox
                    v-if="socketType == Core.Node_Enums.SOCKET_TYPE.BOOL"
                    ref="boolCheckboxRef"
                    :triple="props.socket.triple"
                    style="width: 20px"
                    :style="customStyles"
                    :value="socketValue"
                    :disabled="disabled"
                    @change="boolValueChanged"
                    @input="onInput($event as InputEvent)"></Checkbox>
            </div>
        </div>
        <div v-if="socketType == Core.Node_Enums.SOCKET_TYPE.INFO && socket.value" class="infoBox">
            <div v-html="t(socket.value.titleId)" class="infoTitle"></div>
            <div>{{te(socket.value.data) && socket.value.translate ? t(socket.value.data) : socket.value.data}}</div>
        </div>
        <div
            v-if="!(isTrigger || hideSocket)"
            ref="socketConnectionRef"
            class="socket_icon"
            :class="disabled ? 'disabled' :''"
            @mousedown="mouseDown"
            @mouseenter="mouseEnter"
            @mouseleave="mouseLeave">
            <Svg class="socket_icon_img" :src="socketIcon"></Svg>
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

.socket_icon_img {
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
    display: flex;
    flex-direction: row;
    justify-content: center;
    align-items: center;
    background: var(--tool-panel-bg);
    filter: brightness(0.7);
    border-radius: 4px;
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