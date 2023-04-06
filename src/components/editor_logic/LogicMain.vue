<script lang="ts">
export const LogicMainEventBus = new Core.Event_Bus();
</script>

<script setup lang="ts">
import UndoPanel from '@/components/common/UndoPanel.vue';
import NavControlPanel from '@/components/common/NavControlPanel.vue';
import DragList, { type iChangeEventProps } from '@/components/common/DragList.vue';
import Node, { type iRelinkInfo } from '@/components/editor_logic/Node.vue';
import Node_Connection from '@/components/editor_logic/Node_Connection';
import Connection from '@/components/editor_logic/Connection.vue';
import type { iHoverSocket } from './Socket.vue';
import HotkeyMap from '@/components/common/HotkeyMap';
import Undo_Store, { type iActionStore, useUndoHelpers } from '@/components/common/Undo_Store';
import DialogNewVariable from './DialogNewVariable.vue';
import Svg from '@/components/common/Svg.vue';

import { ref, reactive, computed, watch, nextTick, onBeforeMount, onMounted, onBeforeUnmount } from 'vue';
import { useMainStore } from '@/stores/Main';
import { useLogicEditorStore } from '@/stores/LogicEditor';
import type Logic from './Logic';
import type { default as Node_Obj } from './Node';
import Core from '@/core';

import magGlassIcon from '@/assets/navigation_magglass.svg';
import arrowIcon from '@/assets/arrow_01.svg';
import eventIcon from '@/assets/event.svg';
import trashIcon from '@/assets/trash.svg';
import plusIcon from '@/assets/plus.svg';
import renameIcon from '@/assets/rename.svg';
import hamburgerIcon from '@/assets/hamburger.svg';

type GenericSocket = {id: string, value: any};
type ActionAddNodeProps = {templateId: string, nodeRef?: Node_Obj};
type ActionDeleteNodesProps = {nodeRefList: Node_Obj[], connectionRefMap?: Map<Logic, Node_Connection[]>};
type ActionMoveNodesProps = {nodeRefList: Node_Obj[], velocity: Core.Vector};
type ActionMakeConnectionProps = {connectionObj: Node_Connection, socketOver: iHoverSocket, prevSocket?: GenericSocket};
type ActionRemoveConnectionProps = {connectionObj: Node_Connection};
type ActionChangeInputProps = {socket: GenericSocket, oldVal: any, newVal: any, node: Node_Obj};

const mainStore = useMainStore();
const logicEditorStore = useLogicEditorStore();
const { Vector } = Core;

const props = defineProps<{
    selectedAsset: Logic;
}>();

const emit = defineEmits(['dialog-confirm']);

const nodeViewportRef = ref<HTMLDivElement>();
const nodeNavRef = ref<HTMLDivElement>();
const nodeRefs = ref<InstanceType<typeof Node>[]>([]);
const connectionRefs = ref<InstanceType<typeof Connection>[]>([]);
const graphListRef = ref<HTMLDivElement>();
const graphRenameRefs: Map<number, HTMLInputElement> = new Map();
const selectionBoxRef = ref<HTMLDivElement>();

const selectedCategory = ref<string | null>(null);
const actionMap = new Map<Core.LOGIC_ACTION, (data?: any | object, commit?: boolean)=>void>();
const revertMap = new Map<Core.LOGIC_ACTION, (data?: any | object, commit?: boolean)=>void>();
const undoStore = reactive(new Undo_Store<iActionStore>(32, false)) as Undo_Store<iActionStore>;
const mouseDownPos = new Vector();
const lastMouseDragPos = new Vector();
const contentsBounds = [0, 0, 0, 0];
const currentSocketOver = ref<iHoverSocket | null>(null);
const isDraggingNode = ref(false);
const draggingConnection = ref<Node_Connection | null>(null);
const hotkeyMap = new HotkeyMap();
const navControlPanelScroll = (event: WheelEvent)=>LogicMainEventBus.emit('mouse-wheel', event);
const selectionBox = reactive({
    active: false,
    origin: new Vector(),
    dim: new Vector(),
});
const shiftDown = ref(false);
const isSearching = ref(false);
const searchQuery = ref('');
const renamingGraph = ref<number | null>(null);
const showNewVariableWindow = ref(false);
const newVariableCallback = ref<(positive: boolean, varInfo: Core.iNewVarInfo)=>void>(()=>{});
const navHotkeyTool = ref<Core.NAV_TOOL_TYPE | null>(null);

const undoLength = computed(()=>undoStore.undoLength);
const redoLength = computed(()=>undoStore.redoLength);
const selectedNavTool = computed(()=>logicEditorStore.getSelectedNavTool);
const showLibrary = computed({
    get(){
        return logicEditorStore.isLibraryPanelOpen;
    },
    set(newState){
        logicEditorStore.setLibraryPanelState(newState);
    }
});
const showGraphs = computed({
    get(){
        return logicEditorStore.isGraphPanelOpen;
    },
    set(newState){
        logicEditorStore.setGraphPanelState(newState);
    }
});
const nodeCategories = computed(()=>{
    const categories: string[] = [];

    for (let i = 0; i < Core.NODE_LIST.length; i++){
        let curNode = Core.NODE_LIST[i];

        if (!categories.includes(curNode.category)){
            categories.push(curNode.category);
        }
    }

    return categories;
});
const filteredNodes = computed(()=>{
    if (isSearching.value){
        if (searchQuery.value.trim().length > 0){
            return Core.NODE_LIST.filter(node => node.id.includes(searchQuery.value.toLowerCase()));
        }

        return Core.NODE_LIST;
    }

    return Core.NODE_LIST.filter(node => node.category == selectedCategory.value);
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
const inputActive = computed(()=>mainStore.getInputActive);
const graphs = computed(()=>props.selectedAsset.graphs);
const graphKeys = computed(()=>props.selectedAsset.graphs.map(graph => graph.id));

watch(()=>props.selectedAsset, ()=>{
    nextTick(()=>{
        relinkConnections();
        navChange(curNavState.value!);
        updateNodeBounds();
        undoStore.clear();
    });
});
watch(inputActive, (newState: boolean)=>hotkeyMap.enabled = !newState);

onBeforeMount(()=>{
    const apiExports = {
        actionAddNode,
        actionDeleteNodes,
        revertMakeConnection,
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
    })

    mainStore.getNodeAPI.setNodeEditorContext(apiExports);
});

onMounted(()=>{
    window.addEventListener('keydown', keyDown);
    window.addEventListener('keyup', keyUp);
    window.addEventListener('mouseup', mouseUp);
    window.addEventListener('resize', resize);
    nodeViewportRef.value!.addEventListener('wheel', navControlPanelScroll);
    nodeViewportRef.value!.addEventListener('mouseenter', mouseEnter);
    nodeViewportRef.value!.addEventListener('mouseleave', mouseLeave);
    resize();

    bindHotkeys();
    bindActions();
    bindReversions();
    navChange(props.selectedAsset.graphNavState);
    relinkConnections();
    updateNodeBounds();

    props.selectedAsset.nodes.forEach(node => node.allNodesMounted && node.allNodesMounted());
});

onBeforeUnmount(()=>{
    window.removeEventListener('keydown', keyDown);
    window.removeEventListener('keyup', keyUp as EventListener);
    window.removeEventListener('mouseup', mouseUp);
    window.removeEventListener('resize', resize);
    nodeViewportRef.value!.removeEventListener('wheel', navControlPanelScroll);
    nodeViewportRef.value!.removeEventListener('mouseenter', mouseEnter);
    nodeViewportRef.value!.removeEventListener('mouseleave', mouseLeave);
    mainStore.getNodeAPI.unMount();
    undoStore.destroy();
});

const { stepForward, stepBackward } = useUndoHelpers(undoStore, actionMap, revertMap);

function bindHotkeys(): void {
    hotkeyMap.bindKey(['delete'], deleteSelectedNodes);
    hotkeyMap.bindKey(['backspace'], deleteSelectedNodes);
    hotkeyMap.bindKey(['t'], ()=>{showLibrary.value = !showLibrary.value});
    hotkeyMap.bindKey(['n'], ()=>{showGraphs.value = !showGraphs.value});
    hotkeyMap.bindKey(['control', 'a'], selectAllNodes);
}

function bindActions(): void {
    actionMap.set(Core.LOGIC_ACTION.ADD_NODE, actionAddNode);
    actionMap.set(Core.LOGIC_ACTION.DELETE_NODES, actionDeleteNodes);
    actionMap.set(Core.LOGIC_ACTION.MOVE, actionMoveNodes);
    actionMap.set(Core.LOGIC_ACTION.CONNECT, actionMakeConnection);
    actionMap.set(Core.LOGIC_ACTION.DISCONNECT, actionRemoveConnection);
    actionMap.set(Core.LOGIC_ACTION.CHANGE_INPUT, actionChangeInput);
}

function bindReversions(): void {
    revertMap.set(Core.LOGIC_ACTION.ADD_NODE, revertAddNode);
    revertMap.set(Core.LOGIC_ACTION.DELETE_NODES, revertDeleteNodes);
    revertMap.set(Core.LOGIC_ACTION.MOVE, revertMoveNodes);
    revertMap.set(Core.LOGIC_ACTION.CONNECT, revertMakeConnection);
    revertMap.set(Core.LOGIC_ACTION.DISCONNECT, revertRemoveConnection);
    revertMap.set(Core.LOGIC_ACTION.CHANGE_INPUT, revertChangeInput);
}

function getNewNodePos(): Core.Vector {
    const vpBounds = nodeViewportRef.value!.getBoundingClientRect();
    const vpUl = new Vector(vpBounds.left, vpBounds.top);
    const vpBr = new Vector(vpBounds.right, vpBounds.bottom);
    const midpoint = vpUl.clone().add(vpBr).divideScalar(2);
    const navPos = clientToNavPos(midpoint);

    for (let i = 0; i < props.selectedAsset.nodes.length; i++){
        let curNode = props.selectedAsset.nodes[i];

        if (curNode.pos.equalTo(navPos)){
            let size = 50;
            let ul = new Vector(-size, -size);
            let br = new Vector(size, size);
            navPos.add(new Vector(0, 0).randomize(ul, br));
        }
    }
    
    return navPos;
}

function mouseClick(event: MouseEvent): void {
    let mouseUpPos = new Vector(event.clientX, event.clientY);

    if (mouseUpPos.equalTo(mouseDownPos)){
        logicEditorStore.selectNavTool(null);
    }

    if (
        event.target == event.currentTarget &&
        !shiftDown.value &&
        mouseUpPos.distanceTo(mouseDownPos) < 5
    ){
        deselectAllNodes();
    }
}

function keyDown(event: KeyboardEvent): void {
    hotkeyMap.keyDown(event);
    if (event.key == 'Shift') shiftDown.value = true;
}

function keyUp(event: KeyboardEvent): void {
    hotkeyMap.keyUp(event);
    if (event.key == 'Shift') shiftDown.value = false;
}

function mouseDown(event: MouseEvent): void {
    mouseDownPos.x = event.clientX;
    mouseDownPos.y = event.clientY;
    lastMouseDragPos.copy(mouseDownPos);
    LogicMainEventBus.emit('mouse-down', event);

    //position selection box
    if (event.button == 0 && event.target == event.currentTarget){
        const vpBounds = nodeViewportRef.value!.getBoundingClientRect();
        const vpOrigin = new Vector(vpBounds.left, vpBounds.top);
        const startPos = new Vector(event.clientX, event.clientY).subtract(vpOrigin);

        selectionBox.active = true;
        selectionBox.origin.copy(startPos);
        selectionBox.dim.zero();
    }
}

function mouseUp(event: MouseEvent): void {
    isDraggingNode.value = false;
    LogicMainEventBus.emit('mouse-up', event);
    selectionBox.active = false;
    selectNodesInBox();

    if (draggingConnection.value){
        const socketOver = currentSocketOver.value as iHoverSocket;
        const connectionObj = draggingConnection.value as Node_Connection;
        const startType = !!connectionObj.startSocketEl ? connectionObj.type : socketOver?.socketData.type;
        const endType = !!connectionObj.startSocketEl ? socketOver?.socketData.type : connectionObj.type;
        const isTrigger = startType == endType && startType == null;
        const typeMatch = isTrigger || Core.canConvertSocket(startType, endType);
        const directionMatch = !!connectionObj.startSocketEl == !!socketOver?.isInput;

        draggingConnection.value = null;

        if (
            socketOver &&
            typeMatch &&
            directionMatch &&
            connectionObj.canConnect &&
            socketOver.canConnect &&
            !socketOver.socketData.disabled
        ){
            const leftNode = ((socketOver.isInput) ? socketOver.node : connectionObj.endNode) as Node_Obj;
            const rightNode = (!(socketOver.isInput) ? socketOver.node : connectionObj.startNode) as Node_Obj;

            if (!checkLoop(leftNode, rightNode)){
                actionMakeConnection({connectionObj, socketOver});
                return;
            }
        }

        actionRemoveConnection({connectionObj});
    }
}

function mouseEnter(event: MouseEvent): void {
    if (!inputActive.value){
        hotkeyMap.mouseEnter();
    }
    LogicMainEventBus.emit('mouse-enter', event);
}

function mouseLeave(event: MouseEvent): void {
    hotkeyMap.mouseLeave();
    LogicMainEventBus.emit('mouse-leave', event);
}

function trashMouseUp(event: MouseEvent): void {
    if (isDraggingNode.value){
        event.stopPropagation()
        deleteSelectedNodes();
        isDraggingNode.value = false;
    }
}

function mouseMove(event: MouseEvent): void {
    const vpBounds = nodeViewportRef.value!.getBoundingClientRect();
    const vpOrigin = new Vector(vpBounds.left, vpBounds.top);
    const newOrigin = new Vector(event.clientX, event.clientY).subtract(vpOrigin);
    const selectionBoxDim = new Vector(event.clientX, event.clientY).subtract(mouseDownPos);

    LogicMainEventBus.emit('mouse-move', event);
    selectionBox.dim.copy(selectionBoxDim);

    //if rectangle dimensions are negative, set origin to mouse position
    if (selectionBoxDim.x < 0){
        selectionBox.origin.x = newOrigin.x;
        selectionBox.dim.x = Math.abs(selectionBox.dim.x);
    }

    if (selectionBoxDim.y < 0){
        selectionBox.origin.y = newOrigin.y;
        selectionBox.dim.y = Math.abs(selectionBox.dim.y);
    }

    //calculate node velocity and move nodes if applicable
    if (isDraggingNode.value){
        const startPos = clientToNavPos(lastMouseDragPos);
        const mousePos = new Vector(event.clientX, event.clientY);
        const mouseNavPos = clientToNavPos(mousePos);
        const velocity = mouseNavPos.subtract(startPos);
        
        actionMoveNodes({nodeRefList: selectedNodes.value, velocity}, false);
        lastMouseDragPos.copy(mousePos);
    }
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

function navToolSelected(newTool: Core.NAV_TOOL_TYPE): void {
    logicEditorStore.selectNavTool(newTool);
}

function addGraph(): void {
    props.selectedAsset.addGraph();

    nextTick(()=>{
        const graphList = graphListRef.value!;

        if (graphList){
            graphList.scrollTop = graphList.scrollHeight - graphList.clientHeight;
        }
    });
}

function switchGraph(id: number): void {
    props.selectedAsset.selectedGraphId = id;
    navChange(props.selectedAsset.graphNavState);

    nextTick(()=>{
        deselectAllNodes();
        relinkConnections();
    });
}

function startRenamingGraph(id: number): void {
    renamingGraph.value = id;
    nextTick(()=>{
        const box = graphRenameRefs.get(id)!;
        box.focus();
        box.select();
    });
}

function stopRenamingGraph(): void {
    renamingGraph.value = null;
}

function deleteGraph(event: MouseEvent, graphId: number): void {
    event.stopPropagation();
    props.selectedAsset.deleteGraph(graphId);
}

function graphOrderChanged(event: iChangeEventProps): void {
    const {itemIdx, newIdx} = event;
    const movedGraph = props.selectedAsset.graphs[itemIdx];
    const shiftForward = itemIdx > newIdx;
    const compFunc: (i: number)=>boolean = shiftForward ? i => i > newIdx : i => i < newIdx;
    const dir = shiftForward ? -1 : 1;

    for (let i = itemIdx; compFunc(i); i += dir){
        props.selectedAsset.graphs[i] = props.selectedAsset.graphs[i + dir];
    }

    props.selectedAsset.graphs[newIdx] = movedGraph;
}

function clientToNavPos(pos: Core.Vector): Core.Vector {
    /*
        - Calculate mouse's viewport position (based on "client space", so that the hierarchy is irrelivent)
        - Calculate the mouse's position in the navWrapper in percentage (IE: x:50%, y:25%)
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

function createConnection(connectionObj: Node_Connection): void {
    props.selectedAsset.addConnection(connectionObj);
    draggingConnection.value = connectionObj;
}

function dragConnection(connectionObj: Node_Connection): void {
    const {startNode, startSocketId, endNode, endSocketId} = connectionObj;

    draggingConnection.value = connectionObj;
    undoStore.cache.set('prev_socket', {startNode, startSocketId, endNode, endSocketId});
}

function relinkConnections(): void {
    const nodeEls = nodeRefs.value;
    const connectionEls = connectionRefs.value;
    const nodeInfo = new Map<number, iRelinkInfo>();

    nodeEls.forEach(nodeEl => {
        const info = nodeEl.getRelinkInfo();
        nodeInfo.set(info.id, info);
    });

    connectionEls?.forEach(connectionEl => connectionEl.relink(nodeInfo));
}

function nodeClick({nodeObj, event}: {nodeObj: Node_Obj, event: MouseEvent}): void {
    const mousePos = new Vector(event.clientX, event.clientY);

    if (mouseDownPos.distanceTo(mousePos) < 2){
        deselectAllNodes();
        selectedNodes.value.push(nodeObj);
    }
}

function nodeDown(node: Node_Obj): void {
    const alreadySelected = !!selectedNodes.value.find(n => n.nodeId == node.nodeId);
    const navHotkeyActive = navHotkeyTool.value != null;
    const navToolSelected = logicEditorStore.getSelectedNavTool != null;

    if (!alreadySelected) {
        if (!shiftDown.value){
            deselectAllNodes();
        }

        selectedNodes.value.push(node);
    }

    if (!(navHotkeyActive || navToolSelected)){
        isDraggingNode.value = true;
    }
}

function nodeMoveEnd(): void {
    actionMoveNodes({nodeRefList: selectedNodes.value, velocity: new Vector()}, true);
    updateNodeBounds();
}

function selectNodesInBox(): void {
    visibleNodes.value.forEach(node => {
        const selectionBounds = selectionBoxRef.value!.getBoundingClientRect();
        const nodeBounds = node.domRef!.getBoundingClientRect();
        const overlapX = selectionBounds.right >= nodeBounds.left && nodeBounds.right >= selectionBounds.left;
        const overlapY = selectionBounds.bottom >= nodeBounds.top && nodeBounds.bottom >= selectionBounds.top;
        const isSelected = selectedNodes.value.find(n => n.nodeId == node.nodeId);

        if (overlapX && overlapY && !isSelected){
            selectedNodes.value.push(node);
        }
    });
}

function updateNodeBounds(): void {
    const nodes = visibleNodes.value;

    if (nodes.length == 0){
        contentsBounds.forEach((i, idx) => contentsBounds[idx] = 0);
        return;
    }

    //calculate client/screen space bounds
    const firstBoundingRect = nodes[0].domRef!.getBoundingClientRect();
    const ul = new Vector(firstBoundingRect.left, firstBoundingRect.top);
    const br = new Vector(firstBoundingRect.right, firstBoundingRect.bottom);
    const vpBounds = nodeViewportRef.value!.getBoundingClientRect();
    const vpSize = new Vector(vpBounds.right - vpBounds.left, vpBounds.bottom - vpBounds.top);
    const vpOrigin = new Vector(vpBounds.left, vpBounds.top);
    const navZoom = props.selectedAsset.graphNavState.zoomFac;
    const navOrigin = props.selectedAsset.graphNavState.offset.clone().multiplyScalar(navZoom);

    for (let i = 1; i < nodes.length; i++){
        const curNodeBounds = nodes[i].domRef!.getBoundingClientRect();
        ul.x = Math.min(ul.x, curNodeBounds.left);
        ul.y = Math.min(ul.y, curNodeBounds.top);
        br.x = Math.max(br.x, curNodeBounds.right);
        br.y = Math.max(br.y, curNodeBounds.bottom);
    }

    //align "world space" origin with center of viewport
    ul.subtract(navOrigin).subtract(vpOrigin).subtract(vpSize.clone().divideScalar(2));
    br.subtract(navOrigin).subtract(vpOrigin).subtract(vpSize.clone().divideScalar(2));
    ul.divideScalar(navZoom);
    br.divideScalar(navZoom);

    //commit result
    contentsBounds[0] = ul.x;
    contentsBounds[1] = -ul.y;
    contentsBounds[2] = br.x;
    contentsBounds[3] = -br.y;
}

function selectAllNodes(): void {
    selectedNodes.value.splice(0);
    selectedNodes.value.push(...props.selectedAsset.nodes);
}

function deselectAllNodes(): void {
    selectedNodes.value.splice(0);
}

function deleteSelectedNodes(): void {
    const protectedNodes: Node_Obj[] = [];
    const deletableNodes = selectedNodes.value.filter(node => {
        if (node.editorCanDelete) return true;

        protectedNodes.push(node);
        return false;
    });

    if (deletableNodes.length){
        actionDeleteNodes({nodeRefList: deletableNodes}, true);
        deselectAllNodes();
    }

    protectedNodes.forEach(node => node.onDeleteStopped && node.onDeleteStopped(protectedNodes));
}

function checkLoop(leftNode: Node_Obj, rightNode: Node_Obj): boolean {
    const connectionMap = new Map();
    const checkedNodes = new Map();
    const connections = props.selectedAsset.connections;

    for (let i = 0; i < connections.length - 1; i++){
        const connection = connections[i];
        const id = connection.startNode?.nodeId + '/' + connection.startSocketId;
        connectionMap.set(id, connection);
    }

    checkedNodes.set(rightNode.nodeId, true);

    return _checkLoop({endNode: leftNode}, connectionMap, checkedNodes);
}

function _checkLoop(connection: {endNode: Node_Obj | null}, connectionMap: Map<string, Node_Connection>, checkedNodes: Map<number, boolean>): boolean {
    const curNode = connection.endNode!;
    const socketArr: {id: string}[] = [];
    let foundLoop = false;

    if (checkedNodes.get(curNode.nodeId)){
        return true;
    }

    checkedNodes.set(curNode.nodeId, true);

    curNode.outTriggers?.forEach(trigger => socketArr.push(trigger));
    curNode.outputs?.forEach(output => socketArr.push(output));

    for (let i = 0; !foundLoop && i < socketArr.length; i++){
        const socket = socketArr[i];
        const connectionPath = curNode.nodeId + '/' + socket.id;
        const nextConnection = connectionMap.get(connectionPath);

        if (nextConnection){
            foundLoop ||= _checkLoop(nextConnection, connectionMap, checkedNodes);
        }
    }

    return !!foundLoop;
}

function dialogNewVariable(callback: (positive: boolean, varInfo: Core.iNewVarInfo)=>void): void {
    newVariableCallback.value = callback;
    showNewVariableWindow.value = true;
}

function dialogNewVariableClose(): void {
    newVariableCallback.value = ()=>{};
    showNewVariableWindow.value = false;
}

function actionAddNode({templateId, nodeRef}: ActionAddNodeProps, makeCommit = true): void {
    const nodeAPI = mainStore.getNodeAPI;
    const pos = getNewNodePos();
    const newNode = props.selectedAsset.addNode(templateId, pos, nodeAPI, nodeRef);

    if (makeCommit){
        const data = {templateId, nodeRef: newNode} satisfies ActionAddNodeProps;
        undoStore.commit({action: Core.LOGIC_ACTION.ADD_NODE, data});
    }

    if (!nodeRef) newNode.onCreate && newNode.onCreate();
}

function actionDeleteNodes({nodeRefList}: ActionDeleteNodesProps, makeCommit = true): void {
    const connectionRefMap: Map<Logic, Node_Connection[]> = new Map();

    nodeRefList.forEach(node => {
        //find and delete connections attached to the node
        const currentConnections: Node_Connection[] = [];
        
        node.parentScript.connections.forEach(connection => {
            const startNodeId = connection.startNode!.nodeId;
            const endNodeId = connection.endNode!.nodeId;

            if (startNodeId == node.nodeId || endNodeId == node.nodeId){
                currentConnections.push(connection);
            }
        });

        currentConnections.forEach(connection => {
            const connectionMapGet = connectionRefMap.get(node.parentScript) ?? [];

            if (!connectionMapGet.length) connectionRefMap.set(node.parentScript, connectionMapGet);
            connectionMapGet.push(connection);
            node.parentScript.removeConnection(connection.id);
            connection.startNode?.onRemoveConnection && connection.startNode?.onRemoveConnection(connection);
            connection.endNode?.onRemoveConnection && connection.endNode?.onRemoveConnection(connection);
        });

        //delete node
        node.onBeforeDelete && node.onBeforeDelete();
        node.parentScript.deleteNode(node);
    });

    if (makeCommit){
        const data = {nodeRefList: [...nodeRefList], connectionRefMap} satisfies ActionDeleteNodesProps;
        undoStore.commit({action: Core.LOGIC_ACTION.DELETE_NODES, data});
    }
}

function actionMoveNodes({nodeRefList, velocity}: ActionMoveNodesProps, makeCommit = true): void {
    if (makeCommit){
        const startVec = undoStore.cache.get('move_start');

        if (startVec){
            const totalVel = nodeRefList[0].pos.clone().subtract(startVec);
            const data = {nodeRefList: [...nodeRefList], velocity: totalVel};

            undoStore.commit({action: Core.LOGIC_ACTION.MOVE, data});
            undoStore.cache.delete('move_start');
        }

        return;
    }

    for (let i = 0; i < nodeRefList.length; i++){
        const curNode = nodeRefList[i];
        const newPos = curNode.pos.clone().add(velocity);

        curNode.setPos(newPos);
    }

    if (!undoStore.cache.get('move_start')){
        undoStore.cache.set('move_start', nodeRefList[0].pos.clone());
    }
}

function actionMakeConnection({connectionObj, socketOver}: ActionMakeConnectionProps, makeCommit = true): void {
    if (socketOver.isInput){
        connectionObj.endNode = socketOver.node!;
        connectionObj.endSocketId = socketOver.socketData.id;
        connectionObj.endSocketEl = socketOver.socketEl;
    }
    else{
        connectionObj.startNode = socketOver.node!;
        connectionObj.startSocketId = socketOver.socketData.id;
        connectionObj.startSocketEl = socketOver.socketEl;
    }

    connectionObj.startNode?.onNewConnection && connectionObj.startNode.onNewConnection(connectionObj);
    connectionObj.endNode?.onNewConnection && connectionObj.endNode.onNewConnection(connectionObj);

    //if connection was removed entirely by a previous undo, we need to recreate
    if (!props.selectedAsset.connections.includes(connectionObj)){
        props.selectedAsset.addConnection(connectionObj);
    }

    //if this is being connected through a redo, then the socketEl reference might be deprecated and needs a relink
    if (!socketOver.socketEl){
        nextTick(()=>{
            relinkConnections();
        })
    }

    if (makeCommit){
        const prevSocket = undoStore.cache.get('prev_socket');
        const socketOverCopy: any = Object.assign({}, socketOver);

        delete socketOverCopy.socketEl;

        const data = {connectionObj, socketOver: socketOverCopy, prevSocket} satisfies ActionMakeConnectionProps;
        undoStore.commit({action: Core.LOGIC_ACTION.CONNECT, data});

        nextTick(()=>{
            connectionObj.update();
        });
    }

    undoStore.cache.delete('prev_socket');
}

function actionRemoveConnection({connectionObj}: ActionRemoveConnectionProps, makeCommit = true): void {
    makeCommit &&= !!(connectionObj.startNode && connectionObj.endNode);

    if (makeCommit){
        let data = {connectionObj: Object.assign(new Node_Connection(), connectionObj)};
        let prevSocket = undoStore.cache.get('prev_socket');

        Object.assign(data.connectionObj, prevSocket);
        undoStore.commit({action: Core.LOGIC_ACTION.DISCONNECT, data});
    }

    props.selectedAsset.removeConnection(connectionObj.id);
    connectionObj.startNode?.onRemoveConnection && connectionObj.startNode?.onRemoveConnection(connectionObj);
    connectionObj.endNode?.onRemoveConnection && connectionObj.endNode?.onRemoveConnection(connectionObj);
}

function actionChangeInput({socket, oldVal, newVal, node}: ActionChangeInputProps, makeCommit = true): void {
    socket.value = newVal;
    !makeCommit && node.emit('force-socket-update', socket.id);

    node.onValueChange && node.onValueChange({
        socketId: socket.id,
        oldVal,
        newVal
    });

    if (makeCommit){
        let data = {socket, oldVal, newVal, node};
        undoStore.commit({action: Core.LOGIC_ACTION.CHANGE_INPUT, data});
    }
}

function revertAddNode({nodeRef}: ActionAddNodeProps): void {
    nodeRef!.onBeforeDelete && nodeRef!.onBeforeDelete();
    props.selectedAsset.deleteNode(nodeRef!);
}

function revertDeleteNodes({nodeRefList, connectionRefMap}: ActionDeleteNodesProps): void {
    const nodeAPI = mainStore.getNodeAPI;

    nodeRefList.forEach(node => {
        node.parentScript.addNode(node.templateId, new Vector(), nodeAPI, node);
    });

    connectionRefMap!.forEach((connectionList, parentScript) => {
        connectionList.forEach(connection => {
            parentScript.addConnection(connection);
            connection.startNode?.onNewConnection && connection.startNode.onNewConnection(connection);
            connection.endNode?.onNewConnection && connection.endNode.onNewConnection(connection);
        });
    });

    nextTick(()=>{
        relinkConnections();
    });
}

function revertMoveNodes({nodeRefList, velocity}: ActionMoveNodesProps): void {
    for (let i = 0; i < nodeRefList.length; i++){
        const curNode = nodeRefList[i];
        const newPos = curNode.pos.clone().subtract(velocity);

        curNode.setPos(newPos);
    }
}

function revertMakeConnection({connectionObj, prevSocket}: ActionMakeConnectionProps): void {
    if (prevSocket){
        Object.assign(connectionObj, prevSocket);
        relinkConnections();
    }
    else{
        props.selectedAsset.removeConnection(connectionObj.id);
    }
}

function revertRemoveConnection({connectionObj}: ActionRemoveConnectionProps): void {
    props.selectedAsset.addConnection(connectionObj);
    
    nextTick(()=>{
        relinkConnections();
    });
}

function revertChangeInput({socket, oldVal, newVal, node}: ActionChangeInputProps): void {
    socket.value = oldVal;
    node.emit('force-socket-update', socket.id);
    node.onValueChange && node.onValueChange({
        socketId: socket.id,
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
            <div v-show="showLibrary" class="side-panel node-panel">
                <div class="side-panel-heading">
                    <div class="fade-out" :style="isSearching ? 'opacity: 0;':''">{{$t('logic_editor.node_panel_heading')}}</div>
                    <div class="search-btn-wrapper" :class="isSearching ? 'search-btn-wrapper-searching':''">
                        <button v-if="isSearching" class="cancel-search-btn" @click="isSearching = false">
                            <Svg style="transform: rotate(-90deg); width: 20px; height: auto;" :src="arrowIcon"></Svg>
                        </button>
                        <button
                            class="search-btn"
                            :class="!isSearching ? 'search-btn-active':''"
                            @click="isSearching = true; searchQuery=''">
                            <Svg style="width: 20px; height: 20px;" :src="magGlassIcon"></Svg>
                        </button>
                        <transition name="grow">
                            <input
                                v-if="isSearching"
                                class="search-box"
                                :class="isSearching ? 'search-box-show':''"
                                v-model="searchQuery"
                                type="text"
                                v-input-active/>
                        </transition>
                    </div>
                </div>
                <div v-if="selectedAsset.selectedGraphId == null">{{$t('logic_editor.node_panel_empty_warning')}}</div>
                <div
                    v-if="selectedAsset.selectedGraphId != null"
                    class="slide-wrapper"
                    :class="selectedCategory || isSearching ? 'slide-wrapper-trans' : ''">
                    <div class="library-column">
                        <div v-if="!isSearching" class="list-item category-back-btn" @click="selectedCategory = null">
                            <Svg v-show="showLibrary" :src="arrowIcon"></Svg>
                        </div>
                        <div
                            v-for="node in filteredNodes"
                            :key="node.id"
                            class="list-item"
                            @click="actionAddNode({templateId: node.id})">
                            {{node.id}}
                        </div>
                    </div>
                    <div class="library-column">
                        <div
                            v-for="(category, idx) in nodeCategories"
                            :key="idx"
                            class="node-category"
                            @click="selectedCategory = category">
                            {{category}}
                        </div>
                    </div>
                </div>
            </div>
            <div class="resizeBtn-right-wrapper">
                <button class="resizeBtn resizeBtn-right" @click="showLibrary = !showLibrary" :style="showLibrary ? 'transform: translateX(-2px);' : ''">
                    <Svg v-show="showLibrary" :src="arrowIcon" style="transform: rotate(-90deg)"></Svg>
                    <Svg v-show="!showLibrary" :src="eventIcon"></Svg>
                </button>
            </div>
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
            class="node-viewport"
            @click="mouseClick"
            @mousedown="mouseDown"
            @mousemove="mouseMove">
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
            <div v-show="showGraphs" class="side-panel graph-list-library">
                <div class="side-panel-heading">
                    <div>{{$t('logic_editor.graph_panel_heading')}}</div>
                    <button class="add-graph-btn" @click="addGraph">
                        <Svg :src="plusIcon"></Svg>
                    </button>
                </div>
                <div ref="graphListRef" class="graph-list">
                    <DragList
                        @order-changed="graphOrderChanged">
                        <div
                            v-for="graph in graphs"
                            class="graph"
                            :class="selectedAsset.selectedGraphId == graph.id ? 'graph-selected' : ''"
                            @click="switchGraph(graph.id)"
                            v-click-outside="stopRenamingGraph">
                            <div class="graph-name">
                                <div
                                    v-show="renamingGraph != graph.id"
                                    class="graph-display-name"
                                    @dblclick="startRenamingGraph(graph.id)">
                                        {{graph.name}}
                                    </div>
                                <div v-show="renamingGraph == graph.id">
                                    <input
                                        :ref="el => graphRenameRefs.set(graph.id, el as HTMLInputElement)"
                                        style="width: 90%" type="text"
                                        v-model="graph.name" v-input-active
                                        @keyup.enter="stopRenamingGraph"/>
                                </div>
                            </div>
                            <div class="graph-controls">
                                <button class="graph-control-btn" @click="startRenamingGraph(graph.id)">
                                    <Svg style="width: 30px; height: auto;" :src="renameIcon"></Svg>
                                </button>
                                <button class="graph-control-btn" @click="deleteGraph($event, graph.id)">
                                    <Svg style="width: 20px; height: auto;" :src="trashIcon"></Svg>
                                </button>
                            </div>
                        </div>
                    </DragList>
                </div>
            </div>
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

.node-panel-wrapper{
    position: absolute;
    top: 0;
    display: flex;
    flex-direction: column;
    justify-content: center;
    height: 100%;
    user-select: none;
}

.side-panel{
    display: flex;
    flex-direction: column;
    width: 220px;
    height: 95%;
    background: var(--tool-panel-bg);
    border: 2px solid var(--border);
    overflow: hidden;
    z-index: 1000;
}

.side-panel-heading{
    display: flex;
    flex-direction: row;
    justify-content: space-between;
    align-items: center;
    padding: 10px;
    border-bottom: 2px solid var(--border);
}

.node-panel{
    min-width: 200px;
    border-left: none;
    border-radius: 0px var(--corner-radius) var(--corner-radius) 0px;
}

.node-wrapper{
    display: flex;
    flex-direction: column;
    overflow-y: auto;
}

.slide-wrapper{
    position: relative;
    display: flex;
    flex-direction: row;
    width: 200%;
    height: 100%;
    right: 100%;
    transition-property: right;
    transition-duration: 100ms;
    transition-timing-function: ease-out;
    overflow: hidden;
}

.slide-wrapper-trans{
    right: 0%;
    transition-property: right;
    transition-duration: 100ms;
    transition-timing-function: ease-out;
}

.library-column{
    display: flex;
    flex-direction: column;
    width: 50%;
    height: 100%;
    overflow-y: auto;
}

.node-category{
    display: flex;
    flex-direction: row;
    justify-content: center;
    align-items: center;
    height: 40px;
    padding-right: 10px;
    margin-right: 10px;
    background: var(--tool-panel-bg);
    border-bottom: 2px solid var(--border);
    border-right: 2px solid var(--border);
}

.node-category:last-child{
    border-radius: 0px 0px var(--corner-radius) 0px;
}

.category-back-btn{
    display: flex;
    flex-direction: row;
    align-self: flex-end;
    width: min-content;
    background: var(--heading) !important;
}

.category-back-btn > *{
    width: 20px;
    transform: rotate(90deg);
}

.node-category:hover{
    filter: brightness(1.1);
}

.open-close-btn{
    display: flex;
    justify-content: center;
    align-items: center;
    width: 30px;
    height: 30px;
    background: var(--button-dark-norm);
    border: 2px solid var(--border);
    border-radius: var(--corner-radius);
}

.open-close-btn:hover{
    background: var(--button-dark-hover);
}

.open-close-btn:active{
    background: var(--button-dark-norm);
}

.list-item{
    display: flex;
    flex-direction: row;
    justify-content: space-between;
    align-items: center;
    margin: 8px;
    margin-bottom: 0;
    padding: 10px;
    background: var(--tool-panel-bg);
    border-radius: var(--corner-radius);
    border: 2px solid var(--border);
    user-select: none;
}

.list-item > div:not(:last-child){
    margin-right: 10px;
}

.list-item:hover{
    filter: brightness(1.1);
}

.list-item > .buttons{
    white-space: nowrap;
}

.search-btn-wrapper{
    position: absolute;
    left: 100%;
    display: flex;
    justify-content: flex-start;
    align-items: center;
    transform: translateX(-130%);
    transition: all 0.3s ease-out;
}

.search-btn-wrapper-searching{
    transform: translateX(0);
    left: 5px;
}

.search-btn{
    flex-direction: row;
    justify-content: center;
    align-items: center;
    width: 2em;
    height: 2em;
    border: none;
    background: var(--tool-panel-bg);
    border-radius: var(--corner-radius);
    overflow: hidden;
}

.search-btn-active:hover{
    filter: brightness(1.2);
}

.search-btn-active:active{
    filter: brightness(0.8);
}

.cancel-search-btn{
    height: 2em;
    background: var(--button-dark-norm);
    border: 2px solid var(--border);
    border-radius: 8px;
}

.cancel-search-btn:hover{
    background: var(--button-dark-hover);
}

.cancel-search-btn:active{
    background: var(--button-dark-down);
}

.search-box{
    margin-left: 5px;
    width: 0%;
    flex-grow: 0;
}

.search-box-show{
    flex-grow: 1;
}

.grow-enter-active, .grow-leave-active{
    transition: all 0.1s ease-out;
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

.graph-list-library{
    min-width: 200px;
    border-right: none;
    border-radius: var(--corner-radius) 0px 0px var(--corner-radius);
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

.resizeBtn-right{
    right: -100%;
    border-left: none;
    border-radius: 0px var(--corner-radius) var(--corner-radius) 0px;
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

.add-graph-btn{
    display: flex;
    justify-content: center;
    align-items: center;
    background: var(--button-dark-norm);
    width: 25px;
    height: 25px;
    border: 2px solid var(--border);
    border-radius: 5px;
}

.add-graph-btn > *{
    width: 25px;
    height: 25px;
}

.add-graph-btn:hover{
    background: var(--button-dark-hover);
}

.add-graph-btn:active{
    background: var(--button-dark-down);
}

.graph-list{
    display: flex;
    flex-direction: column;
    height: 100%;
    padding-top: 5px;
    overflow: hidden;
    overflow-y: auto;
}

.graph{
    display: flex;
    flex-direction: row;
    justify-content: space-between;
    align-items: center;
    height: 50px;
    border: 2px solid gray;
    margin: 5px;
    margin-top: 0;
    box-sizing: border-box;
    border: 2px solid var(--border);
    border-radius: var(--corner-radius);
    background: var(--tool-panel-bg);
}

.graph-selected{
    background: var(--selection);
}

.graph-name{
    display: flex;
    flex-direction: row;
    flex-grow: 1;
    margin-left: 5px;
}

.graph-display-name{
    overflow-x: hidden;
    white-space: nowrap;
    text-overflow: ellipsis;
    width: 7em;
    height: auto;
}

.graph-controls{
    display: flex;
    flex-direction: row;
    justify-content: center;
    align-items: center;
}

.graph-control-btn{
    display: flex;
    flex-direction: row;
    justify-content: center;
    background: none;
    border: none;
}
</style>