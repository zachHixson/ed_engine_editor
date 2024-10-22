import i18n from '@/i18n';
import Node from './Node';
import Node_Connection from './Node_Connection';
import Core from '@/core';
import type Node_API from '../Node_API';

const { Vector } = Core;
const { t } = i18n.global;

const sGraphSaveData = [
    ['ID', Number()],
    ['name', String()],
    ['navSaveData', Core.Struct.getDataType<Core.tNavSaveData>()],
] as const;

export default class Logic extends Core.Asset_Base implements Core.iEditorLogic {
    private _nextGraphId: number = 0;
    private _nextNodeId: number = 0;
    private _nextConnectionId: number = 0;

    id: number;
    name: string;
    graphs: Graph[] = [];
    nodes: Node[] = [];
    connections: Node_Connection[] = [];
    selectedGraphId: number = 0;
    selectedNodes: Node[] = [];
    localVariables: Map<string, Core.iEditorVariable> = new Map();
    sortOrder: number = 0;

    constructor(){
        super();
        this.id = Core.ID_Generator.newID();
        this.name = this.id.toString();
    }

    get category_ID(){return Core.CATEGORY_ID.LOGIC}
    get nextGraphId(){return this._nextGraphId++}
    get nextNodeId(){return this._nextNodeId++}
    get graphNavState(): Core.NavState {
        return this.graphs.find(graph => graph.id == this.selectedGraphId)!.navState;
    }
    get defaultNavState(){return {
        offset: new Vector(0, 0),
        zoomFac: 1,
    }}

    set graphNavState(newState: Core.NavState | Core.iNavState){
        this.graphs[this.selectedGraphId].navState.copy(newState);
    }

    toSaveData(): Core.GetKeyTypesFrom<typeof Core.sLogicSaveData> {
        return [
            ...this.getBaseAssetData(),
            this.selectedGraphId,
            this.graphs.map(g => g.toSaveData()),
            this.nodes.map(n => n.toSaveData()),
            this.connections.map(c => c.toSaveData()),
        ];
    }

    static fromSaveData(data: Core.GetKeyTypesFrom<typeof Core.sLogicSaveData>, nodeAPI: Node_API): Logic {
        return new Logic()._loadSaveData(data, nodeAPI);
    }

    private _loadSaveData(data: Core.GetKeyTypesFrom<typeof Core.sLogicSaveData>, nodeAPI: Node_API): Logic {
        const dataObj = Core.Struct.objFromArr(Core.sLogicSaveData, data);

        if (!dataObj){
            throw new Error('Error loading logic script from save data');
        }

        const nodeMap = new Map<number, Node>();

        this.loadBaseAssetData(data);

        this.graphs = dataObj.graphList.map(graph => {
            this._nextGraphId = Math.max(this._nextGraphId, graph[0] + 1);
            return Graph.fromSaveData(graph);
        });
        this.nodes = dataObj.nodeDataList.map(nodeData => {
            this._nextNodeId = Math.max(this._nextNodeId, nodeData[1] + 1);
            return Node.fromSaveData(nodeData, this, nodeAPI);
        });

        this.nodes.forEach(node => {
            nodeMap.set(node.nodeId, node);
        });

        this.connections = dataObj.connectionDataList.map(connectionData => {
            this._nextConnectionId = Math.max(this._nextConnectionId, connectionData[0] + 1);
            return Node_Connection.fromSaveData(connectionData, nodeMap);
        });

        //dispatch node event
        this.nodes.forEach(node => {
            node.logicLoaded(this);
        });

        return this;
    }

    addGraph(){
        const id = this.nextGraphId;
        const newGraph = new Graph(id);

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

        //add new graph if no more graphs exist
        if (this.graphs.length < 1){
            this.addGraph();
            this.selectedGraphId = this.graphs[0].id;
            return;
        }
        
        //select next graph in list if the deleted graph was the selected one
        if (id == this.selectedGraphId){
            const nextIdx = Math.min(this.graphs.length - 1, idx);
            this.selectedGraphId = this.graphs[nextIdx].id;
        }
    }

    addNode(templateId: string, pos: Core.Vector, nodeAPI: Node_API, nodeRef?: Node): Node {
        const newNode = nodeRef ?? new Node(templateId, this.nextNodeId, pos, this, this.selectedGraphId, nodeAPI);
        
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

    setLocalVariable(name: string, type: Core.Node_Enums.SOCKET_TYPE, isList: boolean): void {
        name = name.trim().toLowerCase();
        this.localVariables.set(name, {type, isList});
    }

    getLocalVariable(name: string): Core.iEditorVariable | undefined {
        name = name.trim().toLowerCase();
        return this.localVariables.get(name);
    }

    deleteLocalVariable(name: string): void {
        name = name.trim().toLowerCase();
        this.localVariables.delete(name);
    }
};

class Graph {
    id: number;
    name: string;
    navState: Core.NavState;

    constructor(id: number){
        this.id = id;
        this.name =  t('logic_editor.graph_prefix') + this.id;
        this.navState =  new Core.NavState();
    }

    toSaveData(): Core.GetKeyTypesFrom<typeof sGraphSaveData> {
        return [
            this.id,
            this.name,
            this.navState.toSaveData(),
        ];
    }

    static fromSaveData(data: Core.GetKeyTypesFrom<typeof sGraphSaveData>): Graph {
        const newGraph = new Graph(data[0]);
        newGraph.name = data[1];
        newGraph.navState = Core.NavState.fromSaveData(data[2]);
        return newGraph;
    }
}