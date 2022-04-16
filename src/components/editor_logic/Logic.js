import Node from './Node';
import Node_Connection from './Node_Connection';

export default class Logic{
    constructor(){
        this.id = Shared.ID_Generator.newID();
        this.name = this.id;
        this.graphs = [];
        this.nodes = [];
        this.connections = [];
        this.selectedGraphId = null;
        this.selectedNodes = [];
        this._nextGraphId = 0;
        this._nextNodeId = 0;
        this._nextConnectionId = 0;
    }

    get category_ID(){return Shared.CATEGORY_ID.LOGIC}
    get nextGraphId(){return this._nextGraphId++}
    get nextNodeId(){return this._nextNodeId++}
    get navState(){return (this.selectedGraphId) ? this.graphs[this.selectedGraphId].navState : this.defaultNavState}
    get defaultNavState(){return {
        offset: new Victor(0, 0),
        zoomFac: 1,
    }}

    set navState(newState){
        if (this.selectedEventId){
            this.selectedEventId.navState = newState;
        }
    }

    addGraph(){
        const id = this.nextGraphId;
        const newGraph = {
            id,
            name: 'prefix_' + id,
            navState: this.defaultNavState
        };

        this.graphs.push(newGraph);

        if (this.selectedGraphId == null){
            this.selectedGraphId = newGraph.id;
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
            let entryTemplate = Shared.DEFAULT_EVENTS.get(eventData.entry.templateId);
            let entry = new Node(entryTemplate, eventData.entry.id, Victor.fromObject(eventData.entry.pos));
            let nodes = [entry, ...eventData.nodes.map(node => new Node(
                Shared.NODE_MAP.get(node.templateId),
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
                    offset: new Victor.fromObject(eventData.navState.offset),
                    zoomFac: eventData.navState.zoomFac
                }
            });
        }
        
        this.refreshEditorEventList();

        return this;
    }

    addNode(templateId, pos, nodeRef = null){
        let nodeTemplate = Shared.NODE_MAP.get(templateId);
        let newNode = nodeRef ?? new Node(nodeTemplate, this.nextNodeId, pos, this.selectedGraphId);

        this.nodes.push(newNode);

        return newNode;
    }

    deleteNode(nodeRef){
        let nodeIdx = -1;

        for (let i = 0; nodeIdx < 0 && i < this.nodes.length; i++){
            let node = this.nodes[i];

            if (node.nodeId == nodeRef.nodeId){
                nodeIdx = i;
            }
        }
        
        this.nodes.splice(nodeIdx, 1);
    }

    addConnection(connectionObj){
        if (!connectionObj.id){
            connectionObj.id = this._nextConnectionId++;
        }

        this.connections.push(connectionObj);
    }

    removeConnection(id){
        for (let i = 0; i < this.connections.length; i++){
            let connection = this.connections[i];

            if (connection.id == id){
                this.connections.splice(i, 1);
                return;
            }
        }
    }
};