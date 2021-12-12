import Victor from 'victor';
import Asset from './Asset';
import {CATEGORY_TYPE, CATEGORY_ID} from '../Enums';
import Node from './Node';
import Node_Connection from './Node_Connection';
import {DEFAULT_EVENTS} from './node_libraries/Events';
import {NODE_MAP} from './node_libraries/Node_Library';

class Logic extends Asset{
    constructor(){
        super();
        this.events = new Map();

        if (window.EDITOR){
            this._selectedEventId = null;
            this._nextNodeId = 0;
            this._nextConnectionId = 0;

            //the following 3 properties act as pointers to the data in the respective Map().
            //Vue does not observe Map() changes, but it can watch a pointer to the same data.
            this.eventsList = [];
            this.eventNodeList = [];
            this.eventConnectionsList = [];
            this.selectedNodes = [];
            
            delete this.navState;
        }

        DEFAULT_EVENTS.forEach(event => {
            this.events.set(event.id, null);
        });
    }

    get type(){return CATEGORY_TYPE.LOGIC}
    get category_ID(){return CATEGORY_ID.LOGIC}
    get nextNodeId(){return this._nextNodeId++};
    get selectedEventId(){return this._selectedEventId}
    get selectedEvent(){return (this.selectedEventId) ? this.events.get(this.selectedEventId) : null}
    get navState(){return (this.selectedEventId) ? this.selectedEvent.navState : this.defaultNavState}

    set selectedEventId(newId){
        let currentTree = this.events.get(newId);

        this._selectedEventId = newId;
        this.eventNodeList = (newId) ? currentTree.nodes : [];
        this.eventConnectionsList = (newId) ? currentTree.connections : [];
    }
    set navState(newState){
        if (this.selectedEventId){
            this.selectedEventId.navState = newState;
        }
    }

    toSaveData(){
        let logic = {
            id: this.id,
            name: this.name,
            selectedEventId: this._selectedEventId,
            nextNodeId: this._nextNodeId,
            nextConnectionId: this._nextConnectionId,
            events: new Array(this.eventsList.length),
        }

        for (let i = 0; i < this.eventsList.length; i++){
            let eventId = this.eventsList[i];
            let eventObj = this.events.get(this.eventsList[i]);

            logic.events[i] = {
                entry: {
                    templateId: eventId,
                    id: eventObj.entry.nodeId,
                    pos: eventObj.entry.pos.toObject(),
                },
                nodes: eventObj.nodes.map(node => node.toSaveData()),
                connections: eventObj.connections.map(connection => connection.toSaveData()),
                navState: eventObj.navState,
            };

            //remove first node since it's always the event node which we need to recreate anyways
            logic.events[i].nodes.splice(0, 1);
        }

        return logic;
    }

    fromSaveData(data){
        this.id = data.id;
        this.name = data.name;
        this._selectedEventId = data.selectedEventId;
        this._nextNodeId = data.nextNodeId;
        this._nextConnectionId = data.nextConnectionId;

        for (let i = 0; i < data.events.length; i++){
            let eventData = data.events[i];
            let entryTemplate = DEFAULT_EVENTS.get(eventData.entry.templateId);
            let entry = new Node(entryTemplate, eventData.entry.id, Victor.fromObject(eventData.entry.pos));
            let nodes = [entry, ...eventData.nodes.map(node => new Node(
                NODE_MAP.get(node.templateId),
                node.nodeId,
                Victor.fromObject(node.pos)
            ).fromSaveData(node))];
            let nodeMap = new Map();

            entry.isEvent = true;
            nodes.forEach(node => nodeMap.set(node.nodeId, node));

            this.events.set(eventData.entry.templateId, {
                entry,
                nodes,
                connections: eventData.connections.map(
                    connection => new Node_Connection(connection).fromSaveData(connection, nodeMap)
                ),
                navState: {
                    offset: Victor.fromObject(eventData.navState.offset),
                    zoomFac: eventData.navState.zoomFac,
                },
            });
        }

        this.refreshEditorEventList();

        return this;
    }

    registerEvent(eventId, pos = new Victor()){
        let eventTamplate = DEFAULT_EVENTS.get(eventId);
        let newEvent = new Node(eventTamplate, this.nextNodeId, pos);
        newEvent.isEvent = true;

        if (window.EDITOR){
            this.events.set(eventId, {
                entry: newEvent,
                nodes: [newEvent],
                connections: [],
                navState: this.defaultNavState,
            });

            this.refreshEditorEventList();
        }
    }

    unregisterEvent(eventId){
        this.events.set(eventId, null);

        if (window.EDITOR){
            this.refreshEditorEventList();
        }
    }

    refreshEditorEventList(){
        this.eventsList.splice(0);

        this.events.forEach((event, id) => {
            if (event){
                this.eventsList.push(id);
            }
        })
    }

    addNode(templateId, pos, nodeRef = null){
        if (window.EDITOR){
            let nodeTemplate = NODE_MAP.get(templateId);
            let newNode = nodeRef ?? new Node(nodeTemplate, this.nextNodeId, pos);
            let curEvent = this.events.get(this.selectedEventId);

            curEvent.nodes.push(newNode);

            return newNode;
        }
        else{
            console.error('the editor method \"addNode()\" is being called from the engine runtime');
        }

        return null;
    }

    deleteNode(nodeRef){
        let nodeIdx = -1;

        for (let i = 0; nodeIdx < 0 && i < this.selectedEvent.nodes.length; i++){
            let node = this.selectedEvent.nodes[i];

            if (node.nodeId == nodeRef.nodeId){
                nodeIdx = i;
            }
        }
        
        this.selectedEvent.nodes.splice(nodeIdx, 1);
    }

    addConnection(connectionObj){
        if (!connectionObj.id){
            connectionObj.id = this._nextConnectionId++;
        }

        if (window.EDITOR){
            this.eventConnectionsList.push(connectionObj);
        }
    }

    removeConnection(id){
        for (let i = 0; i < this.eventConnectionsList.length; i++){
            let connection = this.eventConnectionsList[i];

            if (connection.id == id){
                this.eventConnectionsList.splice(i, 1);
                return;
            }
        }
    }
}

export default Logic;