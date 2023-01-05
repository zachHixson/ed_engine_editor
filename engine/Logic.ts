import Node from './Node';
import Engine from './Engine';
import {
    Object_Instance,
    iEngineLogic,
    iNodeConnection,
    iLogicSaveData,
    iEngineOutTrigger,
    iEngineOuput,
    iEngineInTrigger,
    iEngineInput,
    iNodeSaveData
} from '@engine/core/core';

export default class Logic implements iEngineLogic {
    private _nodes: Node[] = [];
    private _instance: Object_Instance | null = null;
    private _localVariableDefaults: Map<string, any> = new Map();

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

            newNode.setInstanceCallback(()=>this._instance!);

            newNode.template.onScriptAdd?.call(newNode);
        });

        //create and link connections
        logicData.connections.forEach((connection: iNodeConnection & {startNodeId: number, endNodeId: number}) => {
            const {startNodeId, endNodeId, startSocketId, endSocketId} = connection;
            const startNode = nodeMap.get(startNodeId)!;
            const endNode = nodeMap.get(endNodeId)!;
            const allStartSockets = new Map<string, iEngineOutTrigger | iEngineOuput>();
            const allEndSockets = new Map<string, iEngineInTrigger | iEngineInput>();

            startNode.outTriggers.forEach((oTrigger, key) => allStartSockets.set(key, oTrigger));
            startNode.outputs.forEach((output, key) => allStartSockets.set(key, output));
            endNode.inTriggers.forEach((iTrigger, key) => allEndSockets.set(key, iTrigger));
            endNode.inputs.forEach((input, key) => allEndSockets.set(key, input));

            allStartSockets.get(startSocketId!)!.connection = allEndSockets.get(endSocketId!)!;
            allEndSockets.get(endSocketId!)!.connection = allStartSockets.get(startSocketId!)!;
        });
    }

    get localVariableDefaults(){return this._localVariableDefaults};

    executeEvent(eventName: string, instance: Object_Instance, data: any): void {
        this._instance = instance;
        this.events.get(eventName)!.forEach(event => event.executeEvent(data));
        this._instance = null;
    }

    executeAsyncNodeMethod(instance: Object_Instance, node: Node, methodName: string): void {
        const oldInstance = this._instance;
        this._instance = instance;
        node.method(methodName);
        this._instance = oldInstance;
    }

    setLocalVariableDefault(name: string, data: any): void {
        const varName = name.trim().toLowerCase();
        this._localVariableDefaults.set(varName, data);
    }

    dispatchLifecycleEvent(name: string, data?: any): void {
        for (let i = 0; i < this._nodes.length; i++){
            const curNode = this._nodes[i];
            const templateMethod = curNode.template[name];
            templateMethod?.call(curNode, data);
        }
    }
}