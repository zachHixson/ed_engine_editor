import type Node from './Node';
import Core from '@/core';

export default class Node_Connection extends Core.EventListenerMixin(class {}) implements Core.iNodeConnection {
    private _disconnectedFrom: string | null = null;
    private _startSocketId: string | null = null;
    private _endSocketId: string | null = null;

    id: number;
    type: Core.Node_Enums.SOCKET_TYPE;
    graphId: number;
    canConnect: boolean;
    startNode: Node | null;
    startSocketEl: HTMLElement | null;
    endNode: Node | null;
    endSocketEl: HTMLElement | null;

    constructor(inpObj: Core.iAnyObj = {}){
        super();
        this.id = inpObj.id;
        this.type = inpObj.type ?? null;
        this.graphId = inpObj.graphId;
        this.canConnect = inpObj.canConnect;
        this.startNode = inpObj.startNode ?? null;
        this.startSocketId = inpObj.startSocketId ?? null;
        this.startSocketEl = inpObj.startSocketEl ?? null;
        this.endNode = inpObj.endNode ?? null;
        this.endSocketId = inpObj.endSocketId ?? null;
        this.endSocketEl = inpObj.endSocketEl ?? null;
    }

    get startSocketId(){return this._startSocketId}
    set startSocketId(id: string | null){
        if (id == null){
            this._disconnectedFrom = this._startSocketId;
        }

        this._startSocketId = id
    }

    get endSocketId(){return this._endSocketId}
    set endSocketId(id: string | null){
        if (id == null){
            this._disconnectedFrom = this._endSocketId;
        }

        this._endSocketId = id
    }

    get disconnectedFrom(){return this._disconnectedFrom}

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
        const {id, graphId, startNode, endNode} = this;
        const startSocketId = this.startSocketId!;
        const endSocketId = this.endSocketId!;
        const startNodeId = startNode!.nodeId;
        const endNodeId = endNode!.nodeId;

        return {
            id: id,
            gId: graphId,
            sSocId: startSocketId,
            eSocId: endSocketId,
            sNodeId: startNodeId,
            eNodeId: endNodeId,
        } satisfies Core.iConnectionSaveData;
    }

    static fromSaveData(data: Core.iConnectionSaveData, nodeMap: Map<number, Node>): Node_Connection {
        const { id, gId, sSocId, eSocId, sNodeId, eNodeId } = data;
        const newData = {
            id,
            graphId: gId,
            startSocketId: sSocId,
            endSocketId: eSocId,
            startNodeId: sNodeId,
            eNodeId: eNodeId,
        };
        return new Node_Connection(newData)._loadSaveData(data, nodeMap);
    }

    private _loadSaveData(data: Core.iConnectionSaveData, nodeMap: Map<number, Node>){
        this.startNode = nodeMap.get(data.sNodeId)!;
        this.endNode = nodeMap.get(data.eNodeId)!;

        return this;
    }

    update(){
        this.emit('connection-update');
    }
};