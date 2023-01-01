import i18n from '@/i18n';
import Node from './Node';
import Node_Connection from './Node_Connection';
import Core from '@/core';
import type Node_API from './Node_API';

const { Vector } = Core;
const { t } = i18n.global;

interface iGraph {
    id: number;
    name: string;
    navState: Core.iNavState;
}

export default class Logic extends Core.Asset_Base implements Core.iEditorLogic {
    private _nextGraphId: number = 0;
    private _nextNodeId: number = 0;
    private _nextConnectionId: number = 0;

    id: number;
    name: string;
    graphs: iGraph[] = [];
    nodes: Node[] = [];
    connections: Node_Connection[] = [];
    selectedGraphId: number = 0;
    selectedNodes: Node[] = [];
    localVariables: Map<string, Core.Node_Enums.SOCKET_TYPE> = new Map();
    sortOrder: number = 0;

    constructor(){
        super();
        this.id = Core.ID_Generator.newID();
        this.name = this.id.toString();
    }

    get category_ID(){return Core.CATEGORY_ID.LOGIC}
    get nextGraphId(){return this._nextGraphId++}
    get nextNodeId(){return this._nextNodeId++}
    get graphNavState(){
        return this.graphs.find(graph => graph.id == this.selectedGraphId)!.navState;
    }
    get defaultNavState(){return {
        offset: new Vector(0, 0),
        zoomFac: 1,
    }}

    set graphNavState(newState: Core.iNavState){
        this.graphs[this.selectedGraphId].navState = newState!;
    }

    toSaveData(){
        const logic = {
            id: this.id,
            name: this.name,
            selectedGraphId: this.selectedGraphId,
            graphs: this.graphs,
            nodes: this.nodes.map(n => n.toSaveData()),
            connections: this.connections.map(c => c.toSaveData()),
        }

        return logic;
    }

    fromSaveData(data: Core.iAnyObj, nodeAPI: Node_API){
        const nodeMap: {[key: string]: Node} = {};

        Object.assign(this, data);

        this.graphs = this.graphs.map(graph => {
            this._nextGraphId = Math.max(this._nextGraphId, graph.id + 1);
            graph.navState.offset = Vector.fromObject(this.graphNavState.offset);
            return graph;
        });
        this.nodes = this.nodes.map(node => {
            this._nextNodeId = Math.max(this._nextNodeId, node.nodeId + 1);
            return new Node(
                Core.NODE_MAP[node.templateId],
                node.nodeId,
                Vector.fromObject(node.pos),
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
            node.logicLoaded && node.logicLoaded(this);
        });

        return this;
    }

    addGraph(){
        const id = this.nextGraphId;
        const newGraph = {
            id,
            name: t('logic_editor.graph_prefix') + id,
            navState: this.defaultNavState
        };

        this.graphs.push(newGraph);

        if (this.selectedGraphId == null){
            this.selectedGraphId = newGraph.id;
        }
    }

    deleteGraph(id: number): void {
        let idx: number = -1;

        for (let i = 0; idx < 0 && i < this.graphs.length; i++){
            if (this.graphs[i].id == id){
                idx = i;
            }
        }

        if (idx < 0){
            console.trace(`Error deleting graph. Graph ID ${id} does not exist on logic script ${this.name}`);
            return;
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
            this.selectedGraphId = this.graphs[nextIdx].id;
        }
    }

    addNode(templateId: string, pos: Core.Vector, nodeAPI: Node_API, nodeRef?: Node): Node {
        const nodeTemplate = Core.NODE_MAP[templateId];
        const newNode = nodeRef ?? new Node(nodeTemplate, this.nextNodeId, pos, this, this.selectedGraphId, nodeAPI);
        
        newNode.onScriptAdd && newNode.onScriptAdd();
        this.nodes.push(newNode);

        return newNode
    }

    deleteNode(nodeRef: Node): void {
        let nodeIdx = -1;

        for (let i = 0; nodeIdx < 0 && i < this.nodes.length; i++){
            let node = this.nodes[i];

            if (node.nodeId == nodeRef.nodeId){
                nodeIdx = i;
            }
        }
        
        this.nodes.splice(nodeIdx, 1);
    }

    addConnection(connectionObj: Node_Connection): void {
        if (!connectionObj.id){
            connectionObj.id = this._nextConnectionId++;
        }

        this.connections.push(connectionObj);
    }

    removeConnection(id: number, connectionobj?: Node_Connection): boolean {
        for (let i = 0; i < this.connections.length; i++){
            const connection = this.connections[i];

            if (connection.id == id || (connectionobj == connection)){
                this.connections.splice(i, 1);
                return true;
            }
        }

        return false;
    }

    setLocalVariable(name: string, type: Core.Node_Enums.SOCKET_TYPE): void {
        name = name.trim().toLowerCase();
        this.localVariables.set(name, type);
    }

    getLocalVariable(name: string): Core.Node_Enums.SOCKET_TYPE | undefined {
        name = name.trim().toLowerCase();
        return this.localVariables.get(name);
    }

    deleteLocalVariable(name: string): void {
        name = name.trim().toLowerCase();
        this.localVariables.delete(name);
    }
};