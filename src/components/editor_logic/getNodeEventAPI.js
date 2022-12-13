const API = {
    getVariableType(name, isGlobal){
        const varMap = isGlobal ? this.globalVariableMap : this.selectedAsset.localVariables;
        return varMap.get(name.toLowerCase());
    },
    setVariableType(name, type, isGlobal){
        const varMap = isGlobal ? this.globalVariableMap : this.selectedAsset.localVariables;
        varMap.set(name, type);
    },
    deleteVariableType(name, isGlobal){
        const varMap = isGlobal ? this.globalVariableMap : this.selectedAsset.localVariables;
        varMap.delete(name);
    },
    getVariableUsage(name, nodeType, isGlobal){
        const usage = [];
        name = name.toLowerCase();

        this.nodeEventAPI.forEachNode(node=>{
            const isVar = node.inputs.get('name')?.value == name;
            const isSetVar = (node.templateId == nodeType) || !nodeType;
            const isDataCon = !!this.nodeEventAPI.getConnection(node, 'data');
            const isConnected = isSetVar && isDataCon;
            const globalMatch = node.inputs.get('global')?.value == isGlobal;

            if (isVar && isConnected && globalMatch){
                usage.push(node);
            }
        }, isGlobal);

        return usage;
    },
    getConnection(node, socketId){
        const allLogic = this.$store.getters['GameData/getAllLogic'];
        let logic;

        //find correct logic script
        for (let l = 0; l < allLogic.length; l++){
            const curLogic = allLogic[l];

            for (let n = 0; n < curLogic.nodes.length; n++){
                if (curLogic.nodes[n] == node){
                    logic = curLogic;
                }
            }
        }

        //find correct connection
        for (let i = 0; i < logic.connections.length; i++){
            const curConnection = logic.connections[i];
            const isStart = curConnection.startNode == node;
            const isEnd = curConnection.endNode == node;
            const connectedToNode =  isStart || isEnd;
            const thisSocket = isStart ? curConnection.startSocketId : curConnection.endSocketId;
            const connectedToSocket = thisSocket == socketId;

            if (connectedToNode && connectedToSocket){
                return curConnection;
            }
        }

        return null;
    },
    cancelConnection(connection){
        this.revertMakeConnection({connectionObj: connection});
        this.undoStore.popLast();
    },
    batchRemoveConnections(newConnection, breakConnectionList, isGlobal, commit){
        this.actionDisconnectIncompatable({newConnection, breakConnectionList, isGlobal}, commit);
    },
    getConnectedSocket(node, socketId, inputConnection = null){
        const connection = inputConnection ?? this.nodeEventAPI.getConnection(node, socketId);

        if (!connection){
            return;
        }

        const isStart = socketId == connection.startSocketId;
        return isStart ? connection.endSocket : connection.startSocket;
    },
    verifyConnection(node, socketId){
        const connection = this.nodeEventAPI.getConnection(node, socketId);

        if (!connection){
            return;
        }

        const startType = connection.startNode.anyType ?? connection.startSocket.type;
        const endType = connection.endNode.anyType ?? connection.endSocket.type;

        if (!Shared.canConvertSocket(startType, endType)){
            this.selectedAsset.removeConnection(connection.id);
        }
    },
    updateVisibleVariableTypes(varName){
        const nodes = this.selectedAsset.nodes;

        varName = varName.toLowerCase();

        if (!varName.trim().length){
            return;
        }

        for (let i = 0; i < nodes.length; i++){
            const node = nodes[i];
            const {templateId} = node;
            const isVarNode = templateId == 'set_variable' || templateId == 'get_variable';
            const isVarName = node.inputs.get('name')?.value == varName;

            if (isVarNode && isVarName){
                if (node.getInput('global')){
                    node.anyType = this.globalVariableMap.get(varName) ?? null;
                }
                else{
                    node.anyType = this.selectedAsset.localVariables.get(varName) ?? null;
                }
            }
        }
    },
    forEachNode(callback, isGlobal){
        if (isGlobal){
            const allLogic = this.$store.getters['GameData/getAllLogic'];

            for (let l = 0; l < allLogic.length; l++){
                const curLogic = allLogic[l];
    
                for (let n = 0; n < curLogic.nodes.length; n++){
                    callback(curLogic.nodes[n]);
                }
            }
        }
        else{
            const nodes = this.selectedAsset.nodes;

            for (let i = 0; i < nodes.length; i++){
                callback(nodes[i]);
            }
        }
    },
    dialogConfirm(textInfo, callback){
        this.$emit('dialog-confirm', {textInfo, callback});
    },
    dialogNewVariable(callback){
        this.dialogNewVariable(callback);
    }
};

export default function(context){
    const returnAPI = {};

    for (const i in API){
        returnAPI[i] = API[i].bind(context);
    }

    return returnAPI;
}