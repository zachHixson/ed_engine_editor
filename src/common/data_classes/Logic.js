import Asset from './Asset';
import {CATEGORY_TYPE, CATEGORY_ID} from '../Enums';
import Node from './Node';
import {DEFAULT_EVENTS} from './node_libraries/Events';

class Logic extends Asset{
    constructor(){
        super();
        this.events = new Map();
        this.editorSelectedEventId = null;

        DEFAULT_EVENTS.forEach(event => {
            this.events.set(event.id, null);
        });
    }

    get type(){return CATEGORY_TYPE.LOGIC}
    get category_ID(){return CATEGORY_ID.LOGIC}

    registerEvent(eventId){
        let eventTamplate = DEFAULT_EVENTS.get(eventId);
        this.events.set(eventId, new Node(eventTamplate));
    }
}

export default Logic;