import i18n from '@/i18n';
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
        this.localVariables = new Map();
        this._nextGraphId = 0;
        this._nextNodeId = 0;
        this._nextConnectionId = 0;
    }

    get category_ID(){return Shared.CATEGORY_ID.LOGIC}
    get nextGraphId(){return this._nextGraphId++}
    get nextNodeId(){return this._nextNodeId++}
    get navState(){
        const graphNavstate = this.graphs.length > 0 ? this.graphs.find(graph => graph.id == this.selectedGraphId).navState : null;
        return (this.selectedGraphId != null) ? graphNavstate : this.defaultNavState
    }
    get defaultNavState(){return {
        offset: new Victor(0, 0),
        zoomFac: 1,
    }}

    set navState(newState){
        if (this.selectedEventId){
            this.selectedEventId.navState = newState;
        }
    }

    toSaveData(){
        const logic = {
            id: this.id,
            name: this.name,
            selectedGraphId: this.selectedGraphId,
            graphs: this.graphs,
            nodes: this.nodes.map(n => n.toSaveData()),
            connections: this.connections.map(c => c.toSaveData()),
            localVariables: (()=>{
                const newMap = {};

                this.localVariables.forEach((val, key)=>{
                    newMap[key] = val.description;
                });

                return newMap;
            })()
        }

        return logic;
    }

    fromSaveData(data, nodeAPI){
        const nodeEventObj = new CustomEvent("logicLoaded", {detail: this});
        const nodeMap = {};

        Object.assign(this, data);

        this.graphs = this.graphs.map(graph => {
            this._nextGraphId = Math.max(this._nextGraphId, graph.id + 1);
            graph.navState.offset = Victor.fromObject(this.navState.offset);
            return graph;
        });
        this.nodes = this.nodes.map(node => {
            this._nextNodeId = Math.max(this._nextNodeId, node.nodeId + 1);
            return new Node(
                Shared.NODE_MAP[node.templateId],
                node.nodeId,
                Victor.fromObject(node.pos),
                this,
                node.graphId,
                nodeAPI
            ).fromSaveData(node);
        });

        this.nodes.forEach(node => {
            nodeMap[node.nodeId] = node;
        });

        this.connections = this.connections.map(connection => {
            this._nextConnectionId = Math.max(this._nextConnectionId, connection.id + 1);
            return new Node_Connection(connection).fromSaveData(connection, nodeMap);
        });

        //dispatch node event
        this.nodes.forEach(node => {
            node.dispatchEvent(nodeEventObj);
        });

        return this;
    }

    addGraph(){
        const id = this.nextGraphId;
        const newGraph = {
            id,
            name: i18n.t('logic_editor.graph_prefix') + id,
            navState: this.defaultNavState
        };

        this.graphs.push(newGraph);

        if (this.selectedGraphId == null){
            this.selectedGraphId = newGraph.id;
        }
    }

    deleteGraph(id){
        let idx = null;

        for (let i = 0; idx == null && i < this.graphs.length; i++){
            if (this.graphs[i].id == id){
                idx = i;
            }
        }

        //delete graph and relevant nodes
        this.nodes.forEach(node => {
            if (node.graphId == id){
                this.deleteNode(node);
            }
        });
        
        this.graphs.splice(idx, 1);

        //select next graph
        if (id == this.selectedGraphId){
            const nextIdx = Math.min(this.graphs.length - 1, idx);
            this.selectedGraphId = (this.graphs.length > 0) ? this.graphs[nextIdx].id : null;
        }
    }

    addNode(templateId, pos, nodeRef = null, nodeAPI){
        const nodeTemplate = Shared.NODE_MAP[templateId];
        const newNode = nodeRef ?? new Node(nodeTemplate, this.nextNodeId, pos, this, this.selectedGraphId, nodeAPI);
        
        newNode.dispatchEvent(new CustomEvent("onScriptAdd"));
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

    removeConnection(id, connectionobj){
        for (let i = 0; i < this.connections.length; i++){
            let connection = this.connections[i];

            if (connection.id == id || (connectionobj == connection)){
                this.connections.splice(i, 1);
                return true;
            }
        }

        return false;
    }
};