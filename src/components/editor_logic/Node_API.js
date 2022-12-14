export default class Node_API {
    constructor(){
        this._editor;
        this._store;
    }

    get editor(){return this._editor};
    get store(){return this._store};

    setNodeEditorContext(editorContext){
        this._editor = editorContext;
    }

    setGlobalStore(store){
        this._store = store;
    }

    getVariableType(name, isGlobal){
        const varMap = isGlobal ? this.editor.globalVariableMap : this.editor.selectedAsset.localVariables;
        return varMap.get(name.toLowerCase());
    }

    setVariableType(name, type, isGlobal){
        const varMap = isGlobal ? this.editor.globalVariableMap : this.editor.selectedAsset.localVariables;
        varMap.set(name, type);
    }

    deleteVariableType(name, isGlobal){
        const varMap = isGlobal ? this.editor.globalVariableMap : this.editor.selectedAsset.localVariables;
        varMap.delete(name);
    }

    getVariableUsage(name, nodeType, isGlobal){
        const usage = [];
        name = name.toLowerCase();

        this.forEachNode(node=>{
            const isVar = node.inputs.get('name')?.value == name;
            const isSetVar = (node.templateId == nodeType) || !nodeType;
            const isDataCon = !!this.getConnection(node, 'data');
            const isConnected = isSetVar && isDataCon;
            const globalMatch = node.inputs.get('global')?.value == isGlobal;

            if (isVar && isConnected && globalMatch){
                usage.push(node);
            }
        }, isGlobal);

        return usage;
    }

    getConnection(node, socketId){
        const allLogic = this.store.getters['GameData/getAllLogic'];
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
    }

    cancelConnection(connection){
        this.revertMakeConnection({connectionObj: connection});
        this.editor.undoStore.popLast();
    }

    batchRemoveConnections(newConnection, breakConnectionList, isGlobal, commit){
        this.actionDisconnectIncompatable({newConnection, breakConnectionList, isGlobal}, commit);
    }

    getConnectedSocket(node, socketId, inputConnection = null){
        const connection = inputConnection ?? this.getConnection(node, socketId);

        if (!connection){
            return;
        }

        const isStart = socketId == connection.startSocketId;
        return isStart ? connection.endSocket : connection.startSocket;
    }

    verifyConnection(node, socketId){
        const connection = this.getConnection(node, socketId);

        if (!connection){
            return;
        }

        const startType = connection.startSocket.type;
        const endType = connection.endSocket.type;

        if (!Shared.canConvertSocket(startType, endType)){
            this.selectedAsset.removeConnection(connection.id);
        }
    }

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
    }

    deleteNode(node){
        this.actionDeleteNodes({nodeRefList: [node]}, false);
    }

    dialogConfirm(textInfo, callback){
        this.$emit('dialog-confirm', {textInfo, callback});
    }

    dialogNewVariable(callback){
        this.dialogNewVariable(callback);
    }
}