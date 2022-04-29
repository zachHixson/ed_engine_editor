import Node from './Node';

export default class Logic{
    constructor(logicData, api){
        this.id = logicData.id;
        this.events = {};
        this._instance = null;

        const nodes = {};

        //create all nodes
        logicData.nodes.forEach(node => {
            const template = Shared.NODE_MAP[node.templateId];
            const newNode = new Node(template, node.nodeId, api);
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
    }

    executeEvent = (eventName, instance, data)=>{
        this._instance = instance;
        this.events[eventName].forEach(event => event.executeEvent(data));
        this._instance = null;
    }
}