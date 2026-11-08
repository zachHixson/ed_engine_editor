<script lang="ts">
import type { iEditorNodeInput, iEditorNodeInTrigger, iEditorNodeOutput, iEditorNodeOutTrigger } from '@engine/core/LogicInterfaces';

export type IOSocket = iEditorNodeInput | iEditorNodeOutput;
export type Trigger = iEditorNodeInTrigger | iEditorNodeOutTrigger;
export type Socket = IOSocket | Trigger;

export interface iHoverSocket {
    socketData: Socket,
    isInput: boolean,
    canConnect: boolean,
    socketEl: HTMLDivElement | null,
    node?: Core.iEditorNode;
}

export interface iValueChanged {
    widget?: boolean;
    socket: iEditorNodeInput | null;
    newVal: unknown;
    oldVal: unknown;
    node?: Core.iEditorNode;
}
</script>

<script setup lang="ts">
import Node_Connection from './Node_Connection';
import Svg from '@/components/common/Svg.vue';
import Checkbox from '@/components/common/Checkbox.vue';
import Input from '@/components/common/Input.vue';

import { ref, computed, nextTick, onMounted, onBeforeUnmount } from 'vue';
import { useAssetBrowserStore } from '@/stores/AssetBrowser';
import { useI18nStore } from '@/stores/I18n';
import Core from '@/core';
import socketAnyIcon from '@/assets/socket_any.svg';
import socketNumberIcon from '@/assets/socket_number.svg';
import socketStringIcon from '@/assets/socket_string.svg';
import socketAssetIcon from '@/assets/socket_asset.svg';
import socketInstanceIcon from '@/assets/socket_instance.svg';
import socketBoolIcon from '@/assets/socket_bool.svg';
import socketListIcon from '@/assets/list_icon.svg';
import type Logic from './Logic';
import decoratorMap from '../decoratorMap';

const assetBrowserStore = useAssetBrowserStore();
const { t, te } = useI18nStore();

const props = defineProps<{
    socket: Socket;
    isInput: boolean;
    parentConnections: Core.iNodeConnection[];
    parentId: number;
    desc: string | undefined;
}>();

const emit = defineEmits<{
    onInput: [Core.iNodeInputEvent],
    valueChanged: [iValueChanged],
    mouseDown: [Core.iNodeConnection],
    socketOver: [iHoverSocket | null],
}>();

const boolCheckboxRef = ref<HTMLInputElement>();
const socketConnectionRef = ref<HTMLDivElement>();
const hasSize = ref(false);
const forceRefreshkey = ref(0);
let lastValue: unknown = 0;

const isTrigger = computed(()=>((<IOSocket>props.socket).type == undefined));
const ioSocket = computed(()=>{
    if (isTrigger.value) return null;
    return props.socket as IOSocket;
});
const inSocket = computed(()=>{
    if (ioSocket.value == null || (<iEditorNodeInput>ioSocket.value).value === undefined) return null;
    return ioSocket.value as iEditorNodeInput;
});
const socketType = computed(()=>{
    forceRefreshkey.value;
    if (!ioSocket.value) return null;
    return ioSocket.value.type;
});
const socketValue = computed(()=>{
    forceRefreshkey.value;
    if (!inSocket.value) return null;
    return inSocket.value.value;
});
const showLabel = computed(()=>props.socket.id.charAt(0) != '_');
const hideSocket = computed(()=>{
    forceRefreshkey.value;
    if (!inSocket.value) return null;
    return inSocket.value.hideSocket;
});
const hideInput = computed(()=>{
    forceRefreshkey.value;
    if (!inSocket.value) return null;
    return inSocket.value.hideInput;
});
const isConnected = computed(()=>(!!props.parentConnections.find(c => {
    const connectedInput = c.endNode?.nodeId == props.parentId && c.endSocketId == props.socket.id && props.isInput;
    const connectedOutput = c.startNode?.nodeId == props.parentId && c.startSocketId == props.socket.id && !props.isInput;
    return connectedInput || connectedOutput;
}) && !!hasSize));
const canConnect = computed(()=>!(isConnected.value && (isTrigger.value != props.isInput)));
const optional = computed(()=>{
    if (!inSocket.value) return false;
    return !!inSocket.value.optional;
});
const iconMap = new Map<Core.Node_Enums.SOCKET_TYPE, string>([
    [Core.Node_Enums.SOCKET_TYPE.ANY, socketAnyIcon],
    [Core.Node_Enums.SOCKET_TYPE.NUMBER, socketNumberIcon],
    [Core.Node_Enums.SOCKET_TYPE.STRING, socketStringIcon],
    [Core.Node_Enums.SOCKET_TYPE.ASSET, socketAssetIcon],
    [Core.Node_Enums.SOCKET_TYPE.INSTANCE, socketInstanceIcon],
    [Core.Node_Enums.SOCKET_TYPE.BOOL, socketBoolIcon],
    [Core.Node_Enums.SOCKET_TYPE.TRIPLE, socketBoolIcon],
]);
const socketIcon = computed(()=>{
    const err = `Could not get socket icon of type '${socketType.value},' returning default`;

    if (!socketType.value) {
        console.warn(err);
        return socketAnyIcon;
    }

    const iconGet = iconMap.get(socketType.value);

    if (!iconGet) {
        console.warn(err);
        return socketAnyIcon;
    }

    return iconGet;
});
const customStyles = computed(()=>{
    forceRefreshkey.value;
    const width = props.socket.node.inputBoxWidth;
    return width ? `width: ${width}rem` : '';
});
const decoratorIcon = computed(()=>{
    if (!inSocket.value) return null;
    return inSocket.value.decoratorIcon;
});
const decoratorIconPath = computed(()=>decoratorMap.get(decoratorIcon.value!)!);
const disabled = computed(()=>{
    forceRefreshkey.value;
    if (!ioSocket.value) return null;
    return ioSocket.value.disabled;
});
const tooltip = computed(()=>{
    let out: string[] = [];

    if (ioSocket.value && socketType.value){
        const type = t(`node.${Core.Node_Enums.SOCKET_TYPE[socketType.value]}`) + (ioSocket.value.isList ? ' ' + t('node.list') : '');
        out.push(`<b>${t('node.type')}: </b>` + type);
    }

    if (props.desc){
        out.push(props.desc);
    }

    return out.join('<br /><br />');
});

onMounted(()=>{
    props.socket.node.onForceSocketUpdate.listen(forceSocketUpdate);

    if (inSocket.value) {
        lastValue = inSocket.value.value;
    }

    nextTick(()=>{
        hasSize.value = true;

        if (socketType.value == Core.Node_Enums.SOCKET_TYPE.BOOL && boolCheckboxRef.value){
            boolCheckboxRef.value.indeterminate = socketValue.value == null;
        }
    });
});

onBeforeUnmount(()=>{
    props.socket.node.onForceSocketUpdate.remove(forceSocketUpdate);
});

function forceSocketUpdate(socketId: string | undefined): void {
    if (socketId == props.socket.id || !socketId){
        forceRefreshkey.value++;
    }
}

function onInput(event: Core.iNodeInputEvent): void {
    emit('onInput', event);
}

function emitValueChanged(newVal: unknown): void {
    if (socketType.value == Core.Node_Enums.SOCKET_TYPE.NUMBER && newVal === '') {
        newVal = null;
    }

    emit('valueChanged', {
        socket: props.socket as iEditorNodeInput,
        oldVal: lastValue,
        newVal: newVal,
    });
    lastValue = newVal;
}

function mouseDown(event: MouseEvent): void {
    const connection = new Node_Connection({id: 0});

    event.stopPropagation();

    if (ioSocket.value && ioSocket.value.disabled){
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

    connection.type = socketType.value;
    connection.canConnect = canConnect.value;
    connection.graphId = (assetBrowserStore.getSelectedAsset as unknown as Logic).selectedGraphId;

    emit('mouseDown', connection);
}

function mouseEnter(): void {
    if (!socketConnectionRef.value) return;

    emit('socketOver', {
        socketData: props.socket,
        isInput: props.isInput,
        canConnect: canConnect.value,
        socketEl: socketConnectionRef.value,
    });
}

function mouseLeave(): void {
    emit('socketOver', null);
}

function onTextBlur(event: FocusEvent): void {
    const target = event.target as HTMLInputElement;
    target.selectionStart = target.selectionEnd = 0;
}

defineExpose({socket: props.socket});
</script>

<template>
    <div class="dataSocket" :class="isInput ? 'isInput' : ''">
        <div v-if="inSocket && inSocket.enableDecorators" class="decorator-wrapper">
            <Svg
                v-if="!!decoratorIcon"
                class="decorator"
                :src="decoratorIconPath"
                v-tooltip="te(inSocket!.decoratorText!) ? t(inSocket!.decoratorText!, inSocket.decoratorTextVars || {}): ''"></Svg>
        </div>
        <div class="name-input-wrapper" :style="inSocket && !inSocket.flipInput ? 'flex-direction: row-reverse;':''">
            <div
                name="spaceholders"
                v-if="isInput && isConnected && !hideInput"
                class="inputBox"
                style="opacity: 0%;">
                <div
                    v-if="socketType == Core.Node_Enums.SOCKET_TYPE.INSTANCE && !(<iEditorNodeInput>ioSocket).optional"
                    class="selfBox"
                    :style="customStyles">
                </div>
                <div
                    v-if="socketType == Core.Node_Enums.SOCKET_TYPE.NUMBER || socketType == Core.Node_Enums.SOCKET_TYPE.STRING"
                    class="textField"
                    :style="customStyles">
                </div>
                <div
                    v-if="socketType == Core.Node_Enums.SOCKET_TYPE.BOOL"
                    style="width: 20px"
                    :style="customStyles">
                </div>
            </div>
            <div v-if="showLabel" class="socket_name" :class="(ioSocket as iEditorNodeInput)?.hideLabel ? 'invisible' : '' ">
                <div>{{ socket.id[0] == '#' ? socket.id.substring(1, socket.id.length) : t('node.' + socket.id)}}</div>
            </div>
            <div v-if="isInput && inSocket && !isConnected && !hideInput" class="inputBox">
                <Input
                    v-if="socketType == Core.Node_Enums.SOCKET_TYPE.NUMBER"
                    type="number"
                    ref="numInputRef"
                    class="textField"
                    :style="customStyles"
                    :value="socketValue as number"
                    :optional="optional ?? false"
                    :disabled="disabled ?? false"
                    @change="emitValueChanged($event.value)"
                    @input="onInput($event)" />
                <Input
                    v-if="socketType == Core.Node_Enums.SOCKET_TYPE.STRING"
                    type="text"
                    class="textField"
                    :style="customStyles"
                    :value="socketValue as string"
                    :disabled="disabled == null ? undefined : disabled"
                    @change="emitValueChanged($event.target.value)"
                    @input="onInput($event)"
                    @blur="onTextBlur($event as FocusEvent)"
                    v-input-active
                    v-tooltip="disabled && (inSocket.value as string).length > 8 ? inSocket.value : ''" />
                <div
                    v-if="socketType == Core.Node_Enums.SOCKET_TYPE.INSTANCE && !(<iEditorNodeInput>ioSocket).optional"
                    class="selfBox"
                    :style="customStyles">
                        <div>{{t('logic_editor.self')}}</div>
                </div>
                <Checkbox
                    v-if="socketType == Core.Node_Enums.SOCKET_TYPE.BOOL || socketType == Core.Node_Enums.SOCKET_TYPE.TRIPLE"
                    ref="boolCheckboxRef"
                    :triple="socketType == Core.Node_Enums.SOCKET_TYPE.TRIPLE"
                    style="width: 20px"
                    :value="socketValue != null ? !!socketValue : null"
                    :disabled="disabled == null ? undefined : disabled"
                    @change="emitValueChanged"
                    @input="onInput($event)"></Checkbox>
            </div>
        </div>
        <div
            v-if="!(isTrigger || hideSocket)"
            ref="socketConnectionRef"
            class="socket_icon"
            :class="(disabled ? 'disabled' :'')"
            @mousedown="mouseDown"
            @mouseenter="mouseEnter"
            @mouseleave="mouseLeave"
            v-tooltip="tooltip">
            <Svg
                class="socket_icon_img"
                :class="ioSocket!.isList ? 'socket_icon_img_list':''"
                :src="socketIcon"></Svg>
            <Svg v-if="ioSocket!.isList" class="list_icon_img" :src="socketListIcon"></Svg>
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
            @mouseleave="mouseLeave"
            v-tooltip="tooltip">
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
    position: relative;
    width: 20px;
    height: 20px;
    padding: 2px;
}

.socket_icon_img {
    position: absolute;
    width: 20px;
    height: auto;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
}

.socket_icon:hover:not(.disabled){
    filter: brightness(2);
}

.socket_icon_img_list {
    width: 13px;
}

.list_icon_img {
    position: absolute;
    width: 20px;
    height: 20px;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
}

.inputBox{
    position: relative;
    display: flex;
    flex-direction: row;
    align-items: center;
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

.textField{
    height: 100%;
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
