<script lang="ts">
export interface iRelinkInfo {
    id: number;
    inSockets: Map<string, InstanceType<typeof Socket>>;
    outSockets: Map<string, InstanceType<typeof Socket>>;
}
</script>

<script setup lang="ts">
import Socket from './Socket.vue';
import Widget from './Widget.vue';
import Svg from '@/components/common/Svg.vue';

import { ref, reactive, computed, nextTick, onBeforeMount, onMounted, onBeforeUnmount } from 'vue';
import { useI18n } from 'vue-i18n';
import type Node from './Node';
import type Node_Connection from './Node_Connection';
import type { iHoverSocket, iValueChanged } from './Socket.vue';
import decoratorMap from '../decoratorMap';
import categoryStyleMap from '../categoryStyleMap';
import Core from '@/core';

const { t, te } = useI18n();
const { Vector } = Core;

const props = defineProps<{
    nodeObj: Node;
    clientToNavSpace: (pos: Core.Vector)=>Core.Vector;
    canDrag: boolean;
    selectedNodes: Node[];
    allConnections: Node_Connection[];
}>();

const emit = defineEmits([
    'node-down',
    'node-clicked',
    'node-move-end',
    'socket-down',
    'socket-over',
    'socket-value-changed',
]);

const rootRef = ref<HTMLDivElement>();
const inTriggerRefs = ref<InstanceType<typeof Socket>[]>([]);
const outTriggerRefs = ref<InstanceType<typeof Socket>[]>([]);
const inputRefs = ref<InstanceType<typeof Socket>[]>([]);
const outputRefs = ref<InstanceType<typeof Socket>[]>([]);
const nodeObjRef = reactive(props.nodeObj);

const dragOffset = new Vector();
const inTriggerList = ref<Core.iEditorNodeInTrigger[]>([]);
const outTriggerList = ref<{id: string, node: Core.iEditorNode}[]>([]);
const inputList = ref<Core.iEditorNodeInput[]>([]);
const outputList = ref<Core.iEditorNodeOutput[]>([]);
const isDragging = ref(false);
const forceUpdateKey = ref(0);

const widgetData = computed(()=>props.nodeObj.widgetData);
const showTriggers = computed(()=>inTriggerList.value.length > 0 || outTriggerList.value.length > 0);
const showDataSockets = computed(()=>inputList.value.length > 0 || outputList.value.length > 0);
const isSelected = computed(()=>props.selectedNodes.find(nodeObj => nodeObj.nodeId == props.nodeObj.nodeId) != undefined);
const connections = computed(()=>props.allConnections.filter(
    c => (c.startNode?.nodeId == props.nodeObj.nodeId || c.endNode?.nodeId == props.nodeObj.nodeId)
));
const categoryStyle = computed(()=>categoryStyleMap.get(props.nodeObj.template.category) ?? {color: 'gray', icon:null});
const decoratorIconPath = computed(()=>decoratorMap.get(props.nodeObj.decoratorIcon!)!);

onBeforeMount(()=>{
    props.nodeObj.onBeforeMount && props.nodeObj.onBeforeMount();
    updateAllSockets();
});

onMounted(()=>{
    props.nodeObj.setDomRef(rootRef.value!);

    props.nodeObj.addEventListener('onMove', updateConnections);
    props.nodeObj.addEventListener('recalcWidth', updateNodeSize);
    props.nodeObj.addEventListener('force-update', forceUpdate);
    window.addEventListener('mouseup', mouseUp);

    updateNodeSize();
    props.nodeObj.onMount && props.nodeObj.onMount();
});

onBeforeUnmount(()=>{
    window.removeEventListener('mouseup', mouseUp);
    props.nodeObj.removeEventListener('onMove', updateConnections);
    props.nodeObj.removeEventListener('recalcWidth', updateNodeSize);
    props.nodeObj.removeEventListener('force-update', forceUpdate);
    props.nodeObj.onBeforeUnmount && props.nodeObj.onBeforeUnmount();
});

function updateAllSockets(): void {
    updateInTriggerList();
    updateOutTriggerList();
    updateInputlist();
    updateOutputList();
}

function updateInTriggerList(): void {
    inTriggerList.value = Array.from(props.nodeObj.inTriggers, ([id, trigger]) => trigger);
}

function updateOutTriggerList(): void {
    outTriggerList.value = Array.from(props.nodeObj.outTriggers, ([id, trigger]) => trigger);
}

function updateInputlist(): void {
    inputList.value = Array.from(props.nodeObj.inputs, ([id, input]) => input);
}

function updateOutputList(): void {
    outputList.value = Array.from(props.nodeObj.outputs, ([id, output]) => output);
}

function updateNodeSize(): void {
    rootRef.value!.style.width = 'max-content';

    nextTick(()=>{
        rootRef.value!.style.width = rootRef.value!.offsetWidth + 'px';
    });
}

function mouseDown(event: MouseEvent): void {
    if (event.button == 0){
        emit('node-down', props.nodeObj);

        if (props.canDrag){
            const mousePos = new Vector(event.clientX, event.clientY);
            const nodeBounds = rootRef.value!.getBoundingClientRect();
            const nodeOrigin = new Vector(nodeBounds.left + nodeBounds.right, nodeBounds.top + nodeBounds.bottom).divideScalar(2);
            dragOffset.copy(nodeOrigin.clone().subtract(mousePos));
            isDragging.value = true;
        }
    }
}

function mouseUp(): void {
    if (isDragging.value == true){
        emit('node-move-end');
    }

    isDragging.value = false;
}

function setWidgetData(data: Core.iAnyObj, commit = false): void {
    const oldVal = props.nodeObj.widgetData;
    props.nodeObj.widgetData = data;

    if (commit){
        emit('socket-value-changed', {
            widget: true,
            socket: null,
            oldVal,
            newVal: props.nodeObj.widgetData,
            node: props.nodeObj,
        } satisfies iValueChanged);
    }
}

function socketDown(connection: Node_Connection): void {
    const isInput = !connection.startSocketEl;

    if (isInput){
        connection.endNode = props.nodeObj;
    }
    else{
        connection.startNode = props.nodeObj;
    }

    emit('socket-down', connection);
}

function socketOver(event: iHoverSocket): void {
    if (event){
        event.node = props.nodeObj;
    }
    
    emit('socket-over', event);
}

function socketValueChanged(event: iValueChanged): void {
    event.node = props.nodeObj;
    emit('socket-value-changed', event)
}

function onInput(event: InputEvent): void {
    props.nodeObj.onInput && props.nodeObj.onInput(event);
    forceUpdate();
}

function updateConnections(): void {
    for (let i = 0; i < connections.value.length; i++){
        connections.value[i].update();
    }
}

function forceUpdate(): void {
    forceUpdateKey.value++;
}

function getRelinkInfo(): iRelinkInfo {
    const inTriggers = inTriggerRefs.value ?? [];
    const outTriggers = outTriggerRefs.value ?? [];
    const inData = inputRefs.value ?? [];
    const outData = outputRefs.value ?? [];
    const inSocketElMap = new Map();
    const outSocketElMap = new Map();

    inTriggers.forEach(it => inSocketElMap.set(it.socket.id, it));
    inData.forEach(id => inSocketElMap.set(id.socket.id, id));

    outTriggers.forEach(ot => outSocketElMap.set(ot.socket.id, ot));
    outData.forEach(od => outSocketElMap.set(od.socket.id, od));

    return {
        id: props.nodeObj.nodeId,
        inSockets: inSocketElMap,
        outSockets: outSocketElMap,
    }
}

defineExpose({getRelinkInfo});
</script>

<template>
    <div ref="rootRef"
        class="node"
        :style="isSelected ? 'border-color: var(--button-norm)' : ''"
        @click="emit('node-clicked', {nodeObj, event: $event})"
        @mousedown="mouseDown">
        <div class="heading" :style="`border-color: ${categoryStyle.color}`">
            <div v-if="categoryStyle.icon" class="node-icon">
                <Svg :src="categoryStyle.icon"></Svg>
            </div>
            <div>{{t('node.' + nodeObj.templateId)}}</div>
            <div class="decorator-wrapper" :key="forceUpdateKey">
                <Svg
                    v-if="!!nodeObjRef.decoratorIcon"
                    class="decorator"
                    :src="decoratorIconPath"
                    v-tooltip="te(nodeObj.decoratorText!) ? t(nodeObj.decoratorText!, nodeObj.decoratorTextVars || {}): ''"></Svg>
            </div>
        </div>
        <div v-if="!!nodeObj.widget" class="widgetWrapper">
            <Widget
                :widget="nodeObj.widget"
                :widgetData="widgetData"
                :setWidgetData="setWidgetData"
                @input="onInput($event)"/>
        </div>
        <div v-if="showTriggers" class="io">
            <div class="socket-column" style="align-items: flex-start">
                <Socket
                    v-for="inTrigger in inTriggerList"
                    :key="inTrigger.id"
                    ref="inTriggerRefs"
                    :socket="(inTrigger as any)"
                    :isInput="true"
                    :parentConnections="connections"
                    :parentId="nodeObj.nodeId"
                    @mouse-down="socketDown"
                    @socket-over="socketOver"/>
            </div>
            <div class="socket-column" style="align-items: flex-end">
                <Socket
                    v-for="outTrigger in outTriggerList"
                    :key="outTrigger.id"
                    ref="outTriggerRefs"
                    :socket="(outTrigger as any)"
                    :isInput="false"
                    :parentConnections="connections"
                    :parentId="nodeObj.nodeId"
                    @mouse-down="socketDown"
                    @socket-over="socketOver"/>
            </div>
        </div>
        <div v-if="showTriggers && showDataSockets" class="separator"></div>
        <div v-if="showDataSockets" class="io" :style="nodeObj.stackDataIO ? 'flex-direction: column-reverse;':''">
            <div
                class="socket-column" 
                style="align-items: flex-start"
                :style="nodeObj.reverseInputs ? 'flex-direction: column-reverse':''">
                <Socket
                    v-for="input in inputList"
                    :key="input.id"
                    ref="inputRefs"
                    :socket="(input as any)"
                    :isInput="true"
                    :parentConnections="connections"
                    :parentId="nodeObj.nodeId"
                    @mouse-down="socketDown"
                    @socket-over="socketOver"
                    @on-input="onInput"
                    @value-changed="socketValueChanged"/>
            </div>
            <div
                class="socket-column"
                style="align-items: flex-end"
                :style="nodeObj.reverseOutputs ? 'flex-direction: column-reverse':''">
                <Socket
                    v-for="output in outputList"
                    :key="output.id"
                    ref="outputRefs"
                    :socket="(output as any)"
                    :isInput="false"
                    :parentConnections="connections"
                    :parentId="nodeObj.nodeId"
                    @mouse-down="socketDown"
                    @socket-over="socketOver"/>
            </div>
        </div>
    </div>
</template>

<style scoped>
.node{
    display: flex;
    flex-direction: column;
    position: absolute;
    left: 0;
    top: 0;
    width: max-content;
    min-width: 100px;
    transform: translate(-50%, -50%);
    background: var(--tool-panel-bg);
    border: 2px solid var(--border);
    border-radius: var(--corner-radius);
    user-select: none;
    pointer-events: all;
}

.heading{
    display: flex;
    flex-direction: row;
    justify-content: flex-start;
    align-items: center;
    gap: 5px;
    padding-bottom: 5px;
    padding: 5px;
    border-top: 8px solid;
    border-radius:  8px 8px 0 0;
}

.node-icon{
    display: flex;
    justify-content: center;
    align-items: center;
    width: 20px;
    height: 20px;
    flex-shrink: 0;
}

.node-icon > *{
    width: 100%;
    height: 100%;
}

.separator{
    border-bottom: 2px solid #00000033;
}

.io{
    display: flex;
    flex-direction: row;
    justify-content: space-between;
    gap: 10px;
    width: 100%;
    padding-top: 5px;
    padding-bottom: 5px;
}

.socket-column{
    display: flex;
    flex-direction: column;
    align-items: stretch;
    gap: 5px;
}

.decorator-wrapper{
    width: 25px;
    height: 25px;
    margin-left: auto;
}

.decorator{
    width: 25px;
    height: auto;
}

.category-default{
    background: #68ABBD;
}
</style>