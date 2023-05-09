<script lang="ts">
export const LogicMainEventBus = new Core.Event_Bus();
</script>

<script setup lang="ts">
import UndoPanel from '@/components/common/UndoPanel.vue';
import NavControlPanel from '@/components/common/NavControlPanel.vue';
import Node from '@/components/editor_logic/node_components/Node.vue';
import type Node_Connection from '@/components/editor_logic/node_components/Node_Connection';
import Connection from '@/components/editor_logic/node_components/Connection.vue';
import type { GenericSocket } from './composables/sharedTypes';
import HotkeyMap from '@/components/common/HotkeyMap';
import Undo_Store, { type iActionStore, useUndoHelpers } from '@/components/common/Undo_Store';
import DialogNewVariable from './DialogNewVariable.vue';
import Svg from '@/components/common/Svg.vue';
import NodeLibrary from './NodeLibrary.vue';
import Graphs from './Graphs.vue';

import { ref, reactive, computed, watch, nextTick, onBeforeMount, onMounted, onBeforeUnmount } from 'vue';
import type { Ref } from 'vue';
import { useMainStore } from '@/stores/Main';
import { useLogicEditorStore } from '@/stores/LogicEditor';
import type Logic from './node_components/Logic';
import type { default as Node_Obj } from './node_components/Node';
import useConnection from './composables/useConnection';
import useInput from './composables/useInput';
import useNode from './composables/useNode';
import Core from '@/core';

import arrowIcon from '@/assets/arrow_01.svg';
import trashIcon from '@/assets/trash.svg';
import hamburgerIcon from '@/assets/hamburger.svg';

type ActionChangeInputProps = {socket: GenericSocket, widget: boolean, oldVal: any, newVal: any, node: Node_Obj};

const mainStore = useMainStore();
const logicEditorStore = useLogicEditorStore();
const { Vector } = Core;

const props = defineProps<{
    selectedAsset: Logic;
}>();

const emit = defineEmits(['dialog-confirm']);

const nodeViewportRef = ref<HTMLDivElement>();
const nodeNavRef = ref<HTMLDivElement>();

const actionMap = new Map<Core.LOGIC_ACTION, (data?: any | object, commit?: boolean)=>void>();
const revertMap = new Map<Core.LOGIC_ACTION, (data?: any | object, commit?: boolean)=>void>();
const undoStore = reactive(new Undo_Store<iActionStore>(32, false)) as Undo_Store<iActionStore>;
const hotkeyMap = new HotkeyMap();
const showNewVariableWindow = ref(false);
const newVariableCallback = ref<(positive: boolean, varInfo: Core.iNewVarInfo)=>void>(()=>{});
const navHotkeyTool = ref<Core.NAV_TOOL_TYPE | null>(null);

const undoLength = computed(()=>undoStore.undoLength);
const redoLength = computed(()=>undoStore.redoLength);
const selectedNavTool = computed(()=>logicEditorStore.getSelectedNavTool);
const showGraphs = computed({
    get(){
        return logicEditorStore.isGraphPanelOpen;
    },
    set(newState){
        logicEditorStore.setGraphPanelState(newState);
    }
});
const nodeDraggingEnabled = computed(()=>selectedNavTool.value == null);
const curNavState = computed(()=>{
    nextTick(()=>{
        navChange(props.selectedAsset.graphNavState!);
    });
    return props.selectedAsset.graphNavState;
});
const visibleNodes = computed(()=>props.selectedAsset.nodes.filter(n => n.graphId == props.selectedAsset.selectedGraphId));
const visibleConnections = computed(()=>props.selectedAsset.connections.filter(n => n.graphId == props.selectedAsset.selectedGraphId));
const selectedNodes = computed(()=>props.selectedAsset.selectedNodes);
const isDraggingNode = ref(false);
const inputActive = computed(()=>mainStore.getInputActive);

watch(inputActive, (newState: boolean)=>hotkeyMap.enabled = !newState);

watch(()=>props.selectedAsset, ()=>{
    nextTick(()=>{
        relinkConnections();
        navChange(curNavState.value!);
        updateNodeBounds();
        undoStore.clear();
    });
});

const { stepForward, stepBackward } = useUndoHelpers(undoStore, actionMap, revertMap);

const {
    nodeRefs,
    connectionRefs,
    draggingConnection,
    createConnection,
    dragConnection,
    relinkConnections,
    makeConnection,
    removeConnection,
    removeConnectionList,
    revertMakeConnection,
} = useConnection(
    props,
    actionMap,
    revertMap,
    undoStore
);

const {
    nodeClick,
    nodeDown,
    nodeMoveEnd,
    contentsBounds,
    updateNodeBounds,
    selectAllNodes,
    deselectAllNodes,
    addNode,
    deleteNodes,
    deleteSelectedNodes,
    moveNodes,
} = useNode(
    props,
    actionMap,
    revertMap,
    undoStore,
    navHotkeyTool,
    isDraggingNode,
    nodeViewportRef,
    visibleNodes,
    selectedNodes,
    clientToNavPos,
    relinkConnections,
);

const {
    currentSocketOver,
    selectionBox,
    selectionBoxRef,
    navToolSelected,
} = useInput(
    props,
    hotkeyMap,
    nodeViewportRef,
    draggingConnection as Ref<Node_Connection>,
    isDraggingNode,
    inputActive,
    visibleNodes,
    selectedNodes,
    deselectAllNodes,
    clientToNavPos,
    makeConnection,
    removeConnection,
    moveNodes
);

onBeforeMount(()=>{
    const apiExports = {
        addNode,
        deleteNodes,
        revertMakeConnection,
        removeConnectionList,
        dialogNewVariable,
        undoStore,
        emit,
    };

    Object.defineProperties(apiExports, {
        selectedNodes: {
            get: ()=>selectedNodes.value
        },
        selectedAsset: {
            get: ()=>props.selectedAsset
        }
    });

    mainStore.getNodeAPI.setNodeEditorContext(apiExports);
});

onMounted(()=>{
    window.addEventListener('resize', resize);
    
    resize();

    bindHotkeys();
    actionMap.set(Core.LOGIC_ACTION.CHANGE_INPUT, actionChangeInput);
    revertMap.set(Core.LOGIC_ACTION.CHANGE_INPUT, revertChangeInput);
    navChange(props.selectedAsset.graphNavState);
    relinkConnections();
    updateNodeBounds();

    props.selectedAsset.nodes.forEach(node => node.allNodesMounted && node.allNodesMounted());
});

onBeforeUnmount(()=>{
    window.removeEventListener('resize', resize);
    mainStore.getNodeAPI.unMount();
    undoStore.destroy();
});

function bindHotkeys(): void {
    hotkeyMap.bindKey(['delete'], deleteSelectedNodes);
    hotkeyMap.bindKey(['backspace'], deleteSelectedNodes);
    hotkeyMap.bindKey(['n'], ()=>{showGraphs.value = !showGraphs.value});
    hotkeyMap.bindKey(['control', 'a'], selectAllNodes);
}

function navChange(newState: Core.NavState): void {
    const TILE_SIZE = 100;

    const vpEl = nodeViewportRef.value!;
    const navEl = nodeNavRef.value!;

    //update navWrapper
    navEl.style.left = (newState.offset.x * newState.zoomFac) + 'px';
    navEl.style.top = (newState.offset.y * newState.zoomFac) + 'px';
    navEl.style.transform = 'scale(' + newState.zoomFac + ')';

    //update grid background
    const tileSize = newState.zoomFac * TILE_SIZE;
    const center = new Vector(vpEl.clientWidth, vpEl.clientHeight).divideScalar(2);

    center.add(newState.offset.clone().multiplyScalar(newState.zoomFac));
    vpEl.style.backgroundSize = `${tileSize}px ${tileSize}px`;
    vpEl.style.backgroundPosition = `left ${center.x}px top ${center.y}px`;
}

function clientToNavPos(pos: Core.Vector): Core.Vector {
    /*
        - Calculate mouse's viewport position (based on "client space", so that the hierarchy is irrelivent)
        - Calculate the mouse's position in the navWrapper in percentage (EX: x:50%, y:25%)
        - Multiply percentage by viewport dimensions to get mouse position in "nav space" (viewport and
            navWrapper dimensions will always be the same since CSS scale does not change pixel values of width/height)
    */
    const vpBounds = nodeViewportRef.value!.getBoundingClientRect();
    const vpOrigin = new Vector(vpBounds.left, vpBounds.top);
    const vpSize = new Vector(nodeViewportRef.value!.clientWidth, nodeViewportRef.value!.clientHeight);
    const navBounds = nodeNavRef.value!.getBoundingClientRect();
    const navOrigin = new Vector(navBounds.left, navBounds.top).subtract(vpOrigin);
    const navSize = new Vector(navBounds.right - navBounds.left, navBounds.bottom - navBounds.top);
    const offsetPos = pos.clone().subtract(vpOrigin);
    const navPercent = offsetPos.clone().subtract(navOrigin).divide(navSize);
    const nodeNavPos = vpSize.clone().multiply(navPercent);

    return nodeNavPos;
}

function resize(): void {
    const dim = {width: nodeViewportRef.value!.clientWidth, height: nodeViewportRef.value!.clientHeight};
    LogicMainEventBus.emit('nav-set-container-dimensions', dim);
}

function dialogNewVariable(callback: (positive: boolean, varInfo: Core.iNewVarInfo)=>void): void {
    newVariableCallback.value = callback;
    showNewVariableWindow.value = true;
}

function dialogNewVariableClose(): void {
    newVariableCallback.value = ()=>{};
    showNewVariableWindow.value = false;
}

function switchGraph(id: number): void {
    props.selectedAsset.selectedGraphId = id;
    navChange(props.selectedAsset.graphNavState);

    nextTick(()=>{
        deselectAllNodes();
        relinkConnections();
    });
}

function trashMouseUp(event: MouseEvent): void {
    if (isDraggingNode.value){
        event.stopPropagation()
        deleteSelectedNodes();
        isDraggingNode.value = false;
    }
}

function actionChangeInput({socket, widget, oldVal, newVal, node}: ActionChangeInputProps, makeCommit = true): void {
    if (widget){
        node.widgetData = newVal;
    }
    else{
        socket.value = newVal;
    }

    node.onValueChange && node.onValueChange({
        socketId: widget ? -1 : socket.id,
        widget,
        oldVal,
        newVal
    });

    !(makeCommit || widget) && node.emit('force-socket-update', socket.id);

    if (makeCommit){
        let data = {socket, widget, oldVal, newVal, node};
        undoStore.commit({action: Core.LOGIC_ACTION.CHANGE_INPUT, data});
    }
}

function revertChangeInput({socket, widget, oldVal, newVal, node}: ActionChangeInputProps): void {
    if (widget){
        node.widgetData = oldVal;
    }
    else{
        socket.value = oldVal;
        node.emit('force-socket-update', socket.id);
    }
    
    node.onValueChange && node.onValueChange({
        socketId: widget ? -1 : socket.id,
        widget,
        newVal,
        oldVal
    });
}
</script>

<template>
    <div class="logicMain">
        <DialogNewVariable
            v-show="showNewVariableWindow"
            :selectedAsset="selectedAsset"
            :callback="newVariableCallback"
            @close="dialogNewVariableClose"/>
        <div class="node-panel-wrapper">
            <NodeLibrary
                @node-clicked="addNode({templateId: $event})"/>
            <div class="undo-panel-wrapper">
                <UndoPanel
                    class="undo-panel"
                    :undoLength="undoLength"
                    :redoLength="redoLength"
                    @undo="stepBackward"
                    @redo="stepForward"/>
            </div>
        </div>
        <div
            :style="(selectedAsset.selectedGraphId != null) ? '' : 'background: white'"
            ref="nodeViewportRef"
            class="node-viewport">
            <div ref="nodeNavRef" class="node-nav-wrapper">
                <Connection
                    v-for="connection in visibleConnections"
                    :key="`connection,${selectedAsset.id},${selectedAsset.selectedGraphId},${connection.id}`"
                    ref="connectionRefs"
                    :connectionObj="connection"
                    :clientToNavSpace="clientToNavPos"
                    :navWrapper="($refs.nodeNav as HTMLDivElement)"
                    :allConnections="selectedAsset.connections"
                    :draggingConnection="(draggingConnection as Node_Connection)"
                    @drag-start="dragConnection"/>
                <Node
                    v-for="node in visibleNodes"
                    :key="`node,${selectedAsset.id},${selectedAsset.selectedGraphId},${node.nodeId}`"
                    ref="nodeRefs"
                    :nodeObj="node"
                    :clientToNavSpace="clientToNavPos"
                    :canDrag="nodeDraggingEnabled"
                    :selectedNodes="selectedNodes"
                    :allConnections="selectedAsset.connections"
                    class="node"
                    @node-clicked="nodeClick"
                    @node-down="nodeDown"
                    @node-move-end="nodeMoveEnd"
                    @socket-down="createConnection"
                    @socket-over="currentSocketOver = $event"
                    @socket-value-changed="actionChangeInput($event)"/>
            </div>
            <svg class="selection-box-wrapper" width="100%" height="100%">
                <rect
                    v-show="selectionBox.active"
                    ref="selectionBoxRef"
                    :x="selectionBox.origin.x"
                    :y="selectionBox.origin.y"
                    :width="selectionBox.dim.x"
                    :height="selectionBox.dim.y"
                    rx="5px" />
            </svg>
        </div>
        <div
            class="trash-wrapper"
            :class="isDraggingNode ? 'tras-wrapper-show' : 'trash-wrapper-hide'">
            <button
                class="trash-button"
                @mouseup="trashMouseUp">
                <Svg :src="trashIcon"></Svg>
            </button>
        </div>
        <div class="graph-list-wrapper">
            <Graphs
                :selected-asset="selectedAsset"
                @graph-switched="switchGraph($event)"></Graphs>
            <div class="resizeBtn-left-wrapper">
                <button class="resizeBtn resizeBtn-left" @click="showGraphs = !showGraphs" :style="showGraphs ? 'transform: translateX(2px);' : ''">
                    <Svg v-show="showGraphs" :src="arrowIcon" style="transform: rotate(90deg)"></Svg>
                    <Svg v-show="!showGraphs" :src="hamburgerIcon"></Svg>
                </button>
            </div>
            <div class="nav-control-wrapper">
                <NavControlPanel
                    ref="navControlPanel"
                    class="nav-control"
                    :navState="curNavState!"
                    :selectedNavTool="selectedNavTool"
                    :contentsBounds="contentsBounds"
                    :unitScale="1"
                    :maxZoom="2"
                    :dpi-scale="1"
                    :parent-event-bus="LogicMainEventBus"
                    @navChanged="navChange"
                    @tool-selected="navToolSelected"
                    @set-hotkey-tool="navHotkeyTool = $event"/>
            </div>
        </div>
    </div>
</template>

<style scoped>
.logicMain{
    position: relative;
    width: 100%;
    height: 100%;
    overflow: hidden;
}

.logicMain > * {
    user-select: none;
}

.node-panel-wrapper{
    position: absolute;
    top: 0;
    display: flex;
    flex-direction: column;
    justify-content: center;
    height: 100%;
    user-select: none;
}

*:deep(.side-panel){
    display: flex;
    flex-direction: column;
    width: 220px;
    height: 95%;
    background: var(--tool-panel-bg);
    border: 2px solid var(--border);
    overflow: hidden;
    z-index: 1000;
}

*:deep(.side-panel-heading){
    display: flex;
    flex-direction: row;
    justify-content: space-between;
    align-items: center;
    padding: 10px;
    border-bottom: 2px solid var(--border);
}

.node-wrapper{
    display: flex;
    flex-direction: column;
    overflow-y: auto;
}

.graph-list-wrapper{
    position: absolute;
    top: 0;
    right: 0;
    display: flex;
    flex-direction: column;
    justify-content: center;
    height: 100%;
    user-select: none;
}

.resizeBtn-right-wrapper{
    position: absolute;
    right: 0px;
}

.resizeBtn-left-wrapper{
    position: absolute;
    left: 0px;
}

.resizeBtn{
    position: relative;
    width: 30px;
    height: 70px;
    padding: 2px;
    background: var(--tool-panel-bg);
    border: 2px solid var(--border);
    z-index: 1000;
}

.resizeBtn-left{
    right: 100%;
    border-right: none;
    border-radius: var(--corner-radius) 0px 0px var(--corner-radius);
}

.resizeBtn > img{
    width: 100%;
    height: 100%;
}

.node-viewport{
    position: relative;
    width: 100%;
    height: 100%;
    background: white;

    /*Grid background*/
    --grid-col: #FAFAFA;
    background-size: 40px 40px;
    background-image:
        linear-gradient(to right, var(--grid-col) 2px, transparent 1px),
        linear-gradient(to bottom, var(--grid-col) 2px, transparent 1px);
}

.selection-box-wrapper{
    position: absolute;
    left: 0;
    top: 0;
    pointer-events: none;
}

.selection-box-wrapper > *{
    fill: #5588FF55;
    stroke: #5588FF;
}

.trash-wrapper{
    position: absolute;
    bottom: 0px;
    display: flex;
    flex-direction: row;
    justify-content: center;
    width: 100%;
    padding-bottom: 5px;
    pointer-events: none;
    transition: transform 0.1s ease-in-out;
}

.trash-wrapper-show{
    transform: translateY(0%);
}

.trash-wrapper-hide{
    transform: translateY(100%);
}

.trash-button{
    display: flex;
    justify-content: center;
    align-items: center;
    width: 50px;
    height: 50px;
    background: var(--button-norm);
    border: 3px solid var(--border);
    border-radius: var(--corner-radius);
    pointer-events: all;
}

.trash-button:hover{
    background: var(--button-hover);
}

.trash-button > *{
    width: 100%;
    height: 100%;
}

.node-nav-wrapper{
    position: relative;
    left: 0;
    right: 0;
    width: 100%;
    height: 100%;
    pointer-events: none;
}

.fade-out{
    opacity: 1;
    transition: opacity 0.2s ease-out;
}

.undo-panel-wrapper{
    position: absolute;
    top: 0;
    right: 0;
    pointer-events: none;
}

.undo-panel{
    position: relative;
    right: -100%;
    pointer-events: auto;
    z-index: 1000;
}

.nav-control-wrapper{
    position: absolute;
    top: 0;
    left: 0;
    pointer-events: none;
}

.nav-control{
    position: relative;
    left: -100%;
    pointer-events: auto;
    z-index: 1000;
}
</style>