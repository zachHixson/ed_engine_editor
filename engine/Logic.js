import Node from './Node';

export default class Logic{
    constructor(logicData, engine){
        this.id = logicData.id;
        this.events = {};
        this._instance = null;
        this._localVariableDefaults = {};

        const nodes = {};

        //create all nodes
        logicData.nodes.forEach(node => {
            const template = Shared.NODE_MAP[node.templateId];
            const newNode = new Node(template, node.nodeId, this, engine);
            nodes[node.nodeId] = newNode;

            if (template.isEvent){
                if (!this.events[node.templateId]){
                    this.events[node.templateId] = [];
                }

                this.events[node.templateId].push(newNode);
            }

            if (node.widgetData){
                newNode.widgetData = JSON.parse(node.widgetData);
            }

            newNode.setInstanceCallback(()=>this._instance);

            node.inputs.forEach(srcInput => {
                newNode.inputs[srcInput.id].value = srcInput.value;
            })
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

        //setup local variable defaults
        for (const v in logicData.localVariables){
            const type = Symbol.for(logicData.localVariables[v]);
            this._localVariableDefaults[v] = Shared.SOCKET_DEFAULT.get(type);
        }
    }

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
}