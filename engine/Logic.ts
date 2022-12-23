import Node from './Node';
import Engine from './Engine';
import { Object_Instance, NODE_MAP, Interfaces, iEngineLogic, iNodeConnection } from '@core';

type iAnyObj = Interfaces.iAnyObj;

export default class Logic implements iEngineLogic {
    private _nodes: Node[] = [];
    private _instance: Object_Instance | null = null;
    private _localVariableDefaults: Map<string, any> = new Map();

    id: number;
    events: Map<string, Node[]> = new Map();

    constructor(logicData: iAnyObj, engine: Engine){
        this.id = logicData.id;

        const nodes: iAnyObj = {};

        //create all nodes
        logicData.nodes.forEach((nodeData: iAnyObj) => {
            const templateId = nodeData.templateId;
            const template = NODE_MAP[templateId];
            const newNode = new Node(template, nodeData.nodeId, this, engine);
            nodes[nodeData.nodeId] = newNode;
            this._nodes.push(newNode);

            newNode.template.beforeLoad?.call(newNode, nodeData);

            if (template.isEvent){
                let eventArr: Node[] | undefined = this.events.get(nodeData.templateId);

                if (!eventArr){
                    eventArr = [];
                    this.events.set(nodeData.templateId, eventArr);
                }

                eventArr.push(newNode);
            }

            if (nodeData.widgetData){
                newNode.widgetData = JSON.parse(nodeData.widgetData);
            }

            newNode.setInstanceCallback(()=>this._instance!);

            nodeData.inputs.forEach((srcInput: iAnyObj) => {
                newNode.inputs.get(srcInput.id)!.value = srcInput.value;
            });

            newNode.template.onScriptAdd?.call(newNode);
        });

        //create and link connections
        logicData.connections.forEach((connection: iNodeConnection) => {
            const {startNodeId, endNodeId, startSocketId, endSocketId} = connection;
            const startNode = nodes[startNodeId];
            const endNode = nodes[endNodeId];
            const allStartSockets = {...startNode.outTriggers, ...startNode.outputs};
            const allEndSockets = {...endNode.inTriggers, ...endNode.inputs};

            allStartSockets[startSocketId].connection = allEndSockets[endSocketId];
            allEndSockets[endSocketId].connection = allStartSockets[startSocketId];
        });
    }

    get localVariableDefaults(){return this._localVariableDefaults};

    executeEvent(eventName: string, instance: Object_Instance, data: any){
        this._instance = instance;
        this.events.get(eventName)!.forEach(event => event.executeEvent(data));
        this._instance = null;
    }

    executeAsyncNodeMethod(instance: Object_Instance, node: Node, methodName: string){
        const oldInstance = this._instance;
        this._instance = instance;
        node.method(methodName);
        this._instance = oldInstance;
    }

    setLocalVariableDefault(name: string, data: any): void {
        const varName = name.trim().toLowerCase();
        this._localVariableDefaults.set(varName, data);
    }

    dispatchLifecycleEvent(name: string, data?: iAnyObj): void {
        for (let i = 0; i < this._nodes.length; i++){
            const curNode = this._nodes[i];
            const templateMethod = curNode.template[name];
            templateMethod?.call(curNode, data);
        }
    }
}