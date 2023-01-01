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

    toSaveData(){
        let {id, type, graphId, startNode, startSocketId, endNode, endSocketId} = this;
        let startNodeId = startNode!.nodeId;
        let endNodeId = endNode!.nodeId;

        return {id, type, graphId, startNodeId, startSocketId, endNodeId, endSocketId};
    }

    fromSaveData(data: Core.iAnyObj, nodeMap: {[key: string]: Node}){
        this.startNode = nodeMap[data.startNodeId];
        this.endNode = nodeMap[data.endNodeId];

        return this;
    }

    update(){
        this.emit('connection-update');
    }
};