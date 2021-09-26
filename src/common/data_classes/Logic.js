import Asset from './Asset';
import {CATEGORY_TYPE, CATEGORY_ID} from '../Enums';
import Node from './Node';
import {DEFAULT_EVENTS} from './node_libraries/Events';

class Logic extends Asset{
    constructor(){
        super();
        this.events = new Map();
        this.editorSelectedEventId = null;
        this._nextId = 0;

        if (window.IS_EDITOR){
            this.eventsList = [];
        }

        DEFAULT_EVENTS.forEach(event => {
            this.events.set(event.id, null);
        });
    }

    get type(){return CATEGORY_TYPE.LOGIC}
    get category_ID(){return CATEGORY_ID.LOGIC}
    get nextNodeId(){return this._nextId++};

    registerEvent(eventId){
        let eventTamplate = DEFAULT_EVENTS.get(eventId);
        this.events.set(eventId, new Node(eventTamplate, this.nextNodeId));

        if (window.IS_EDITOR){
            this.refreshEditorEventList();
        }
    }

    unregisterEvent(eventId){
        this.events.set(eventId, null);

        if (window.IS_EDITOR){
            this.refreshEditorEventList();
        }
    }

    refreshEditorEventList(){
        this.eventsList = [];

        this.events.forEach((event, id) => {
            if (event){
                this.eventsList.push(id);
            }
        })
    }
}

export default Logic;