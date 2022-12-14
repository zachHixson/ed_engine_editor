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
        const globalVariableMap = this.store.getters['LogicEditor/getGlobalVariableMap'];
        const localVariableMap = this.editor?.selectedAsset.localVariables;
        const varName = name.trim().toLowerCase();
        
        if (isGlobal === undefined){
            return localVariableMap?.get(varName) ?? globalVariableMap.get(varName);
        }
        else{
            return isGlobal ? globalVariableMap.get(varName) : localVariableMap?.get(varName);
        }
    }

    setVariableType(name, type, isGlobal){
        const globalVariableMap = this.store.getters['LogicEditor/getGlobalVariableMap'];
        const varMap = isGlobal ? globalVariableMap : this.editor.selectedAsset.localVariables;
        const varName = name.trim().toLowerCase();
        varMap.set(varName, type);
    }

    deleteVariableType(name, isGlobal){
        const globalVariableMap = this.store.getters['LogicEditor/getGlobalVariableMap'];
        const varMap = isGlobal ? globalVariableMap : this.editor.selectedAsset.localVariables;
        const varName = name.trim().toLowerCase();
        varMap.delete(varName);
    }

    getVariableUsage(name, nodeType, isGlobal){
        const usage = [];
        name = name.trim().toLowerCase();

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
        const logic = allLogic.find(logic => {
            const nodes = logic.nodes;

            for (let n = 0; n < nodes.length; n++){
                if (nodes[n] == node){
                    return logic;
                }
            }
        });

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
            const allLogic = this.store.getters['GameData/getAllLogic'];

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

    dispatchAll(eventObj){
        this.forEachNode(node => {
            node.dispatchEvent(eventObj);
        }, true);
    }

    deleteNode(node){
        this.actionDeleteNodes({nodeRefList: [node]}, false);
    }

    dialogConfirm(textInfo, callback){
        this.$emit('dialog-confirm', {textInfo, callback});
    }

    dialogNewVariable(callback){
        this.editor.dialogNewVariable(callback);
    }
}