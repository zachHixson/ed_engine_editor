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
                            &lt;
                        </button>
                        <button
                            class="search-btn"
                            :class="!isSearching ? 'search-btn-active':''"
                            @click="isSearching = true; searchQuery=''">
                            <img style="width: 20px; height: 20px;" src="@/assets/navigation_magglass.svg" />
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
                            <img v-show="showLibrary" src="@/assets/arrow_01.svg" />
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
                    <img v-show="showLibrary" src="@/assets/arrow_01.svg" style="transform: rotate(-90deg)"/>
                    <img v-show="!showLibrary" src="@/assets/event.svg"/>
                </button>
            </div>
            <div class="undo-panel-wrapper">
                <UndoPanel
                    class="undo-panel"
                    :undoLength="undoStore.undoLength"
                    :redoLength="undoStore.redoLength"
                    @undo="stepBackward"
                    @redo="stepForward"/>
            </div>
        </div>
        <div
            :style="(selectedAsset.selectedGraphId != null) ? '' : 'background: white'"
            ref="nodeVP"
            class="node-viewport"
            @click="mouseClick"
            @mousedown="mouseDown"
            @mousemove="mouseMove">
            <div ref="nodeNav" class="node-nav-wrapper">
                <Connection
                    v-for="connection in visibleConnections"
                    :key="`connection,${selectedAsset.id},${selectedAsset.selectedGraphId},${connection.id}`"
                    ref="connectionEls"
                    :connectionObj="connection"
                    :clientToNavSpace="convertClientToNavPos"
                    :navWrapper="$refs.nodeNav"
                    :allConnections="selectedAsset.connections"
                    :draggingConnection="draggingConnection"
                    @drag-start="dragConnection"/>
                <Node
                    v-for="node in visibleNodes"
                    :key="`node,${selectedAsset.id},${selectedAsset.selectedGraphId},${node.nodeId}`"
                    ref="nodeEls"
                    :nodeObj="node"
                    :clientToNavSpace="convertClientToNavPos"
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
                    ref="selectionBox"
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
                <img src="@/assets/trash.svg" />
            </button>
        </div>
        <div class="graph-list-wrapper">
            <div v-show="showGraphs" class="side-panel graph-list-library">
                <div class="side-panel-heading">
                    <div>{{$t('logic_editor.graph_panel_heading')}}</div>
                    <button class="add-graph-btn" @click="addGraph">
                        <img src="@/assets/plus.svg" />
                    </button>
                </div>
                <div ref="graphList" class="graph-list">
                    <DragList
                        :items="graphs"
                        :keylist="graphKeys"
                        @order-changed="graphOrderChanged">
                        <template #item="{item}">
                            <div
                                class="graph"
                                :class="selectedAsset.selectedGraphId == item.id ? 'graph-selected' : ''"
                                @click="switchGraph(item.id)"
                                v-click-outside="stopRenamingGraph">
                                <div class="graph-name">
                                    <div
                                        v-show="renamingGraph != item.id"
                                        class="graph-display-name"
                                        @dblclick="startRenamingGraph(item.id)">
                                            {{item.name}}
                                        </div>
                                    <div v-show="renamingGraph == item.id">
                                        <input
                                            :ref="`rename_${item.id}`"
                                            style="width: 90%" type="text"
                                            v-model="item.name" v-input-active
                                            @keyup.enter="stopRenamingGraph"/>
                                    </div>
                                </div>
                                <div class="graph-controls">
                                    <button class="graph-control-btn" @click="startRenamingGraph(item.id)">
                                        <img class="graph-icon" src="@/assets/rename.svg" />
                                    </button>
                                    <button class="graph-control-btn" @click="deleteGraph($event, item.id)">
                                        <img class="graph-icon" src="@/assets/trash.svg" />
                                    </button>
                                </div>
                            </div>
                        </template>
                    </DragList>
                </div>
            </div>
            <div class="resizeBtn-left-wrapper">
                <button class="resizeBtn resizeBtn-left" @click="showGraphs = !showGraphs" :style="showGraphs ? 'transform: translateX(2px);' : ''">
                    <img v-show="showGraphs" src="@/assets/arrow_01.svg" style="transform: rotate(90deg)"/>
                    <img v-show="!showGraphs" src="@/assets/hamburger.svg"/>
                </button>
            </div>
            <div class="nav-control-wrapper">
                <NavControlPanel
                    ref="navControlPanel"
                    class="nav-control"
                    :navState="curNavState"
                    :selectedNavTool="selectedNavTool"
                    :contentsBounds="contentsBounds"
                    :unitScale="1"
                    maxZoom="2"
                    @navChanged="navChange"
                    @tool-selected="navToolSelected"/>
            </div>
        </div>
    </div>
</template>

<script>
import UndoPanel from '@/components/common/UndoPanel';
import NavControlPanel from '@/components/common/NavControlPanel';
import DragList from '@/components/common/DragList';
import Node from '@/components/editor_logic/Node.vue';
import Node_Connection from '@/components/editor_logic/Node_Connection';
import Connection from '@/components/editor_logic/Connection';
import HotkeyMap from '@/components/common/HotkeyMap';
import Undo_Store, {UndoHelpers} from '@/components/common/Undo_Store';
import DialogNewVariable from './DialogNewVariable';

export default {
    name: 'LogicEditor',
    props: ['selectedAsset'],
    data(){
        return {
            showAddEventModal: false,
            selectedCategory: null,
            actionMap: new Map(),
            revertMap: new Map(),
            nodeViewportEl: null,
            nodeNavEl: null,
            undoStore: new Undo_Store(32, false),
            mouseDownPos: new Victor(0, 0),
            lastMouseDragPos: new Victor(0, 0),
            contentsBounds: [0, 0, 0, 0],
            convertClientToNavPos: null,
            currentSocketOver: null,
            isDraggingNode: false,
            draggingConnection: null,
            hotkeyMap: new HotkeyMap(),
            selectionBox: {
                active: false,
                origin: new Victor(0, 0),
                dim: new Victor(0, 0),
            },
            shiftDown: false,
            isSearching: false,
            searchQuery: '',
            renamingGraph: null,
            showNewVariableWindow: false,
            newVariableCallback: ()=>{}
        }
    },
    components: {
        UndoPanel,
        NavControlPanel,
        DragList,
        Node,
        Connection,
        DialogNewVariable,
    },
    watch: {
        selectedAsset(){
            this.$nextTick(()=>{
                this.relinkConnections();
                this.navChange(this.curNavState);
                this.updateNodeBounds();
                this.undoStore.clear();
            })
        },
        inputActive(newState){
            this.hotkeyMap.enabled = !newState;
        }
    },
    computed: {
        selectedNavTool(){
            return this.$store.getters['LogicEditor/getSelectedNavTool'];
        },
        showLibrary: {
            get(){
                return this.$store.getters['LogicEditor/isLibraryPanelOpen'];
            },
            set(newState){
                this.$store.dispatch('LogicEditor/setLibraryPanelState', newState);
            },
        },
        showGraphs: {
            get(){
                return this.$store.getters['LogicEditor/isGraphPanelOpen'];
            },
            set(newState){
                this.$store.dispatch('LogicEditor/setGraphPanelState', newState);
            },
        },
        nodeCategories(){
            let categories = [];

            for (let i = 0; i < Shared.NODE_LIST.length; i++){
                let curNode = Shared.NODE_LIST[i];

                if (!categories.includes(curNode.category)){
                    categories.push(curNode.category);
                }
            }

            return categories;
        },
        filteredNodes(){
            if (this.isSearching){
                if (this.searchQuery.trim().length > 0){
                    return Shared.NODE_LIST.filter(node => node.id.includes(this.searchQuery.toLowerCase()));
                }

                return Shared.NODE_LIST;
            }

            return Shared.NODE_LIST.filter(node => node.category == this.selectedCategory);
        },
        nodeDraggingEnabled(){
            return this.selectedNavTool == null;
        },
        curNavState(){
            this.$nextTick(()=>{
                this.navChange(this.selectedAsset.navState);
            });
            return this.selectedAsset.navState;
        },
        visibleNodes(){
            return this.selectedAsset.nodes.filter(n => n.graphId == this.selectedAsset.selectedGraphId);
        },
        visibleConnections(){
            return this.selectedAsset.connections.filter(n => n.graphId == this.selectedAsset.selectedGraphId);
        },
        selectedNodes(){
            return this.selectedAsset.selectedNodes;
        },
        inputActive(){
            return this.$store.getters['getInputActive'];;
        },
        graphs(){
            return this.selectedAsset.graphs;
        },
        graphKeys(){
            return this.selectedAsset.graphs.map(graph => graph.id);
        },
    },
    beforeCreate(){
        this.$store.getters['getNodeAPI'].setNodeEditorContext(this);
    },
    created(){
        this.convertClientToNavPos = this.clientToNavPos.bind(this);
        this.hotkeyDownHandler = this.hotkeyMap.keyDown.bind(this.hotkeyMap);
        this.hotkeyUpHandler = this.hotkeyMap.keyUp.bind(this.hotkeyMap);
    },
    mounted(){
        this.nodeViewportEl = this.$refs.nodeVP;
        this.nodeNavEl = this.$refs.nodeNav;

        window.addEventListener('keydown', this.keyDown);
        window.addEventListener('keyup', this.keyUp);
        window.addEventListener('mouseup', this.mouseUp);
        this.nodeViewportEl.addEventListener('wheel', this.$refs.navControlPanel.scroll);
        this.nodeViewportEl.addEventListener ('mouseenter', this.mouseEnter);
        this.nodeViewportEl.addEventListener ('mouseleave', this.mouseLeave);
        window.addEventListener('resize', this.resize);
        this.resize();

        this.bindHotkeys();
        this.bindActions();
        this.bindReversions();
        this.navChange(this.selectedAsset.navState);
        this.relinkConnections();
        this.updateNodeBounds();

        this.selectedAsset.nodes.forEach(node => node.allNodesMounted());
    },
    beforeDestroy(){
        window.removeEventListener('keydown', this.keyDown);
        window.removeEventListener('keyUp', this.keyUp);
        window.removeEventListener('mouseup', this.mouseUp);
        this.nodeViewportEl.removeEventListener('wheel', this.$refs.navControlPanel.scroll);
        this.nodeViewportEl.removeEventListener('mouseenter', this.$refs.navControlPanel.mouseEnter);
        this.nodeViewportEl.removeEventListener('mouseleave', this.$refs.navControlPanel.mouseLeave);
    },
    methods: {
        ...UndoHelpers,
        bindHotkeys(){
            this.hotkeyMap.bindKey(['delete'], this.deleteSelectedNodes);
            this.hotkeyMap.bindKey(['backspace'], this.deleteSelectedNodes);
            this.hotkeyMap.bindKey(['t'], ()=>{this.showEvents = !this.showEvents});
            this.hotkeyMap.bindKey(['n'], ()=>{this.showLibrary = !this.showLibrary});
            this.hotkeyMap.bindKey(['control', 'a'], this.selectAllNodes);
        },
        bindActions(){
            this.actionMap.set(Shared.LOGIC_ACTION.ADD_NODE, this.actionAddNode);
            this.actionMap.set(Shared.LOGIC_ACTION.DELETE_NODES, this.actionDeleteNodes);
            this.actionMap.set(Shared.LOGIC_ACTION.MOVE, this.actionMoveNodes);
            this.actionMap.set(Shared.LOGIC_ACTION.CONNECT, this.actionMakeConnection);
            this.actionMap.set(Shared.LOGIC_ACTION.DISCONNECT, this.actionRemoveConnection);
            this.actionMap.set(Shared.LOGIC_ACTION.CHANGE_INPUT, this.actionChangeInput);
        },
        bindReversions(){
            this.revertMap.set(Shared.LOGIC_ACTION.ADD_NODE, this.revertAddNode);
            this.revertMap.set(Shared.LOGIC_ACTION.DELETE_NODES, this.revertDeleteNodes);
            this.revertMap.set(Shared.LOGIC_ACTION.MOVE, this.revertMoveNodes);
            this.revertMap.set(Shared.LOGIC_ACTION.CONNECT, this.revertMakeConnection);
            this.revertMap.set(Shared.LOGIC_ACTION.DISCONNECT, this.revertRemoveConnection);
            this.revertMap.set(Shared.LOGIC_ACTION.CHANGE_INPUT, this.revertChangeInput);
        },
        getNewNodePos(){
            let vpBounds = this.nodeViewportEl.getBoundingClientRect();
            let vpUl = new Victor(vpBounds.left, vpBounds.top);
            let vpBr = new Victor(vpBounds.right, vpBounds.bottom);
            let midpoint = vpUl.clone().add(vpBr).divideScalar(2);
            let navPos = this.convertClientToNavPos(midpoint);

            for (let i = 0; i < this.selectedAsset.nodes.length; i++){
                let curNode = this.selectedAsset.nodes[i];

                if (curNode.pos.isEqualTo(navPos)){
                    let size = 50;
                    let ul = new Victor(-size, -size);
                    let br = new Victor(size, size);
                    navPos.add(new Victor(0, 0).randomize(ul, br));
                }
            }
            
            return navPos;
        },
        mouseClick(jsEvent){
            let mouseUpPos = new Victor(jsEvent.clientX, jsEvent.clientY);

            if (mouseUpPos.isEqualTo(this.mouseDownPos)){
                this.$store.dispatch('LogicEditor/selectNavTool', null);
            }

            if (
                jsEvent.target == jsEvent.currentTarget &&
                !this.shiftDown &&
                mouseUpPos.distance(this.mouseDownPos) < 5
            ){
                this.deselectAllNodes();
            }
        },
        keyDown(jsEvent){
            this.hotkeyMap.keyDown(jsEvent);
            if (jsEvent.key == 'Shift') this.shiftDown = true;
        },
        keyUp(jsEvent){
            this.hotkeyMap.keyUp(jsEvent);
            if (jsEvent.key == 'Shift') this.shiftDown = false;
        },
        mouseDown(jsEvent){
            this.mouseDownPos.x = jsEvent.clientX;
            this.mouseDownPos.y = jsEvent.clientY;
            this.lastMouseDragPos.copy(this.mouseDownPos);
            this.$refs.navControlPanel.mouseDown(jsEvent);

            //position selection box
            if (jsEvent.which == 1 && jsEvent.target == jsEvent.currentTarget){
                let vpBounds = this.nodeViewportEl.getBoundingClientRect();
                let vpOrigin = new Victor(vpBounds.left, vpBounds.top);
                let startPos = new Victor(jsEvent.clientX, jsEvent.clientY).subtract(vpOrigin);

                this.selectionBox.active = true;
                this.selectionBox.origin.copy(startPos);
                this.selectionBox.dim.zero();
            }
        },
        mouseUp(jsEvent){
            this.isDraggingNode = false;
            this.$refs.navControlPanel.mouseUp(jsEvent);
            this.selectionBox.active = false;
            this.selectNodesInBox();

            if (this.draggingConnection){
                const socketOver = this.currentSocketOver;
                const connectionObj = this.draggingConnection;
                const startType = !!connectionObj.startSocketEl ? connectionObj.type : socketOver?.socketData.type;
                const endType = !!connectionObj.startSocketEl ? socketOver?.socketData.type : connectionObj.type;
                const isTrigger = startType == endType && startType == null;
                const typeMatch = isTrigger || Shared.canConvertSocket(startType, endType);
                const directionMatch = !!connectionObj.startSocketEl == !!socketOver?.isInput;

                this.draggingConnection = null;

                if (
                    socketOver &&
                    typeMatch &&
                    directionMatch &&
                    connectionObj.canConnect &&
                    socketOver.canConnect &&
                    !socketOver.socketData.disabled
                ){
                    let leftNode = (socketOver.isInput) ? socketOver.node : connectionObj.endNode;
                    let rightNode = !(socketOver.isInput) ? socketOver.node : connectionObj.startNode;

                    if (!this.checkLoop(leftNode, rightNode)){
                        this.actionMakeConnection({connectionObj, socketOver});
                        return;
                    }
                }

                this.actionRemoveConnection({connectionObj});
            }
        },
        mouseEnter(jsEvent){
            if (!this.inputActive){
                this.hotkeyMap.mouseEnter();
            }
            this.$refs.navControlPanel.mouseEnter(jsEvent);
        },
        mouseLeave(jsEvent){
            this.hotkeyMap.mouseLeave();
            this.$refs.navControlPanel.mouseLeave(jsEvent);
        },
        trashMouseUp(jsEvent){
            if (this.isDraggingNode){
                jsEvent.stopPropagation()
                this.deleteSelectedNodes();
                this.isDraggingNode = false;
            }
        },
        mouseMove(jsEvent){
            let vpBounds = this.nodeViewportEl.getBoundingClientRect();
            let vpOrigin = new Victor(vpBounds.left, vpBounds.top);
            let newOrigin = new Victor(jsEvent.clientX, jsEvent.clientY).subtract(vpOrigin);
            let selectionBoxDim = new Victor(jsEvent.clientX, jsEvent.clientY).subtract(this.mouseDownPos);

            this.$refs.navControlPanel.mouseMove(jsEvent);
            this.selectionBox.dim.copy(selectionBoxDim);

            //if rectangle dimensions are negative, set origin to mouse position
            if (selectionBoxDim.x < 0){
                this.selectionBox.origin.x = newOrigin.x;
                this.selectionBox.dim.x = Math.abs(this.selectionBox.dim.x);
            }

            if (selectionBoxDim.y < 0){
                this.selectionBox.origin.y = newOrigin.y;
                this.selectionBox.dim.y = Math.abs(this.selectionBox.dim.y);
            }

            //calculate node velocity and move nodes if applicable
            if (this.isDraggingNode){
                let startPos = this.clientToNavPos(this.lastMouseDragPos);
                let mousePos = new Victor(jsEvent.clientX, jsEvent.clientY);
                let mouseNavPos = this.clientToNavPos(mousePos);
                let velocity = mouseNavPos.subtract(startPos);
                
                this.actionMoveNodes({nodeRefList: this.selectedNodes, velocity}, false);
                this.lastMouseDragPos.copy(mousePos);
            }
        },
        navChange(newState){
            const TILE_SIZE = 100;

            let vpEl = this.nodeViewportEl;
            let navEl = this.nodeNavEl;

            //update navWrapper
            navEl.style.left = (newState.offset.x * newState.zoomFac) + 'px';
            navEl.style.top = (newState.offset.y * newState.zoomFac) + 'px';
            navEl.style.transform = 'scale(' + newState.zoomFac + ')';

            //update grid background
            let tileSize = newState.zoomFac * TILE_SIZE;
            let center = new Victor(vpEl.clientWidth, vpEl.clientHeight).divideScalar(2);

            center.add(newState.offset.clone().multiplyScalar(newState.zoomFac));
            this.nodeViewportEl.style.backgroundSize = `${tileSize}px ${tileSize}px`;
            this.nodeViewportEl.style.backgroundPosition = `left ${center.x}px top ${center.y}px`;
        },
        navToolSelected(newTool){
            this.$store.dispatch('LogicEditor/selectNavTool', newTool);
        },
        addGraph(){
            this.selectedAsset.addGraph();

            this.$nextTick(()=>{
                const graphList = this.$refs.graphList;

                if (graphList){
                    graphList.scrollTop = graphList.scrollHeight - graphList.clientHeight;
                }
            });
        },
        switchGraph(id){
            this.selectedAsset.selectedGraphId = id;
            this.navChange(this.selectedAsset.navState);

            this.$nextTick(()=>{
                this.deselectAllNodes();
                this.relinkConnections();
            });
        },
        startRenamingGraph(id){
            this.renamingGraph = id;
            this.$nextTick(()=>{
                const box = this.$refs[`rename_${id}`][0];
                box.focus();
                box.select();
            });
        },
        stopRenamingGraph(){
            this.renamingGraph = null;
        },
        deleteGraph(jsEvent, graphId){
            jsEvent.stopPropagation();
            this.selectedAsset.deleteGraph(graphId);
        },
        graphOrderChanged(event){
            const {itemIdx, newIdx} = event;
            const movedGraph = this.selectedAsset.graphs[itemIdx];
            const shiftForward = itemIdx > newIdx;
            const compFunc = shiftForward ? i => i > newIdx : i => i < newIdx;
            const dir = shiftForward ? -1 : 1;

            for (let i = itemIdx; compFunc(i); i += dir){
                this.selectedAsset.graphs[i] = this.selectedAsset.graphs[i + dir];
            }

            this.$set(
                this.selectedAsset.graphs,
                newIdx,
                movedGraph
            );
        },
        clientToNavPos(pos){
            /*
                - Calculate mouse's viewport position (based on "client space", so that the hierarchy is irrelivent)
                - Calculate the mouse's position in the navWrapper in percentage (IE: x:50%, y:25%)
                - Multiply percentage by viewport dimensions to get mouse position in "nav space" (viewport and
                    navWrapper dimensions will always be the same since CSS scale does not change pixel values of width/height)
            */
            let vpBounds = this.nodeViewportEl.getBoundingClientRect();
            let vpOrigin = new Victor(vpBounds.left, vpBounds.top);
            let vpSize = new Victor(this.nodeViewportEl.clientWidth, this.nodeViewportEl.clientHeight);
            let navBounds = this.nodeNavEl.getBoundingClientRect();
            let navOrigin = new Victor(navBounds.left, navBounds.top).subtract(vpOrigin);
            let navSize = new Victor(navBounds.right - navBounds.left, navBounds.bottom - navBounds.top);
            let offsetPos = pos.clone().subtract(vpOrigin);
            let navPercent = offsetPos.clone().subtract(navOrigin).divide(navSize);
            let nodeNavPos = vpSize.clone().multiply(navPercent);

            return nodeNavPos;
        },
        resize(){
            if (this.$refs.navControlPanel){
                this.$refs.navControlPanel.setContainerDimensions(this.nodeViewportEl.clientWidth, this.nodeViewportEl.clientHeight);
            }
        },
        createConnection(connectionObj){
            this.selectedAsset.addConnection(connectionObj);
            this.draggingConnection = connectionObj;
        },
        dragConnection(connectionObj){
            let {startNode, startSocketId, endNode, endSocketId} = connectionObj;

            this.draggingConnection = connectionObj;
            this.undoStore.cache.set('prev_socket', {startNode, startSocketId, endNode, endSocketId});
        },
        relinkConnections(){
            let nodeEls = this.$refs.nodeEls;
            let connectionEls = this.$refs.connectionEls;
            let nodeInfo = new Map();

            nodeEls?.forEach(nodeEl => {
                let info = nodeEl.getRelinkInfo();
                nodeInfo.set(info.id, info);
            });

            connectionEls?.forEach(connectionEl => connectionEl.relink(nodeInfo));
        },
        nodeClick({nodeObj, jsEvent}){
            let mousePos = new Victor(jsEvent.clientX, jsEvent.clientY);

            if (this.mouseDownPos.distance(mousePos) < 2){
                this.deselectAllNodes();
                this.selectedNodes.push(nodeObj);
            }
        },
        nodeDown(node){
            let alreadySelected = !!this.selectedNodes.find(n => n.nodeId == node.nodeId);
            let navHotkeyActive = this.$refs.navControlPanel.hotkeyTool != null;
            let navToolSelected = this.$store.getters['LogicEditor/getSelectedNavTool'] != null;

            if (!alreadySelected) {
                if (!this.shiftDown){
                    this.deselectAllNodes();
                }

                this.selectedNodes.push(node);
            }

            if (!(navHotkeyActive || navToolSelected)){
                this.isDraggingNode = true;
            }
        },
        nodeMoveEnd(){
            this.actionMoveNodes({nodeRefList: this.selectedNodes}, true);
            this.updateNodeBounds();
        },
        selectNodesInBox(){
            this.selectedAsset.nodes.forEach(node => {
                let selectionBounds = this.$refs.selectionBox.getBoundingClientRect();
                let nodeBounds = node.domRef.getBoundingClientRect();
                let overlapX = selectionBounds.right >= nodeBounds.left && nodeBounds.right >= selectionBounds.left;
                let overlapY = selectionBounds.bottom >= nodeBounds.top && nodeBounds.bottom >= selectionBounds.top;
                let isSelected = this.selectedNodes.find(n => n.nodeId == node.nodeId);

                if (overlapX && overlapY && !isSelected){
                    this.selectedNodes.push(node);
                }
            });
        },
        updateNodeBounds(){
            let nodes = this.selectedAsset.nodes;

            if (nodes.length == 0){
                this.contentsBounds = [0, 0, 0, 0];
                return;
            }

            //calculate client/screen space bounds
            let firstBoundingRect = nodes[0].domRef.getBoundingClientRect();
            let ul = new Victor(firstBoundingRect.left, firstBoundingRect.top);
            let br = new Victor(firstBoundingRect.right, firstBoundingRect.bottom);
            let vpBounds = this.nodeViewportEl.getBoundingClientRect();
            let vpSize = new Victor(vpBounds.right - vpBounds.left, vpBounds.bottom - vpBounds.top);
            let vpOrigin = new Victor(vpBounds.left, vpBounds.top);
            let navZoom = this.selectedAsset.navState.zoomFac;
            let navOrigin = this.selectedAsset.navState.offset.clone().multiplyScalar(navZoom);

            for (let i = 1; i < nodes.length; i++){
                let curNodeBounds = nodes[i].domRef.getBoundingClientRect();
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
            this.contentsBounds[0] = ul.x;
            this.contentsBounds[1] = -ul.y;
            this.contentsBounds[2] = br.x;
            this.contentsBounds[3] = -br.y;
        },
        selectAllNodes(){
            this.selectedNodes.splice(0);
            this.selectedNodes.push(...this.selectedAsset.nodes);
        },
        deselectAllNodes(){
            this.selectedNodes.splice(0);
        },
        deleteSelectedNodes(){
            const protectedNodes = [];
            const deletableNodes = this.selectedNodes.filter(node => {
                if (node.editorCanDelete) return true;

                protectedNodes.push(node);
                return false;
            });

            if (deletableNodes.length){
                this.actionDeleteNodes({nodeRefList: deletableNodes}, true);
                this.deselectAllNodes();
            }

            protectedNodes.forEach(node => node.onDeleteStopped(protectedNodes));
        },
        checkLoop(leftNode, rightNode){
            let connectionMap = new Map();
            let checkedNodes = new Map();
            let connections = this.selectedAsset.connections;

            for (let i = 0; i < connections.length - 1; i++){
                let connection = connections[i];
                let id = connection.startNode.nodeId + '/' + connection.startSocketId;
                connectionMap.set(id, connection);
            }

            checkedNodes.set(rightNode.nodeId, true);

            return _checkLoop({endNode: leftNode}, connectionMap, checkedNodes);
        },
        dialogNewVariable(callback){
            this.newVariableCallback = callback;
            this.showNewVariableWindow = true;
        },
        dialogNewVariableClose(){
            this.newVariableCallback = ()=>{};
            this.showNewVariableWindow = false;
        },
        actionAddNode({templateId, nodeRef}, makeCommit = true){
            const nodeAPI = this.$store.getters['getNodeAPI'];
            const pos = this.getNewNodePos();
            const newNode = this.selectedAsset.addNode(templateId, pos, nodeRef, nodeAPI);

            if (makeCommit){
                let data = {templateId, nodeRef: newNode};
                this.undoStore.commit({action: Shared.LOGIC_ACTION.ADD_NODE, data});
            }

            if (!nodeRef) newNode.onCreate();
        },
        actionDeleteNodes({nodeRefList}, makeCommit = true){
            const connectionRefMap = new Map();

            nodeRefList.forEach(node => {
                //find and delete connections attached to the node
                const currentConnections = [];
                
                node.parentScript.connections.forEach(connection => {
                    const startNodeId = connection.startNode.nodeId;
                    const endNodeId = connection.endNode.nodeId;

                    if (startNodeId == node.nodeId || endNodeId == node.nodeId){
                        currentConnections.push(connection);
                    }
                });

                currentConnections.forEach(connection => {
                    const connectionMapGet = connectionRefMap.get(node.parentScript) ?? [];

                    if (!connectionMapGet.length) connectionRefMap.set(node.parentScript, connectionMapGet);
                    connectionMapGet.push(connection);
                    node.parentScript.removeConnection(connection.id);
                    connection.startNode?.onRemoveConnection(connection);
                    connection.endNode?.onRemoveConnection(connection);
                });

                //delete node
                node.onBeforeDelete();
                node.parentScript.deleteNode(node);
            });

            if (makeCommit){
                const data = {nodeRefList: [...nodeRefList], connectionRefMap};
                this.undoStore.commit({action: Shared.LOGIC_ACTION.DELETE_NODES, data});
            }
        },
        actionMoveNodes({nodeRefList, velocity}, makeCommit = true){
            if (makeCommit){
                let startVec = this.undoStore.cache.get('move_start');

                if (startVec){
                    let totalVel = nodeRefList[0].pos.clone().subtract(startVec);
                    let data = {nodeRefList: [...nodeRefList], velocity: totalVel};

                    this.undoStore.commit({action: Shared.LOGIC_ACTION.MOVE, data});
                    this.undoStore.cache.delete('move_start');
                }

                return;
            }

            for (let i = 0; i < nodeRefList.length; i++){
                let curNode = nodeRefList[i];
                let newPos = curNode.pos.clone().add(velocity);

                curNode.setPos(newPos);
            }

            if (!this.undoStore.cache.get('move_start')){
                this.undoStore.cache.set('move_start', nodeRefList[0].pos.clone());
            }
        },
        actionMakeConnection({connectionObj, socketOver}, makeCommit = true){
            if (socketOver.isInput){
                connectionObj.endNode = socketOver.node;
                connectionObj.endSocketId = socketOver.socketData.id;
                connectionObj.endSocketEl = socketOver.socketEl;
            }
            else{
                connectionObj.startNode = socketOver.node;
                connectionObj.startSocketId = socketOver.socketData.id;
                connectionObj.startSocketEl = socketOver.socketEl;
            }

            connectionObj.startNode.onNewConnection(connectionObj);
            connectionObj.endNode.onNewConnection(connectionObj);

            //if connection was removed entirely by a previous undo, we need to recreate
            if (!connectionObj.connectionComponent){
                this.selectedAsset.addConnection(connectionObj);
            }

            //if this is being connected through a redo, then the socketEl reference might be deprecated and needs a relink
            if (!socketOver.socketEl){
                this.$nextTick(()=>{
                    this.relinkConnections();
                })
            }

            if (makeCommit){
                let prevSocket = this.undoStore.cache.get('prev_socket');
                let socketOverCopy = Object.assign({}, socketOver);

                delete socketOverCopy.socketEl;

                let data = {connectionObj, socketOver: socketOverCopy, prevSocket};
                this.undoStore.commit({action: Shared.LOGIC_ACTION.CONNECT, data});

                this.$nextTick(()=>{
                    connectionObj.updateComponent();
                });
            }

            this.undoStore.cache.delete('prev_socket');
        },
        actionRemoveConnection({connectionObj}, makeCommit = true){
            makeCommit &= !!(connectionObj.startNode && connectionObj.endNode);

            if (makeCommit){
                let data = {connectionObj: Object.assign(new Node_Connection(), connectionObj)};
                let prevSocket = this.undoStore.cache.get('prev_socket');

                Object.assign(data.connectionObj, prevSocket);
                this.undoStore.commit({action: Shared.LOGIC_ACTION.DISCONNECT, data});
            }

            this.selectedAsset.removeConnection(connectionObj.id);
            connectionObj.startNode?.onRemoveConnection(connectionObj);
            connectionObj.endNode?.onRemoveConnection(connectionObj);
        },
        actionChangeInput({socket, oldVal, newVal, node}, makeCommit = true){
            socket.value = newVal;

            node.onValueChange({
                socketId: socket.id,
                oldVal,
                newVal
            });

            if (makeCommit){
                let data = {socket, oldVal, newVal, node};
                this.undoStore.commit({action: Shared.LOGIC_ACTION.CHANGE_INPUT, data});
            }
        },
        revertAddNode({nodeRef}){
            nodeRef.onBeforeDelete();
            this.selectedAsset.deleteNode(nodeRef);
        },
        revertDeleteNodes({nodeRefList, connectionRefMap}){
            const nodeAPI = this.$store.getters['getNodeAPI'];

            nodeRefList.forEach(node => {
                node.parentScript.addNode(node.templateId, null, node, nodeAPI);
            });

            connectionRefMap.forEach((connectionList, parentScript) => {
                connectionList.forEach(connection => {
                    parentScript.addConnection(connection);
                    connection.startNode.onNewConnection(connection);
                    connection.endNode.onNewConnection(connection);
                });
            });

            this.$nextTick(()=>{
                this.relinkConnections();
            });
        },
        revertMoveNodes({nodeRefList, velocity}){
            for (let i = 0; i < nodeRefList.length; i++){
                let curNode = nodeRefList[i];
                let newPos = curNode.pos.clone().subtract(velocity);

                curNode.setPos(newPos);
            }
        },
        revertMakeConnection({connectionObj, prevSocket}){
            if (prevSocket){
                Object.assign(connectionObj, prevSocket);
                this.relinkConnections();
            }
            else{
                this.selectedAsset.removeConnection(connectionObj.id);
            }
        },
        revertRemoveConnection({connectionObj}){
            this.selectedAsset.addConnection(connectionObj);
            
            this.$nextTick(()=>{
                this.relinkConnections();
            })
        },
        revertChangeInput({socket, oldVal, newVal, node}){
            socket.value = oldVal;
            node.onValueChange({
                socketId: socket.id,
                newVal,
                oldVal
            });
        },
    }
}

function _checkLoop(connection, connectionMap, checkedNodes){
    let curNode = connection.endNode;
    let socketArr = [];
    let foundLoop = false;

    if (checkedNodes.get(curNode.nodeId)){
        return true;
    }

    checkedNodes.set(curNode.nodeId, true);

    curNode.outTriggers?.forEach(trigger => socketArr.push(trigger));
    curNode.outputs?.forEach(output => socketArr.push(output));

    for (let i = 0; !foundLoop && i < socketArr.length; i++){
        let socket = socketArr[i];
        let connectionPath = curNode.nodeId + '/' + socket.id;
        let nextConnection = connectionMap.get(connectionPath);

        if (nextConnection){
            foundLoop |= _checkLoop(nextConnection, connectionMap, checkedNodes);
        }
    }

    return !!foundLoop;
}
</script>

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

.category-back-btn > img{
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
    margin-left: 5px;
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

.trash-button > img{
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
    overflow: hidden;
    white-space: nowrap;
    text-overflow: ellipsis;
    height: 1em;
    width: 7em;
}

.graph-controls{
    display: flex;
    flex-direction: row;
}

.graph-control-btn{
    width: 40px;
    height: 40px;
    background: none;
    border: none;
}
</style>