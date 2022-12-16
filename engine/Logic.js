import Node from './Node';

export default class Logic{
    constructor(logicData, engine){
        this.id = logicData.id;
        this.events = {};
        this._instance = null;
        this._localVariableDefaults = new Map();

        const nodes = {};

        //create all nodes
        logicData.nodes.forEach(nodeData => {
            const template = Shared.NODE_MAP[nodeData.templateId];
            const newNode = new Node(template, nodeData.nodeId, this, engine);
            nodes[nodeData.nodeId] = newNode;

            newNode.template.$beforeLoad?.call(newNode, {detail: nodeData}); //replace with event code once Event_Listener is moved to Shared or Core

            if (template.isEvent){
                if (!this.events[nodeData.templateId]){
                    this.events[nodeData.templateId] = [];
                }

                this.events[nodeData.templateId].push(newNode);
            }

            if (nodeData.widgetData){
                newNode.widgetData = JSON.parse(nodeData.widgetData);
            }

            newNode.setInstanceCallback(()=>this._instance);

            nodeData.inputs.forEach(srcInput => {
                newNode.inputs[srcInput.id].value = srcInput.value;
            });

            newNode.template.$init?.call(newNode); //replace with event code once Event_Listener is moved to Shared or Core
        });

        //create and link connections
        logicData.connections.forEach(connection => {
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

    executeEvent(eventName, instance, data){
        this._instance = instance;
        this.events[eventName].forEach(event => event.executeEvent(data));
        this._instance = null;
    }

    executeAsyncNodeMethod(instance, node, methodName){
        const oldInstance = this._instance;
        this._instance = instance;
        node.method(methodName);
        this._instance = oldInstance;
    }

    setLocalVariableDefault(name, data){
        this._localVariableDefaults.set(name, data);
    }
}