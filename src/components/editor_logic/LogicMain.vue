<script lang="ts">
export type GenericSocket = {id: string, value: any};
export type ActionMap = Map<Core.LOGIC_ACTION, (data?: any | object, commit?: boolean)=>void>;

export type DomRefs = {
    nodeViewportRef: Ref<HTMLDivElement | undefined>,
    nodeNavRef: Ref<HTMLDivElement | undefined>,
    nodeRefs: Ref<InstanceType<typeof Node>[]>,
    connectionRefs: Ref<InstanceType<typeof Connection>[]>,
}

export type ActionData = {
    actionMap: Map<Core.LOGIC_ACTION, (data?: any | object, commit?: boolean)=>void>,
    revertMap: Map<Core.LOGIC_ACTION, (data?: any | object, commit?: boolean)=>void>,
    hotkeyMap: HotkeyMap,
    undoStore: Undo_Store<iActionStore>,
    undoLength: ComputedRef<number>,
    redoLength: ComputedRef<number>,
}

export type LogicEditorState = {
    showNewVariableWindow: Ref<boolean>,
    variableEditInfo: Ref<Core.iVarInfo | null>,
    variableCallback: Ref<(positive: boolean, varInfo: Core.iVarInfo)=>void>,
    navHotkeyTool: Ref<Core.NAV_TOOL_TYPE | null>,
    selectedNavTool: ComputedRef<Core.NAV_TOOL_TYPE | null>,
    showGraphs: WritableComputedRef<boolean>,
    nodeDraggingEnabled: ComputedRef<boolean>,
    curNavState: ComputedRef<Core.NavState>,
    visibleNodes: ComputedRef<Node_Obj[]>,
    visibleConnections: ComputedRef<Node_Connection[]>,
    selectedNodes: ComputedRef<Node_Obj[]>,
    isDraggingNode: Ref<boolean>,
    draggingConnection: Ref<Node_Connection | null>,
    inputActive: ComputedRef<boolean>,
    mouseDownPos: Core.Vector,
    shiftDown: { value: boolean },
}

export const LogicMainEventBus = {
    onMouseDown: new Core.Event_Emitter<(event: MouseEvent)=>void>(),
    onMouseUp: new Core.Event_Emitter<(event: MouseEvent)=>void>(),
    onMouseMove: new Core.Event_Emitter<(event: MouseEvent)=>void>(),
    onMouseWheel: new Core.Event_Emitter<(event: WheelEvent)=>void>(),
    onMouseEnter: new Core.Event_Emitter<()=>void>(),
    onMouseLeave: new Core.Event_Emitter<(event: MouseEvent)=>void>(),
    onNavSetContainerDimensions: new Core.Event_Emitter<({width, height}: {width: number, height: number})=>void>,
};
</script>

<script setup lang="ts">
import UndoPanel from '@/components/common/UndoPanel.vue';
import NavControlPanel from '@/components/common/NavControlPanel.vue';
import Node from '@/components/editor_logic/node_components/Node.vue';
import type Node_Connection from '@/components/editor_logic/node_components/Node_Connection';
import Connection from '@/components/editor_logic/node_components/Connection.vue';
import HotkeyMap from '@/components/common/HotkeyMap';
import Undo_Store, { type iActionStore, useUndoHelpers } from '@/components/common/Undo_Store';
import DialogVariable from './DialogVariable.vue';
import Svg from '@/components/common/Svg.vue';
import NodeLibrary from './NodeLibrary.vue';
import Graphs from './Graphs.vue';
import ContextMenu from './ContextMenu.vue';

import { ref, reactive, computed, watch, nextTick, onBeforeMount, onMounted, onBeforeUnmount } from 'vue';
import type { Ref, ComputedRef, WritableComputedRef } from 'vue';
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

const connectionForceUpdateQueued = ref(false);
const connectionForceUpdateKey = ref(0);

const emit = defineEmits(['dialog-confirm']);

const domRefs: DomRefs = {
    nodeViewportRef: ref(),
    nodeNavRef: ref(),
    nodeRefs: ref([]),
    connectionRefs: ref<InstanceType<typeof Connection>[]>([]),
}

const actionData: ActionData = {
    actionMap: new Map(),
    revertMap: new Map(),
    hotkeyMap: new HotkeyMap(),
    undoStore: reactive(new Undo_Store<iActionStore>(32, false)) as Undo_Store<iActionStore>,
    undoLength: computed(()=>actionData.undoStore.undoLength),
    redoLength: computed(()=>actionData.undoStore.redoLength),
}

const state: LogicEditorState = {
    showNewVariableWindow: ref(false),
    variableEditInfo: ref(null),
    variableCallback: ref(()=>{}),
    navHotkeyTool: ref(null),
    selectedNavTool: computed(()=>logicEditorStore.getSelectedNavTool),
    showGraphs: computed({
        get(){
            return logicEditorStore.isGraphPanelOpen;
        },
        set(newState){
            logicEditorStore.setGraphPanelState(newState);
        }
    }),
    nodeDraggingEnabled: computed(()=>state.selectedNavTool.value == null),
    curNavState: computed(()=>{
        nextTick(()=>{
            navChange(props.selectedAsset.graphNavState!);
        });
        return props.selectedAsset.graphNavState;
    }),
    visibleNodes: computed(()=>props.selectedAsset.nodes.filter(n => n.graphId == props.selectedAsset.selectedGraphId)),
    visibleConnections: computed(()=>{
        (window as any).cfk = connectionForceUpdateKey.value;
        return props.selectedAsset.connections.filter(n => n.graphId == props.selectedAsset.selectedGraphId)
    }),
    selectedNodes: computed(()=>props.selectedAsset.selectedNodes),
    isDraggingNode: ref(false),
    inputActive: computed(()=>mainStore.getInputActive),
    draggingConnection: ref(null),
    mouseDownPos: new Vector(),
    shiftDown: { value: false },
}

watch(state.inputActive, (newState: boolean)=>actionData.hotkeyMap.enabled = !newState);

watch(()=>props.selectedAsset, ()=>{
    nextTick(()=>{
        relinkConnections();
        navChange(state.curNavState.value!);
        updateNodeBounds();
        actionData.undoStore.clear();
    });
});

watch(state.visibleConnections, ()=>{
    nextTick(()=>relinkConnections());
});

const { stepForward, stepBackward } = useUndoHelpers(actionData.undoStore, actionData.actionMap, actionData.revertMap);

const {
    createConnection,
    dragConnection,
    relinkConnections,
    makeConnection,
    removeConnection,
    removeConnectionList,
    revertMakeConnection,
} = useConnection(
    props,
    domRefs,
    actionData,
    state,
);

const {
    nodeClick,
    nodeDown,
    nodeMoveEnd,
    contentsBounds,
    updateNodeBounds,
    selectAllNodes,
    deselectAllNodes,
    copySelectedToClipboard,
    addNode,
    pasteNodes,
    deleteNodes,
    deleteSelectedNodes,
    moveNodes,
} = useNode(
    props,
    domRefs,
    actionData,
    state,
    clientToNavPos,
);

const {
    currentSocketOver,
    selectionBox,
    selectionBoxRef,
    navToolSelected,
    contextMenuPosition,
} = useInput(
    props,
    domRefs,
    actionData,
    state,
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
        relinkConnections,
        dialogVariable,
        nextTick,
        undoStore: actionData.undoStore,
        actionMap: actionData.actionMap,
        revertMap: actionData.revertMap,
        emit,
    };

    Object.defineProperties(apiExports, {
        selectedNodes: {
            get: ()=>state.selectedNodes.value
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
    actionData.actionMap.set(Core.LOGIC_ACTION.CHANGE_INPUT, actionChangeInput);
    actionData.revertMap.set(Core.LOGIC_ACTION.CHANGE_INPUT, revertChangeInput);
    navChange(props.selectedAsset.graphNavState);
    relinkConnections();
    updateNodeBounds();

    for (let i = 0; i < Core.NODE_LIST.length; i++){
        const registerActions = Core.NODE_LIST[i].registerActions;
        registerActions && registerActions(mainStore.getNodeAPI);
    }
});

onBeforeUnmount(()=>{
    window.removeEventListener('resize', resize);
    mainStore.getNodeAPI.unMount();
    actionData.undoStore.destroy();
});

function bindHotkeys(): void {
    const { hotkeyMap } = actionData;
    hotkeyMap.bindKey(['delete'], deleteSelectedNodes);
    hotkeyMap.bindKey(['backspace'], deleteSelectedNodes);
    hotkeyMap.bindKey(['n'], ()=>{state.showGraphs.value = !state.showGraphs.value});
    hotkeyMap.bindKey(['control', 'a'], selectAllNodes);
}

function navChange(newState: Core.NavState): void {
    const TILE_SIZE = 100;

    const vpEl = domRefs.nodeViewportRef.value!;
    const navEl = domRefs.nodeNavRef.value!;

    //update navWrapper
    navEl.style.left = (newState.offset.x * newState.zoomFac / devicePixelRatio) + 'px';
    navEl.style.top = (newState.offset.y * newState.zoomFac / devicePixelRatio) + 'px';
    navEl.style.transform = 'scale(' + newState.zoomFac + ')';

    //update grid background
    const tileSize = newState.zoomFac * TILE_SIZE;
    const center = new Vector(vpEl.clientWidth, vpEl.clientHeight)
        .divideScalar(2)
        .add(
            newState.offset.clone()
            .multiplyScalar(newState.zoomFac)
        )
        .divideScalar(devicePixelRatio);
    
    vpEl.style.backgroundSize = `${tileSize}px ${tileSize}px`;
    vpEl.style.backgroundPosition = `left ${center.x}px top ${center.y}px`;
}

function clientToNavPos(pos: Core.ConstVector): Core.Vector {
    /*
        - Calculate mouse's viewport position (based on "client space", so that the hierarchy is irrelivent)
        - Calculate the mouse's position in the navWrapper in percentage (EX: x:50%, y:25%)
        - Multiply percentage by viewport dimensions to get mouse position in "nav space" (viewport and
            navWrapper dimensions will always be the same since CSS scale does not change pixel values of width/height)
    */
    const { nodeViewportRef, nodeNavRef } = domRefs;
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
    const { nodeViewportRef } = domRefs;
    const dim = {width: nodeViewportRef.value!.clientWidth, height: nodeViewportRef.value!.clientHeight};
    LogicMainEventBus.onNavSetContainerDimensions.emit(dim);
}

function dialogVariable(callback: (positive: boolean, varInfo: Core.iVarInfo)=>void, edit?: Core.iVarInfo): void {
    state.variableCallback.value = callback;
    state.variableEditInfo.value = edit ?? null;
    state.showNewVariableWindow.value = true;
}

function dialogVariableClose(): void {
    state.variableCallback.value = ()=>{};
    state.variableEditInfo.value = null;
    state.showNewVariableWindow.value = false;
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
    if (state.isDraggingNode.value){
        event.stopPropagation()
        deleteSelectedNodes();
        state.isDraggingNode.value = false;
    }
}

function queueForceConnectionUpdate(): void {
    if (connectionForceUpdateQueued.value) return;

    connectionForceUpdateQueued.value = true;
    nextTick(()=>{
        connectionForceUpdateKey.value++;
        connectionForceUpdateQueued.value = false;
    });
}

function actionChangeInput({socket, widget, oldVal, newVal, node}: ActionChangeInputProps, makeCommit = true): void {
    if (widget){
        node.widgetData = newVal;
    }
    else{
        socket.value = newVal;
    }

    node.onValueChange({
        socketId: widget ? -1 : socket.id,
        widget,
        oldVal,
        newVal
    });

    !(makeCommit || widget) && node.onForceSocketUpdate.emit(socket.id);

    if (makeCommit){
        let data = {socket, widget, oldVal, newVal, node};
        actionData.undoStore.commit({action: Core.LOGIC_ACTION.CHANGE_INPUT, data});
    }
}

function revertChangeInput({socket, widget, oldVal, newVal, node}: ActionChangeInputProps): void {
    if (widget){
        node.widgetData = oldVal;
    }
    else{
        socket.value = oldVal;
        node.onForceSocketUpdate.emit(socket.id);
    }
    
    node.onValueChange({
        socketId: widget ? -1 : socket.id,
        widget,
        newVal,
        oldVal
    });
}
</script>

<template>
    <div class="logicMain">
        <DialogVariable
            v-if="state.showNewVariableWindow.value"
            :selectedAsset="selectedAsset"
            :edit-var-info="state.variableEditInfo.value"
            :callback="state.variableCallback.value"
            @close="dialogVariableClose"/>
        <ContextMenu
            v-if="contextMenuPosition != null"
            :position="contextMenuPosition"
            v-click-outside.any="()=>{contextMenuPosition = null}"
            ref="contextMenuEl"
            @copy="copySelectedToClipboard(); contextMenuPosition = null;"
            @paste="pasteNodes({}); contextMenuPosition = null;"></ContextMenu>
        <div class="node-panel-wrapper">
            <NodeLibrary
                @node-clicked="addNode({templateId: $event})"/>
            <div class="undo-panel-wrapper">
                <UndoPanel
                    class="undo-panel"
                    :undoLength="actionData.undoLength.value"
                    :redoLength="actionData.redoLength.value"
                    @undo="stepBackward"
                    @redo="stepForward"/>
            </div>
        </div>
        <div
            :style="(selectedAsset.selectedGraphId != null) ? '' : 'background: white'"
            :ref="domRefs.nodeViewportRef"
            class="node-viewport">
            <div :ref="domRefs.nodeNavRef" class="node-nav-wrapper">
                <Connection
                    v-for="connection in state.visibleConnections.value"
                    :key="`connection,${selectedAsset.id},${selectedAsset.selectedGraphId},${connection.id}`"
                    :ref="domRefs.connectionRefs"
                    :connectionObj="connection"
                    :clientToNavSpace="clientToNavPos"
                    :navWrapper="($refs.nodeNav as HTMLDivElement)"
                    :allConnections="selectedAsset.connections"
                    :draggingConnection="(state.draggingConnection.value as Node_Connection)"
                    @drag-start="dragConnection"
                    @force-update="queueForceConnectionUpdate"/>
                <Node
                    v-for="node in state.visibleNodes.value"
                    :key="`node,${selectedAsset.id},${selectedAsset.selectedGraphId},${node.nodeId}`"
                    :ref="domRefs.nodeRefs"
                    :nodeObj="node"
                    :clientToNavSpace="clientToNavPos"
                    :canDrag="state.nodeDraggingEnabled.value"
                    :selectedNodes="state.selectedNodes.value"
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
            :class="state.isDraggingNode.value ? 'tras-wrapper-show' : 'trash-wrapper-hide'">
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
                <button class="resizeBtn resizeBtn-left" @click="state.showGraphs.value = !state.showGraphs.value" :style="state.showGraphs.value ? 'transform: translateX(2px);' : ''">
                    <Svg v-show="state.showGraphs.value" :src="arrowIcon" style="transform: rotate(90deg)"></Svg>
                    <Svg v-show="!state.showGraphs.value" :src="hamburgerIcon"></Svg>
                    <div v-if="selectedAsset.graphs.length > 1 && !state.showGraphs.value" class="graph-count-badge">
                        <div>{{ selectedAsset.graphs.length }}</div>
                    </div>
                </button>
            </div>
            <div class="nav-control-wrapper">
                <NavControlPanel
                    ref="navControlPanel"
                    class="nav-control"
                    :navState="state.curNavState.value!"
                    :selectedNavTool="state.selectedNavTool.value"
                    :contentsBounds="contentsBounds"
                    :unitScale="1"
                    :maxZoom="2"
                    :dpi-scale="1"
                    :parent-event-bus="LogicMainEventBus"
                    @navChanged="navChange"
                    @tool-selected="navToolSelected"
                    @set-hotkey-tool="state.navHotkeyTool.value = $event"/>
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

.graph-count-badge{
    position: absolute;
    left: 0;
    top: 0;
    transform: translate(-50%, -50%);
    display: flex;
    justify-content: center;
    align-items: center;
    width: 20px;
    height: 20px;
    border-radius: 50%;
    background: rgb(119, 205, 255);
    border: 2px solid var(--border);
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