import type Node from './Node';
import Core from '@/core';

export default class Node_Connection extends Core.EventListenerMixin(class {}) implements Core.iNodeConnection {
    id: number;
    type: Core.Node_Enums.SOCKET_TYPE;
    graphId: number;
    canConnect: boolean;
    startNode: Node | null;
    startSocketId: string | null;
    startSocketEl: HTMLElement | null;
    endNode: Node | null;
    endSocketId: string | null;
    endSocketEl: HTMLElement | null;

    constructor(inpObj: Core.iAnyObj = {}){
        super();
        this.id = inpObj.id;
        this.type = inpObj.type;
        this.graphId = inpObj.graphId;
        this.canConnect = inpObj.canConnect;
        this.startNode = inpObj.startNode ?? null;
        this.startSocketId = inpObj.startSocketId ?? null;
        this.startSocketEl = inpObj.startSocketEl ?? null;
        this.endNode = inpObj.endNode ?? null;
        this.endSocketId = inpObj.endSocketId ?? null;
        this.endSocketEl = inpObj.endSocketEl ?? null;
    }

    get startSocket(){
        return this.startNode?.outputs.get(this.startSocketId!);
    }

    get endSocket(){
        return this.endNode?.inputs.get(this.endSocketId!);
    }

    componentDestructor(){
        this.startSocketEl = null;
        this.endSocketEl = null;
    }

    toSaveData(): Core.iConnectionSaveData {
        const {id, type, graphId, startNode, endNode} = this;
        const startSocketId = this.startSocketId!;
        const endSocketId = this.endSocketId!;
        const startNodeId = startNode!.nodeId;
        const endNodeId = endNode!.nodeId;

        return {id, type, graphId, startNodeId, startSocketId, endNodeId, endSocketId};
    }

    static fromSaveData(data: Core.iConnectionSaveData, nodeMap: Map<number, Node>): Node_Connection {
        return new Node_Connection(data)._loadSaveData(data, nodeMap);
    }

    private _loadSaveData(data: Core.iAnyObj, nodeMap: Map<number, Node>){
        this.startNode = nodeMap.get(data.startNodeId)!;
        this.endNode = nodeMap.get(data.endNodeId)!;

        return this;
    }

    update(){
        this.emit('connection-update');
    }
};