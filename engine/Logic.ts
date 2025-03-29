import Node from './Node';
import Engine from './Engine';
import {
    Instance_Object,
    iEngineLogic,
    iEngineOutTrigger,
    iEngineOutput,
    iEngineInTrigger,
    iEngineInput,
    CATEGORY_ID,
    iEventContext,
} from '@engine/core/core';
import { ConnectionSave, ConnectionSaveId, LogicSave, LogicSaveId, NodeSave, NodeSaveId } from '@compiled/SaveTypes';
import { SOCKET_TYPE } from './core/nodes/Node_Enums';

export default class Logic implements iEngineLogic {
    private static _curEventKey = 0;

    private _nodes: Node[] = [];
    private _localVariableDefaults: Map<string, {value: any, type: SOCKET_TYPE, isList: boolean}> = new Map();

    id: number;
    name: string;
    graphNames = new Map<number, string>();
    events: Map<string, Node[]> = new Map();

    constructor(logicData: LogicSave, engine: Engine){
        this.id = logicData[LogicSaveId.id];
        this.name = logicData[LogicSaveId.name];

        const nodeMap = new Map<number, Node>();
        const graphList = logicData[LogicSaveId.graphList];
        const nodeDataList = logicData[LogicSaveId.nodeDataList];
        const connectionDataList = logicData[LogicSaveId.connectionDataList];

        //populate graph name map
        graphList.forEach(graphData => this.graphNames.set(graphData[0], graphData[1]));

        //create all nodes
        nodeDataList.forEach((nodeData: NodeSave) => {
            const newNode = new Node(nodeData, this, engine);
            nodeMap.set(nodeData[NodeSaveId.nodeID], newNode);
            this._nodes.push(newNode);

            if (newNode.isEvent){
                let eventArr = this.events.get(nodeData[NodeSaveId.templateID]);

                if (!eventArr){
                    eventArr = [];
                    this.events.set(nodeData[NodeSaveId.templateID], eventArr);
                }

                eventArr.push(newNode);
            }
        });

        //create and link connections
        connectionDataList.forEach((connection: ConnectionSave) => {
            const startNode = nodeMap.get(connection[ConnectionSaveId.startNodeID])!;
            const endNode = nodeMap.get(connection[ConnectionSaveId.endNodeID])!;
            const allStartSockets = new Map<string, iEngineOutTrigger | iEngineOutput>();
            const allEndSockets = new Map<string, iEngineInTrigger | iEngineInput>();
            const startSocketId = connection[ConnectionSaveId.startSocketID];
            const endSocketID = connection[ConnectionSaveId.endSocketID];

            startNode.outTriggers.forEach((oTrigger, key) => allStartSockets.set(key, oTrigger));
            startNode.outputs.forEach((output, key) => allStartSockets.set(key, output));
            endNode.inTriggers.forEach((iTrigger, key) => allEndSockets.set(key, iTrigger));
            endNode.inputs.forEach((input, key) => allEndSockets.set(key, input));

            allStartSockets.get(startSocketId)!.connection = allEndSockets.get(endSocketID)!;
            allEndSockets.get(endSocketID)!.connection = allStartSockets.get(startSocketId)!;
        });
    }

    get category_ID(){return CATEGORY_ID.LOGIC};
    get localVariableDefaults(){return this._localVariableDefaults};

    private createEventContext(instance: Instance_Object): iEventContext {
        return { eventKey: Logic._curEventKey++, instance: instance };
    }

    executeEvent(eventName: string, instance: Instance_Object, data: any): void {
        const event = this.events.get(eventName);

        if (!event) return;

        event.forEach(event => {
            event.executeEvent(data, this.createEventContext(instance));
        });
    }

    dispatchOnCreate(instance: Instance_Object): void {
        for (let i = 0; i < this._nodes.length; i++){
            const curNode = this._nodes[i];
            curNode.onCreate(this.createEventContext(instance));
        }
    }

    dispatchLogicLoaded(): void {
        for (let i = 0; i < this._nodes.length; i++){
            const curNode = this._nodes[i];
            curNode.logicLoaded(this);
        }
    }

    dispatchAfterGameDataLoaded(): void {
        for (let i = 0; i < this._nodes.length; i++){
            const curNode = this._nodes[i];
            curNode.afterGameDataLoaded();
        }
    }

    setLocalVariableDefault(name: string, value: any, type: SOCKET_TYPE, isList: boolean): void {
        const varName = name.trim().toLowerCase();
        this._localVariableDefaults.set(varName, {value, type, isList});
    }
}