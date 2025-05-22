import type Node from './Node';
import Core from '@/core';
import { ConnectionSave as ConnectionSave_L, ConnectionSaveId } from '@compiled/SaveTypes';

type tConnectionConstructor = {
    id: number,
} & Partial<{
    type: Core.Node_Enums.SOCKET_TYPE,
    graphId: number,
    canConnect: boolean,
    startNode: Node | null,
    startSocketId: string | null,
    startSocketEl: HTMLElement | null,
    endNode: Node | null,
    endSocketId: string | null,
    endSocketEl: HTMLElement | null,
}>

export default class Node_Connection {
    private _disconnectedFrom: string | null = null;
    private _startSocketId: string | null = null;
    private _endSocketId: string | null = null;

    id: number;
    type: Core.Node_Enums.SOCKET_TYPE | null;
    graphId: number;
    canConnect: boolean;
    startNode: Node | null;
    startSocketEl: HTMLElement | null;
    endNode: Node | null;
    endSocketEl: HTMLElement | null;

    onConnectionUpdate = new Core.Event_Emitter<()=>void>(this);
    onForceUpdate = new Core.Event_Emitter<()=>void>(this);

    constructor(inpObj: tConnectionConstructor){
        this.id = inpObj.id;
        this.type = inpObj.type ?? null;
        this.graphId = inpObj.graphId ?? 0;
        this.canConnect = inpObj.canConnect ?? true;
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

    toSaveData(): Core.ConnectionSave {
        const {id, graphId, startNode, endNode} = this;
        const startSocketId = this.startSocketId!;
        const endSocketId = this.endSocketId!;
        const startNodeId = startNode!.nodeId;
        const endNodeId = endNode!.nodeId;

        return {
            ID: id,
            graphID: graphId,
            sSocID: startSocketId,
            eSocID: endSocketId,
            sNodeID: startNodeId,
            eNodeID: endNodeId,
        };
    }

    static fromSaveData(data: ConnectionSave_L, nodeMap: Map<number, Node>): Node_Connection {
        const newData : tConnectionConstructor = {
            id: data[ConnectionSaveId.ID],
            graphId: data[ConnectionSaveId.graphID],
            startSocketId: data[ConnectionSaveId.startSocketID],
            endSocketId: data[ConnectionSaveId.endSocketID],
        };
        return new Node_Connection(newData)._loadSaveData(data, nodeMap);
    }

    private _loadSaveData(data: ConnectionSave_L, nodeMap: Map<number, Node>){
        this.startNode = nodeMap.get(data[ConnectionSaveId.startNodeID])!;
        this.endNode = nodeMap.get(data[ConnectionSaveId.endNodeID])!;
        this.type = this.startNode.template.outputs?.find(i => i.id == this.startSocketId)?.type ?? null;

        return this;
    }

    update(){
        this.onConnectionUpdate.emit();
    }
};