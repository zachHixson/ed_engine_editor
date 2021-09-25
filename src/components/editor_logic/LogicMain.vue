<template>
    <div class="logicMain">
        <div class="event-panel-wrapper">
            <div v-show="showEvents" class="event-panel">
                <div class="events-heading">
                    <div>Events</div>
                    <button class="open-close-btn" @click="showAddEventModal = true">
                        <img src="@/assets/plus.svg" />
                    </button>
                </div>
                <div class="events-wrapper">
                    <div
                        v-for="event in addedEvents"
                        :key="event.id"
                        class="event"
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
            <div class="resizeBtn-wrapper">
                <button class="resizeBtn" @click="showEvents = !showEvents" :style="showEvents ? 'transform: translateX(-2px);' : ''">
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
    </div>
</template>

<script>
import {DEFAULT_EVENTS} from '@/common/data_classes/node_libraries/Events';
import Node from '@/common/data_classes/Node';

export default {
    name: 'LogicEditor',
    props: ['selectedAsset'],
    data(){
        return {
            showEvents: true,
            showAddEventModal: false,
            addedEvents: [],
            selectedEventId: null,
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
}

.event-panel-wrapper{
    position: absolute;
    top: 0;
    display: flex;
    flex-direction: column;
    justify-content: center;
    height: 100%;
}

.event-panel{
    display: flex;
    flex-direction: column;
    height: 95%;
    min-width: 200px;
    background: var(--tool-panel-bg);
    border: 2px solid var(--border);
    border-left: none;
    border-radius: 0px var(--corner-radius) var(--corner-radius) 0px;
    overflow: hidden;
}

.events-heading{
    display: flex;
    flex-direction: row;
    justify-content: space-between;
    align-items: center;
    padding: 10px;
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

.event{
    display: flex;
    flex-direction: row;
    justify-content: space-between;
    align-items: center;
    margin: 8px;
    padding: 10px;
    background: var(--button-dark-norm);
    border-radius: var(--corner-radius);
    border: 2px solid var(--border);
    user-select: none;
}

.event > div:not(:last-child){
    margin-right: 10px;
}

.event > .buttons{
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

.resizeBtn-wrapper{
    position: absolute;
    right: 0px;
}

.resizeBtn{
    position: relative;
    right: -100%;
    width: 30px;
    height: 70px;
    padding: 0;
    padding: 2px;
    background: var(--tool-panel-bg);
    border: 2px solid var(--border);
    border-left: none;
    border-radius: 0px var(--corner-radius) var(--corner-radius) 0px;
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
    background: var(--panel-bg);
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
</style>