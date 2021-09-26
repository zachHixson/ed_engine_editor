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
                        :key="event.id"
                        class="list-item"
                        :style="event.id == selectedEventId ? 'background: var(--button-norm)' : ''"
                        @click="selectEvent(event.id)">
                        <div class="name">{{event.name}}</div>
                        <div class="buttons">
                            <button class="eventBtn" @click="removeEvent($event, event.id)">
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
        <div class="node-library-wrapper">
            <div v-show="showLibrary" class="side-panel node-library">
                <div class="side-panel-heading">
                    Add Nodes
                </div>
                <div class="slide-wrapper" :class="selectedCategory ? 'slide-wrapper-trans' : ''">
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
                            class="list-item">
                            {{node.id}}
                        </div>
                    </div>
                </div>
            </div>
            <div class="resizeBtn-left-wrapper">
                <button class="resizeBtn resizeBtn-left" @click="showLibrary = !showLibrary" :style="showEvents ? 'transform: translateX(2px);' : ''">
                    <img v-show="showLibrary" src="@/assets/arrow_01.svg" style="transform: rotate(90deg)"/>
                    <img v-show="!showLibrary" src="@/assets/arrow_01.svg" style="transform: rotate(-90deg)"/>
                </button>
            </div>
        </div>
    </div>
</template>

<script>
import {DEFAULT_EVENTS} from '@/common/data_classes/node_libraries/Events';
import {NODE_LIST} from '@/common/data_classes/node_libraries/Node_Library';
import Node from '@/common/data_classes/Node';

export default {
    name: 'LogicEditor',
    props: ['selectedAsset'],
    data(){
        return {
            showEvents: true,
            showLibrary: true,
            showAddEventModal: false,
            addedEvents: [],
            selectedEventId: null,
            selectedCategory: null,
        }
    },
    watch: {
        selectedAsset(){
            //
        }
    },
    computed: {
        addableEvents(){
            let eventList = [];

            DEFAULT_EVENTS.forEach(event => {
                eventList.push(event.id);
            });

            return eventList;
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
    },
    mounted(){
        this.recomputeEventList();
        
        if (this.addedEvents.length > 0){
            let curSelectedEvent = this.selectedAsset.editorSelectedEventId;
            this.selectEvent(curSelectedEvent ? curSelectedEvent : this.addedEvents[0].id);
        }
    },
    methods: {
        recomputeEventList(){
            this.addedEvents = [];
            
            this.selectedAsset.events.forEach((event, id) => {
                if (event){
                    let name = id;
                    this.addedEvents.push({id, name});
                }
            });
        },
        addEvent(eventId){
            if (!this.isAddedEvent(eventId)){
                let eventTemplate = DEFAULT_EVENTS.get(eventId);
                this.selectedAsset.events.set(eventId, new Node(eventTemplate));
                this.recomputeEventList();
                this.showAddEventModal = false;
                this.selectEvent(eventId);
            }
        },
        removeEvent(jsEvent, eventId){
            jsEvent.stopPropagation();
            this.selectedAsset.events.set(eventId, null);
            this.recomputeEventList();
        },
        isAddedEvent(eventId){
            let isActive = false;

            for (let i = 0; !isActive && i < this.addedEvents.length; i++){
                isActive |= this.addedEvents[i].id == eventId;
            }

            return isActive;
        },
        selectEvent(eventId){
            this.selectedAsset.editorSelectedEventId = eventId;
            this.selectedEventId = this.selectedAsset.editorSelectedEventId;
        }
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
}

.modal-bg{
    position: absolute;
    background: black;
    width: 100%;
    height: 100%;
    opacity: 50%;
}

.modal{
    background: var(--main-bg);
    border: 2px solid var(--border);
    border-radius: var(--corner-radius);
    overflow: hidden;
    max-height: 95%;
    overflow-y: auto;
    z-index: 30;
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
</style>