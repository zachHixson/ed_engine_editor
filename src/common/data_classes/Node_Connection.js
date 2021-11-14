class Node_Connection{
    constructor(inpObj = {}){
        this.id = inpObj.id;
        this.type = inpObj.type;
        this.canConnect = inpObj.canConnect;
        this.connectionComponent = inpObj.connectionComponent ?? null;
        this.startNode = inpObj.startNode ?? null;
        this.startSocketId = inpObj.startSocketId ?? null;
        this.startSocketEl = inpObj.startSocketEl ?? null;
        this.endNode = inpObj.endNode ?? null;
        this.endSocketId = inpObj.endSocketId ?? null;
        this.endSocketEl = inpObj.endSocketEl ?? null;
    }

    componentDestructor(){
        this.connectionComponent = null;
        this.startSocketEl = null;
        this.endSocketEl = null;
    }

    toSaveData(){
        let {id, type, startNode, startSocketId, endNode, endSocketId} = this;
        let startNodeId = startNode.nodeId;
        let endNodeId = endNode.nodeId;

        return {id, type, startNodeId, startSocketId, endNodeId, endSocketId};
    }

    fromSaveData(data, nodeMap){
        this.startNode = nodeMap.get(data.startNodeId);
        this.endNode = nodeMap.get(data.endNodeId);

        return this;
    }

    updateComponent(){
        this.connectionComponent.update();
    }
}

export default Node_Connection;