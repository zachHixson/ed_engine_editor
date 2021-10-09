import Victor from 'victor';
import Asset from './Asset';
import {CATEGORY_TYPE, CATEGORY_ID} from '../Enums';
import Node from './Node';
import {DEFAULT_EVENTS} from './node_libraries/Events';
import {NODE_MAP} from './node_libraries/Node_Library';

class Logic extends Asset{
    constructor(){
        super();
        this.events = new Map();
        this._nextId = 0;

        if (window.IS_EDITOR){
            this._selectedEventId = null;

            //the following 3 properties act as pointers to the data in the respective Map().
            //Vue does not observe Map() changes, but it can watch a pointer to the same data.
            this.eventsList = [];
            this.selectedNodeList = null;
            this.selectedConnectionsList = null;
        }

        DEFAULT_EVENTS.forEach(event => {
            this.events.set(event.id, null);
        });
    }

    get type(){return CATEGORY_TYPE.LOGIC}
    get category_ID(){return CATEGORY_ID.LOGIC}
    get nextNodeId(){return this._nextId++};
    get selectedEventId(){return this._selectedEventId};

    set selectedEventId(newId){
        let currentTree = this.events.get(newId);

        this._selectedEventId = newId;
        this.selectedNodeList = (newId) ? currentTree.nodes : [];
        this.selectedConnectionsList = (newId) ? currentTree.connections : [];
    }

    registerEvent(eventId, pos = new Victor()){
        let eventTamplate = DEFAULT_EVENTS.get(eventId);
        let newEvent = new Node(eventTamplate, this.nextNodeId, pos);
        newEvent.isEvent = true;

        if (window.IS_EDITOR){
            this.events.set(eventId, {
                entry: newEvent,
                nodes: [newEvent],
                connections: [],
            });

            this.refreshEditorEventList();
        }
    }

    unregisterEvent(eventId){
        this.events.set(eventId, null);

        if (window.IS_EDITOR){
            this.selectedEventId = null;
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

    addNode(templateId, pos, nodeRef = null){
        if (window.IS_EDITOR){
            let nodeTemplate = NODE_MAP.get(templateId);
            let newNode = (nodeRef) ? nodeRef : new Node(nodeTemplate, this.nextNodeId, pos);
            let curEvent = this.events.get(this.selectedEventId);

            curEvent.nodes.push(newNode);

            return newNode;
        }
        else{
            console.error('the editor method \"addNode()\" is being called from the engine runtime');
        }

        return null;
    }
}

export default Logic;