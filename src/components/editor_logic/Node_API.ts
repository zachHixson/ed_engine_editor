export default class Node_API {
    constructor(){
        this._editor;
        this._store;
        this._globalVariableMap;
    }

    get editor(){return this._editor};
    get store(){return this._store};
    get globalVariableMap(){return this._globalVariableMap};

    setNodeEditorContext(editorContext){
        this._editor = editorContext;
    }

    setGlobalStore(store){
        this._store = store;
        this._globalVariableMap = this.store.getters['LogicEditor/getGlobalVariableMap'];
    }

    getGlobalVariable(name){
        name = name.trim().toLowerCase();
        return this.globalVariableMap.get(name);
    }

    setGlobalVariable(name, type){
        name = name.trim().toLowerCase();
        this.globalVariableMap.set(name, type);
    }

    deleteGlobalVariable(name){
        name = name.trim().toLowerCase();
        this.globalVariableMap.delete(name);
    }

    getVariableUsage(name, nodeType, isGlobal){
        const usage = [];
        name = name.trim().toLowerCase();

        this.forEachNode(node=>{
            const curVarName = node.inputs.get('name')?.value.trim().toLowerCase();
            const isVarMatch = curVarName == name;
            const isVarNode = node.templateId == 'set_variable' || node.templateId == 'get_variable';
            const isUsage = nodeType?.includes(node.templateId) || isVarNode;
            const isGlobalMatch = isGlobal ^ !!node.parentScript.localVariables.get(name);

            if (isVarMatch && isUsage && isGlobalMatch){
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

        if (!logic) return;

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

    getConnectedSocket(node, socketId, inputConnection = null){
        const connection = inputConnection ?? this.getConnection(node, socketId);

        if (!connection){
            return;
        }

        const isStart = socketId == connection.startSocketId;
        return isStart ? connection.endSocket : connection.startSocket;
    }

    getSelectedNodes(){
        return [...this.editor.selectedNodes];
    }

    clearSelectedNodes(){
        this.editor.selectedNodes.splice(0, this.editor.selectedNodes.length);
    }

    addNode(node, commit = true){
        this.editor.actionAddNode({templateId: node.templateId, nodeRef: node}, commit);
    }

    deleteNodes(nodeList, commit = true){
        this.editor.actionDeleteNodes({nodeRefList: nodeList}, commit);
    }

    forEachNode(callback, isGlobal = true){
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
            const nodes = this.editor.selectedAsset.nodes;

            for (let i = 0; i < nodes.length; i++){
                callback(nodes[i]);
            }
        }
    }

    dialogConfirm(textInfo, callback){
        this.editor.$emit('dialog-confirm', {textInfo, callback});
    }

    dialogNewVariable(callback){
        this.editor.dialogNewVariable(callback);
    }

    popLastCommit(){
        return this.editor.undoStore.popLast();
    }
}