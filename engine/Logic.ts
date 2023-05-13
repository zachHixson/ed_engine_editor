import Node from './Node';
import Engine from './Engine';
import {
    Instance_Object,
    iEngineLogic,
    iNodeConnection,
    iLogicSaveData,
    iEngineOutTrigger,
    iEngineOutput,
    iEngineInTrigger,
    iEngineInput,
    iNodeSaveData,
    CATEGORY_ID,
iEngineNode,
} from '@engine/core/core';
import { SOCKET_TYPE } from './core/nodes/Node_Enums';

export default class Logic implements iEngineLogic {
    private _nodes: Node[] = [];
    private _localVariableDefaults: Map<string, {value: any, type: SOCKET_TYPE, isList: boolean}> = new Map();

    id: number;
    events: Map<string, Node[]> = new Map();

    constructor(logicData: iLogicSaveData, engine: Engine){
        this.id = logicData.id;

        const nodeMap = new Map<number, Node>();

        //create all nodes
        logicData.nodes.forEach((nodeData: iNodeSaveData) => {
            const newNode = new Node(nodeData, this, engine);
            nodeMap.set(nodeData.nodeId, newNode);
            this._nodes.push(newNode);

            if (newNode.isEvent){
                let eventArr = this.events.get(nodeData.templateId);

                if (!eventArr){
                    eventArr = [];
                    this.events.set(nodeData.templateId, eventArr);
                }

                eventArr.push(newNode);
            }
        });

        //create and link connections
        logicData.connections.forEach((connection: iNodeConnection & {startNodeId: number, endNodeId: number}) => {
            const {startNodeId, endNodeId, startSocketId, endSocketId} = connection;
            const startNode = nodeMap.get(startNodeId)!;
            const endNode = nodeMap.get(endNodeId)!;
            const allStartSockets = new Map<string, iEngineOutTrigger | iEngineOutput>();
            const allEndSockets = new Map<string, iEngineInTrigger | iEngineInput>();

            startNode.outTriggers.forEach((oTrigger, key) => allStartSockets.set(key, oTrigger));
            startNode.outputs.forEach((output, key) => allStartSockets.set(key, output));
            endNode.inTriggers.forEach((iTrigger, key) => allEndSockets.set(key, iTrigger));
            endNode.inputs.forEach((input, key) => allEndSockets.set(key, input));

            allStartSockets.get(startSocketId!)!.connection = allEndSockets.get(endSocketId!)!;
            allEndSockets.get(endSocketId!)!.connection = allStartSockets.get(startSocketId!)!;
        });
    }

    get category_ID(){return CATEGORY_ID.LOGIC};
    get localVariableDefaults(){return this._localVariableDefaults};

    executeEvent(eventName: string, instance: Instance_Object, data: any): void {
        const event = this.events.get(eventName);

        if (!event) return;

        event.forEach(event => {
            event.executeEvent(data, instance);
        });
    }

    dispatchOnCreate(instanceContext: Instance_Object): void {
        for (let i = 0; i < this._nodes.length; i++){
            const curNode = this._nodes[i];
            const method = curNode.template.onCreate as (this: iEngineNode, instanceContext: Instance_Object)=>void;
            method?.call(curNode, instanceContext);
        }
    }

    dispatchLogicLoaded(): void {
        for (let i = 0; i < this._nodes.length; i++){
            const curNode = this._nodes[i];
            curNode.template.logicLoaded?.call(curNode, this);
        }
    }

    dispatchInitVariableNodes(): void {
        for (let i = 0; i < this._nodes.length; i++){
            const curNode = this._nodes[i];
            curNode.template.initVariableNodes?.call(curNode);
        }
    }

    dispatchAfterGameDataLoaded(): void {
        for (let i = 0; i < this._nodes.length; i++){
            const curNode = this._nodes[i];
            curNode.template.afterGameDataLoaded?.call(curNode);
        }
    }

    dispatchOnTick(instanceContext: Instance_Object): void {
        for (let i = 0; i < this._nodes.length; i++){
            const curNode = this._nodes[i];
            curNode.template.onTick?.call(curNode, instanceContext);
        }
    }

    setLocalVariableDefault(name: string, value: any, type: SOCKET_TYPE, isList: boolean): void {
        const varName = name.trim().toLowerCase();
        this._localVariableDefaults.set(varName, {value, type, isList});
    }
}