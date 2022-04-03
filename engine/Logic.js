import Node from './Node';

export default class Logic{
    constructor(logicData, api){
        this.id = logicData.id;
        this.events = {};
        
        logicData.events.forEach(event => {
            const eventTemplate = Shared.DEFAULT_EVENTS.get(event.entry.templateId);
            const eventNode = new Node(eventTemplate, event.id, api);
            const nodeMap = {};

            //load all nodes into nodeMap
            nodeMap[event.entry.id] = eventNode;

            event.nodes.forEach(node => {
                const nodeTemplate = Shared.NODE_MAP.get(node.templateId);
                const nodeObj = new Node(nodeTemplate, node.nodeId, api);

                nodeObj.widgetData = JSON.parse(node.widgetData);

                //set nodes input values from src
                node.inputs.forEach(srcInput => {
                    nodeObj.inputs[srcInput.id].value = srcInput.value;
                });

                nodeMap[node.nodeId] = nodeObj;
            });

            //loop through connection list and connect nodes
            event.connections.forEach(connection => {
                const {startNodeId, endNodeId, startSocketId, endSocketId} = connection;
                const startNode = nodeMap[startNodeId];
                const endNode = nodeMap[endNodeId];
                const allStartSockets = {...startNode.outTriggers, ...startNode.outputs};
                const allEndSockets = {...endNode.inTriggers, ...endNode.inputs};

                allStartSockets[startSocketId].connection = allEndSockets[endSocketId];
                allEndSockets[endSocketId].connection = allStartSockets[startSocketId];
            });

            this.events[event.entry.templateId] = eventNode;
        });
    }
}