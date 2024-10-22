import Node from './Node';
import Engine from './Engine';
import {
    Instance_Object,
    iEngineLogic,
    sLogicSaveData,
    iEngineOutTrigger,
    iEngineOutput,
    iEngineInTrigger,
    iEngineInput,
    sNodeSaveData,
    CATEGORY_ID,
    sConnectionSaveData,
    iEventContext,
    Struct,
    GetKeyTypesFrom,
} from '@engine/core/core';
import { SOCKET_TYPE } from './core/nodes/Node_Enums';

export default class Logic implements iEngineLogic {
    private static _curEventKey = 0;

    private _nodes: Node[] = [];
    private _localVariableDefaults: Map<string, {value: any, type: SOCKET_TYPE, isList: boolean}> = new Map();

    id: number;
    name: string;
    graphNames = new Map<number, string>();
    events: Map<string, Node[]> = new Map();

    constructor(logicData: GetKeyTypesFrom<typeof sLogicSaveData>, engine: Engine){
        const dataObj = Struct.objFromArr(sLogicSaveData, logicData);

        if (!dataObj){
            throw new Error('Error reading logic script from save data');
        }

        this.id = dataObj.id;
        this.name = dataObj.name;

        const nodeMap = new Map<number, Node>();

        //populate graph name map
        dataObj.graphList.forEach((graphData) => this.graphNames.set(graphData[0], graphData[1]));

        //create all nodes
        dataObj.nodeDataList.forEach((nodeData: GetKeyTypesFrom<typeof sNodeSaveData>) => {
            const nodeObj = Struct.objFromArr(sNodeSaveData, nodeData);

            if (!nodeObj){
                throw new Error('Error reading node from save data');
            }

            const newNode = new Node(nodeData, this, engine);
            nodeMap.set(nodeObj.nodeID, newNode);
            this._nodes.push(newNode);

            if (newNode.isEvent){
                let eventArr = this.events.get(nodeObj.templateID);

                if (!eventArr){
                    eventArr = [];
                    this.events.set(nodeObj.templateID, eventArr);
                }

                eventArr.push(newNode);
            }
        });

        //create and link connections
        dataObj.connectionDataList.forEach((connection: GetKeyTypesFrom<typeof sConnectionSaveData>) => {
            const connectionObj = Struct.objFromArr(sConnectionSaveData, connection);

            if (!connectionObj){
                throw new Error('Error reading node connection from save data');
            }

            const startNode = nodeMap.get(connectionObj.startNodeID)!;
            const endNode = nodeMap.get(connectionObj.endNodeID)!;
            const allStartSockets = new Map<string, iEngineOutTrigger | iEngineOutput>();
            const allEndSockets = new Map<string, iEngineInTrigger | iEngineInput>();

            startNode.outTriggers.forEach((oTrigger, key) => allStartSockets.set(key, oTrigger));
            startNode.outputs.forEach((output, key) => allStartSockets.set(key, output));
            endNode.inTriggers.forEach((iTrigger, key) => allEndSockets.set(key, iTrigger));
            endNode.inputs.forEach((input, key) => allEndSockets.set(key, input));

            allStartSockets.get(connection[2])!.connection = allEndSockets.get(connectionObj.endSocketID)!;
            allEndSockets.get(connection[3])!.connection = allStartSockets.get(connectionObj.startSocketID)!;
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