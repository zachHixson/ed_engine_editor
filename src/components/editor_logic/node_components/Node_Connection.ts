import type Node from './Node';
import Core from '@/core';

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

    toSaveData(): Core.GetKeyTypesFrom<typeof Core.sConnectionSaveData> {
        const {id, graphId, startNode, endNode} = this;
        const startSocketId = this.startSocketId!;
        const endSocketId = this.endSocketId!;
        const startNodeId = startNode!.nodeId;
        const endNodeId = endNode!.nodeId;

        return [
            id,
            graphId,
            startSocketId,
            endSocketId,
            startNodeId,
            endNodeId,
        ];
    }

    static fromSaveData(data: Core.GetKeyTypesFrom<typeof Core.sConnectionSaveData>, nodeMap: Map<number, Node>): Node_Connection {
        const dataObj = Core.Struct.objFromArr(Core.sConnectionSaveData, data);

        if (!dataObj){
            throw new Error('Error reading node connection from save data');
        }

        const newData : tConnectionConstructor = {
            id: dataObj.ID,
            graphId: dataObj.graphID,
            startSocketId: dataObj.startSocketID,
            endSocketId: dataObj.endSocketID,
        };
        return new Node_Connection(newData)._loadSaveData(data, nodeMap);
    }

    private _loadSaveData(data: Core.GetKeyTypesFrom<typeof Core.sConnectionSaveData>, nodeMap: Map<number, Node>){
        const dataObj = Core.Struct.objFromArr(Core.sConnectionSaveData, data);

        if (!dataObj){
            throw new Error('Error reading node connection from save data');
        }

        this.startNode = nodeMap.get(dataObj.startNodeID)!;
        this.endNode = nodeMap.get(dataObj.endNodeID)!;

        return this;
    }

    update(){
        this.onConnectionUpdate.emit();
    }
};