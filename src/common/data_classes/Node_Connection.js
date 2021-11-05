class Node_Connection{
    constructor(inpObj = {}){
        this.id = inpObj.id;
        this.type = inpObj.type;
        this.canConnect = inpObj.canConnect;
        this.startNode = inpObj.startNode ?? null;
        this.startSocketId = inpObj.startSocketId ?? null;
        this.startSocketEl = inpObj.startSocketEl ?? null;
        this.endNode = inpObj.endNode ?? null;
        this.endSocketId = inpObj.endSocketId ?? null;
        this.endSocketEl = inpObj.endSocketEl ?? null;
        this.registerUpdateCallback = inpObj.registerUpdateCallback;
        this.onConnectCallback = inpObj.onConnectCallback;
    }
}

export default Node_Connection;