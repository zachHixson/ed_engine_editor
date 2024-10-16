import Node from './Node';
import Engine from './Engine';
import {
    Instance_Object,
    iEngineLogic,
    tLogicSaveData,
    iEngineOutTrigger,
    iEngineOutput,
    iEngineInTrigger,
    iEngineInput,
    tNodeSaveData,
    CATEGORY_ID,
    tConnectionSaveData,
    iEventContext,
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

    constructor(logicData: tLogicSaveData, engine: Engine){
        this.id = logicData[0];
        this.name = logicData[1];

        const nodeMap = new Map<number, Node>();

        //populate graph name map
        logicData[4].forEach((graphData) => this.graphNames.set(graphData[0], graphData[1]));

        //create all nodes
        logicData[5].forEach((nodeData: tNodeSaveData) => {
            const newNode = new Node(nodeData, this, engine);
            nodeMap.set(nodeData[1], newNode);
            this._nodes.push(newNode);

            if (newNode.isEvent){
                let eventArr = this.events.get(nodeData[0]);

                if (!eventArr){
                    eventArr = [];
                    this.events.set(nodeData[0], eventArr);
                }

                eventArr.push(newNode);
            }
        });

        //create and link connections
        logicData[6].forEach((connection: tConnectionSaveData) => {
            const startNode = nodeMap.get(connection[4])!;
            const endNode = nodeMap.get(connection[5])!;
            const allStartSockets = new Map<string, iEngineOutTrigger | iEngineOutput>();
            const allEndSockets = new Map<string, iEngineInTrigger | iEngineInput>();

            startNode.outTriggers.forEach((oTrigger, key) => allStartSockets.set(key, oTrigger));
            startNode.outputs.forEach((output, key) => allStartSockets.set(key, output));
            endNode.inTriggers.forEach((iTrigger, key) => allEndSockets.set(key, iTrigger));
            endNode.inputs.forEach((input, key) => allEndSockets.set(key, input));

            allStartSockets.get(connection[2])!.connection = allEndSockets.get(connection[3])!;
            allEndSockets.get(connection[3])!.connection = allStartSockets.get(connection[2])!;
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