<template>
    <div class="logicMain">
        <div class="event-panel-wrapper">
            <div v-show="showEvents" class="side-panel event-panel">
                <div class="side-panel-heading">
                    <div>Events</div>
                    <button class="open-close-btn" @click="showAddEventModal = true">
                        <img src="@/assets/plus.svg" />
                    </button>
                </div>
                <div class="events-wrapper">
                    <div
                        v-for="event in addedEvents"
                        :key="event"
                        class="list-item"
                        :style="event == selectedAsset.selectedEventId ? 'background: var(--button-norm)' : ''"
                        @click="selectEvent(event)">
                        <div class="name">{{event}}</div>
                        <div class="buttons">
                            <button class="eventBtn" @click="removeEvent($event, event)">
                                <img class="icon" src="@/assets/trash.svg" />
                            </button>
                        </div>
                    </div>
                </div>
            </div>
            <div class="resizeBtn-right-wrapper">
                <button class="resizeBtn resizeBtn-right" @click="showEvents = !showEvents" :style="showEvents ? 'transform: translateX(-2px);' : ''">
                    <img v-show="showEvents" src="@/assets/arrow_01.svg" style="transform: rotate(-90deg)"/>
                    <img v-show="!showEvents" src="@/assets/arrow_01.svg" style="transform: rotate(90deg)"/>
                </button>
            </div>
            <div class="undo-panel-wrapper">
                <UndoPanel class="undo-panel" />
            </div>
        </div>
        <div v-if="showAddEventModal" class="modal-wrapper">
            <div class="modal-bg"></div>
            <div class="modal">
                <div class="heading">
                    <div>Add Event</div>
                    <button class="open-close-btn" @click="showAddEventModal = false">
                        <img src="@/assets/plus.svg" style="transform: rotate(45deg);"/>
                    </button>
                </div>
                <div class="add-event-list">
                    <button
                        class="add-event"
                        :class="isAddedEvent(event) ? 'add-grayed' : ''"
                        v-for="event in addableEvents"
                        :key="event"
                        @click="addEvent(event)">
                        {{event}}
                    </button>
                </div>
            </div>
        </div>
        <div
            :style="(selectedAsset.selectedEventId) ? '' : 'background: white'"
            ref="nodeVP"
            class="node-viewport"
            @click="mouseClick"
            @mousedown="mouseDown"
            @mouseup="mouseUp"
            @mousemove="mouseMove">
            <div ref="nodeNav" class="node-nav-wrapper">
                <Node
                    v-for="node in selectedAsset.selectedNodeList"
                    :key="node.nodeId"
                    :nodeObj="node"
                    :clientToNav="convertClientToNavPos"
                    :canDrag="nodeDraggingEnabled"
                    class="node"
                    @node-moved="updateNodeBounds"/>
            </div>
        </div>
        <div class="node-library-wrapper">
            <div v-show="showLibrary" class="side-panel node-library">
                <div class="side-panel-heading">
                    Add Nodes
                </div>
                <div v-if="!selectedAsset.selectedEventId">Add an event in order to add nodes</div>
                <div v-if="selectedAsset.selectedEventId" class="slide-wrapper" :class="selectedCategory ? 'slide-wrapper-trans' : ''">
                    <div class="library-column node-category-list">
                        <div
                            v-for="(category, idx) in nodeCategories"
                            :key="idx"
                            class="node-category"
                            @click="selectedCategory = category">
                            {{category}}
                        </div>
                    </div>
                    <div class="library-column node-category-contents">
                        <div class="list-item" @click="selectedCategory = null">
                            &lt;
                        </div>
                        <div
                            v-for="node in filteredNodes"
                            :key="node.id"
                            class="list-item"
                            @click="actionAddNode({templateId: node.id})">
                            {{node.id}}
                        </div>
                    </div>
                </div>
            </div>
            <div class="resizeBtn-left-wrapper">
                <button class="resizeBtn resizeBtn-left" @click="showLibrary = !showLibrary" :style="showLibrary ? 'transform: translateX(2px);' : ''">
                    <img v-show="showLibrary" src="@/assets/arrow_01.svg" style="transform: rotate(90deg)"/>
                    <img v-show="!showLibrary" src="@/assets/arrow_01.svg" style="transform: rotate(-90deg)"/>
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
            <div ref="testDiv"></div>
        </div>
    </div>
</template>

<script>
import Victor from 'victor';
import {LOGIC_ACTION} from '@/common/Enums';
import {DEFAULT_EVENTS} from '@/common/data_classes/node_libraries/Events';
import {NODE_LIST} from '@/common/data_classes/node_libraries/Node_Library';
import UndoPanel from '@/components/common/UndoPanel';
import NavControlPanel from '@/components/common/NavControlPanel';
import Node from '@/components/editor_logic/Node';

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
            mouseDownEvent: null,
            mouseUpEvent: null,
            mouseMoveEvent: null,
            mouseDownPos: new Victor(0, 0),
            contentsBounds: [0, 0, 0, 0],
            convertClientToNavPos: null,
        }
    },
    components: {
        UndoPanel,
        NavControlPanel,
        Node,
    },
    computed: {
        selectedNavTool(){
            return this.$store.getters['LogicEditor/getSelectedNavTool'];
        },
        showEvents: {
            get(){
                return this.$store.getters['LogicEditor/isEventPanelOpen'];
            },
            set(newState){
                this.$store.dispatch('LogicEditor/setEventPanelState', newState);
            },
        },
        showLibrary: {
            get(){
                return this.$store.getters['LogicEditor/isLibraryPanelOpen'];
            },
            set(newState){
                this.$store.dispatch('LogicEditor/setLibraryPanelState', newState);
            },
        },
        addableEvents(){
            let eventList = [];

            DEFAULT_EVENTS.forEach(event => {
                eventList.push(event.id);
            });

            return eventList;
        },
        addedEvents(){
            return this.selectedAsset.eventsList;
        },
        nodeCategories(){
            let categories = [];

            for (let i = 0; i < NODE_LIST.length; i++){
                let curNode = NODE_LIST[i];

                if (!categories.includes(curNode.category)){
                    categories.push(curNode.category);
                }
            }

            return categories;
        },
        filteredNodes(){
            return NODE_LIST.filter(node => node.category == this.selectedCategory);
        },
        nodeDraggingEnabled(){
            return this.selectedNavTool == null;
        },
        curNavState(){
            return this.selectedAsset.navState;
        },
    },
    mounted(){
        let curSelectedEvent = this.selectedAsset.selectedEventId;

        this.nodeViewportEl = this.$refs.nodeVP;
        this.nodeNavEl = this.$refs.nodeNav;
        this.convertClientToNavPos = this.clientToNavPos.bind(this);

        this.nodeViewportEl.addEventListener('wheel', this.$refs.navControlPanel.scroll);
        this.nodeViewportEl.addEventListener ('mouseenter', this.$refs.navControlPanel.mouseEnter);
        this.nodeViewportEl.addEventListener ('mouseleave', this.$refs.navControlPanel.mouseLeave);
        window.addEventListener('resize', this.resize);
        this.resize();

        if (curSelectedEvent){
            this.selectEvent(curSelectedEvent ? curSelectedEvent : this.selectedAsset.eventsList[0].id);
        }

        this.bindActions();
        this.bindReversions();
        this.navChange(this.selectedAsset.navState);
    },
    beforeDestroy(){
        this.nodeViewportEl.removeEventListener('wheel', this.$refs.navControlPanel.scroll);
        this.nodeViewportEl.removeEventListener('mouseenter', this.$refs.navControlPanel.mouseEnter);
        this.nodeViewportEl.removeEventListener('mouseleave', this.$refs.navControlPanel.mouseLeave);
    },
    methods: {
        bindActions(){
            this.actionMap.set(LOGIC_ACTION.ADD_NODE, this.actionAddNode);
            this.actionMap.set(LOGIC_ACTION.DELETE_NODE, this.actionDeleteNode);
            this.actionMap.set(LOGIC_ACTION.MOVE, this.actionMoveNode);
            this.actionMap.set(LOGIC_ACTION.CONNECT, this.actionConnectNode);
            this.actionMap.set(LOGIC_ACTION.DISCONNECT, this.actionDisconnectNode);
            this.actionMap.set(LOGIC_ACTION.INPUT_CHANGE, this.actionInputChange);
        },
        bindReversions(){
            this.revertMap.set(LOGIC_ACTION.ADD_NODE, this.revertAddNode);
            this.revertMap.set(LOGIC_ACTION.DELETE_NODE, this.revertDeleteNode);
            this.revertMap.set(LOGIC_ACTION.MOVE, this.revertMoveNode);
            this.revertMap.set(LOGIC_ACTION.CONNECT, this.revertConnectNode);
            this.revertMap.set(LOGIC_ACTION.DISCONNECT, this.revertDisconnectNode);
            this.revertMap.set(LOGIC_ACTION.INPUT_CHANGE, this.revertInputChange);
        },
        getNewNodePos(){
            let vpBounds = this.nodeViewportEl.getBoundingClientRect();
            let vpUl = new Victor(vpBounds.left, vpBounds.top);
            let vpBr = new Victor(vpBounds.right, vpBounds.bottom);
            let midpoint = vpUl.clone().add(vpBr).divideScalar(2);
            let navPos = this.convertClientToNavPos(midpoint);

            for (let i = 0; i < this.selectedAsset.selectedNodeList.length; i++){
                let curNode = this.selectedAsset.selectedNodeList[i];

                if (curNode.pos.isEqualTo(navPos)){
                    let size = 50;
                    let ul = new Victor(-size, -size);
                    let br = new Victor(size, size);
                    navPos.add(new Victor(0, 0).randomize(ul, br));
                }
            }
            
            return navPos;
        },
        addEvent(eventId){
            if (!this.isAddedEvent(eventId)){
                let navSize = new Victor(this.nodeNavEl.offsetWidth, this.nodeNavEl.offsetHeight);
                let navCenter = navSize.clone().divideScalar(2);

                this.selectedAsset.registerEvent(eventId, navCenter);
                this.showAddEventModal = false;
                this.selectEvent(eventId);
            }
        },
        removeEvent(jsEvent, eventId){
            jsEvent.stopPropagation();
            this.selectedAsset.unregisterEvent(eventId);
        },
        isAddedEvent(eventId){
            let isActive = false;

            for (let i = 0; !isActive && i < this.selectedAsset.eventsList.length; i++){
                isActive |= this.selectedAsset.eventsList[i] == eventId;
            }

            return isActive;
        },
        selectEvent(eventId){
            this.selectedAsset.selectedEventId = eventId;
            this.navChange(this.selectedAsset.navState);
        },
        mouseClick(jsEvent){
            let mouseUpPos = new Victor(jsEvent.clientX, jsEvent.clientY);

            if (mouseUpPos.isEqualTo(this.mouseDownPos)){
                this.$store.dispatch('LogicEditor/selectNavTool', null);
            }
        },
        mouseDown(jsEvent){
            this.mouseDownPos.x = jsEvent.clientX;
            this.mouseDownPos.y = jsEvent.clientY;
            this.$refs.navControlPanel.mouseDown(jsEvent);
        },
        mouseUp(jsEvent){
            this.$refs.navControlPanel.mouseUp(jsEvent);
        },
        mouseMove(jsEvent){
            this.$refs.navControlPanel.mouseMove(jsEvent);
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
        updateNodeBounds(){
            let nodes = this.selectedAsset.selectedNodeList;

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
        resize(){
            if (this.$refs.navControlPanel){
                this.$refs.navControlPanel.setContainerDimensions(this.nodeViewportEl.clientWidth, this.nodeViewportEl.clientHeight);
            }
        },
        actionAddNode({templateId, nodeRef}, makeCommit = true){
            let pos = this.getNewNodePos();
            let newNode = this.selectedAsset.addNode(templateId, pos, nodeRef);
        },
        actionDeleteNode(){},
        actionMoveNode(){},
        actionConnectNode(){},
        actionDisconnectNod(){},
        actionInputChange(){},
        revertAddNode(){},
        revertDeleteNode(){},
        revertMoveNode(){},
        revertConnectNode(){},
        revertDisconnectNod(){},
        revertInputChange(){},
    }
}
</script>

<style scoped>
.logicMain{
    position: relative;
    width: 100%;
    height: 100%;
    overflow: hidden;
}

.event-panel-wrapper{
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

.event-panel{
    min-width: 200px;
    border-left: none;
    border-radius: 0px var(--corner-radius) var(--corner-radius) 0px;
}

.events-wrapper{
    display: flex;
    flex-direction: column;
    overflow-y: auto;
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

.eventBtn{
    background: none;
    border: none;
}

.eventBtn > .icon{
    width: 20px;
    height: 20px;
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

.modal-wrapper{
    position: absolute;
    left: 0;
    top: 0;
    display: flex;
    justify-content: center;
    align-items: center;
    width: 100%;
    height: 100%;
    z-index: 10;
    z-index: 2000;
}

.modal-bg{
    position: absolute;
    background: black;
    width: 100%;
    height: 100%;
    opacity: 50%;
    z-index: inherit
}

.modal{
    background: var(--main-bg);
    border: 2px solid var(--border);
    border-radius: var(--corner-radius);
    overflow: hidden;
    max-height: 95%;
    overflow-y: auto;
    z-index: inherit;
}

.modal > .heading{
    display: flex;
    flex-direction: row;
    justify-content: space-between;
    align-items: center;
    padding: var(--corner-radius);
    background: var(--heading);
}

.add-event-list{
    display: flex;
    flex-direction: column;
    justify-content: flex-start;
    align-items: stretch;
    width: 100%;
    height: 100%;
}

.add-event{
    display: flex;
    justify-content: center;
    background: var(--tool-panel-bg);
    padding: 20px;
    margin: 10px;
    border: none;
    border-radius: var(--corner-radius);
}

.add-event:not(:first-child){
    margin-top: 0;
}

.add-event:hover:not(.add-grayed){
    background: var(--button-norm);
}

.add-event:active:not(.add-grayed){
    background: var(--button-down);
}

.add-grayed{
    opacity: 50%;
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

.node-nav-wrapper{
    position: relative;
    left: 0;
    right: 0;
    width: 100%;
    height: 100%;
    pointer-events: none;
}

.node-library-wrapper{
    position: absolute;
    top: 0;
    right: 0;
    display: flex;
    flex-direction: column;
    justify-content: center;
    height: 100%;
}

.node-library{
    min-width: 200px;
    border-right: none;
    border-radius: var(--corner-radius) 0px 0px var(--corner-radius);
}

.slide-wrapper{
    position: relative;
    display: flex;
    flex-direction: row;
    width: 200%;
    left: 0;
    transition-property: left;
    transition-duration: 100ms;
    transition-timing-function: ease-out;
}

.slide-wrapper-trans{
    left: -100%;
    transition-property: left;
    transition-duration: 100ms;
    transition-timing-function: ease-out;
}

.library-column{
    display: flex;
    flex-direction: column;
    width: 50%;
    height: 100%;
}

.node-category{
    display: flex;
    flex-direction: row;
    align-items: center;
    height: 40px;
    padding-left: 10px;
    margin-left: 10px;
    background: var(--tool-panel-bg);
    border-bottom: 2px solid var(--border);
    border-left: 2px solid var(--border);
}

.node-category:last-child{
    border-radius: 0px 0px 0px var(--corner-radius);
}

.node-category:hover{
    filter: brightness(1.1);
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