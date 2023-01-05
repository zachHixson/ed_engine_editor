import { useLogicEditorStore } from "@/stores/LogicEditor";
import { useGameDataStore } from "@/stores/GameData";
import type Node from "./Node";
import type Core from '@/core';
import type Node_Connection from "./Node_Connection";

export type TextInfo = {textId: string, vars: {[keys: string]: any}};

export default class Node_API implements Core.iEditorAPI {
    _editor: any;

    get editor(){return this._editor};
    get globalVariableMap(){
        const logicEditorStore = useLogicEditorStore();
        return logicEditorStore.globalVariableMap;
    };

    setNodeEditorContext(editorContext: any): void {
        this._editor = editorContext;
    }

    getGlobalVariable(name: string): Core.Node_Enums.SOCKET_TYPE | undefined {
        name = name.trim().toLowerCase();
        return this.globalVariableMap.get(name);
    }

    setGlobalVariable(name: string, type: Core.Node_Enums.SOCKET_TYPE): void {
        name = name.trim().toLowerCase();
        this.globalVariableMap.set(name, type);
    }

    deleteGlobalVariable(name: string): void {
        name = name.trim().toLowerCase();
        this.globalVariableMap.delete(name);
    }

    getVariableUsage(name: string, nodeType: string | null, isGlobal: boolean): Node[] {
        const usage: Node[] = [];
        name = name.trim().toLowerCase();

        this.forEachNode(node => {
            const curVarName = node.inputs.get('name')?.value.trim().toLowerCase();
            const isVarMatch = curVarName == name;
            const isVarNode = node.templateId == 'set_variable' || node.templateId == 'get_variable';
            const isUsage = nodeType?.includes(node.templateId) || isVarNode;
            const isGlobalMatch = isGlobal != !!node.parentScript.localVariables.get(name);

            if (isVarMatch && isUsage && isGlobalMatch){
                usage.push(node);
            }
        }, isGlobal);

        return usage;
    }

    getConnection(node: Core.iEditorNode, socketId: string): Node_Connection | null {
        const logic = node.parentScript;

        if (!logic) return null;

        //find correct connection
        for (let i = 0; i < logic.connections.length; i++){
            const curConnection = logic.connections[i];
            const isStart = curConnection.startNode?.nodeId == node.nodeId;
            const isEnd = curConnection.endNode?.nodeId == node.nodeId;
            const connectedToNode =  isStart || isEnd;
            const thisSocket = isStart ? curConnection.startSocketId : curConnection.endSocketId;
            const connectedToSocket = thisSocket == socketId;

            if (connectedToNode && connectedToSocket){
                return curConnection as Node_Connection;
            }
        }

        return null;
    }

    cancelConnection(connection: Core.iNodeConnection): void {
        this.editor.revertMakeConnection({connectionObj: connection});
        this.editor.undoStore.popLast();
    }

    getConnectedSocket(node: Core.iEditorNode, socketId: string, inputConnection?: Node_Connection): Core.iEditorNodeOutput | Core.iEditorNodeInput | undefined {
        const connection = inputConnection ?? this.getConnection(node, socketId);

        if (!connection){
            return undefined;
        }

        const isStart = socketId == connection.startSocketId;
        return isStart ? connection.endSocket : connection.startSocket;
    }

    getSelectedNodes(): Node[] {
        return [...this.editor.selectedNodes];
    }

    clearSelectedNodes(): void {
        this.editor.selectedNodes.splice(0, this.editor.selectedNodes.length);
    }

    addNode(node: Node, commit: boolean = true): void {
        this.editor.actionAddNode({templateId: node.templateId, nodeRef: node}, commit);
    }

    deleteNodes(nodeList: Node[], commit: boolean = true): void {
        this.editor.actionDeleteNodes({nodeRefList: nodeList}, commit);
    }

    forEachNode(callback: (node: Node)=>void, isGlobal = true): void {
        if (isGlobal){
            const gameDataStore = useGameDataStore();
            const allLogic = gameDataStore.getAllLogic;

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

    dialogConfirm(textInfo: TextInfo, callback: (positive: boolean)=>any){
        this.editor.emit('dialog-confirm', {textInfo, callback});
    }

    dialogNewVariable(callback: (positive: boolean, varInfo: Core.iNewVarInfo)=>void): void {
        this.editor.dialogNewVariable(callback);
    }

    popLastCommit(){
        return this.editor.undoStore.popLast();
    }
}