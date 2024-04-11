import { useLogicEditorStore } from "@/stores/LogicEditor";
import { useGameDataStore } from "@/stores/GameData";
import type Node from "./node_components/Node";
import type Core from '@/core';
import type Node_Connection from "./node_components/Node_Connection";
import { useI18n } from "vue-i18n";
import Undo_Store, { iActionStore } from "../common/Undo_Store";

export type TextInfo = {textId: string, vars: {[keys: string]: any}};

export default class Node_API implements Core.iEditorAPI {
    private _editor!: Core.iEditorAPI['editor'] | null;

    readonly gameDataStore = useGameDataStore();
    readonly logicEditorStore = useLogicEditorStore();

    get editor(){return this._editor!};
    get undoStore(){return this.editor.undoStore as Undo_Store<iActionStore>};
    get globalVariableMap(){
        return this.logicEditorStore.globalVariableMap;
    };

    unMount(): void {
        this._editor = null;
    }

    setNodeEditorContext(editorContext: any): void {
        this._editor = editorContext;
    }

    getGlobalVariable(name: string): Core.iEditorVariable | undefined {
        name = name.trim().toLowerCase();
        return this.globalVariableMap.get(name);
    }

    setGlobalVariable(name: string, type: Core.Node_Enums.SOCKET_TYPE, isList: boolean): void {
        name = name.trim().toLowerCase();
        this.globalVariableMap.set(name, {type, isList});
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

    getInputConnection(node: Core.iEditorNode, socketId: string): Node_Connection | null {
        const logic = node.parentScript;

        if (!logic) return null;

        //find correct connection
        for (let i = 0; i < logic.connections.length; i++){
            const curConnection = logic.connections[i];
            const connectedToNode = curConnection.endNode?.nodeId == node.nodeId;
            const connectedToSocket = curConnection.endSocketId == socketId;

            if (connectedToNode && connectedToSocket){
                return curConnection as Node_Connection;
            }
        }

        return null;
    }

    getOutputConnections(node: Core.iEditorNode, socketId: string): Node_Connection[] {
        const logic = node.parentScript;
        const outputConnections: Node_Connection[] = [];

        if (!logic) return outputConnections;

        //find correct connection
        for (let i = 0; i < logic.connections.length; i++){
            const curConnection = logic.connections[i];
            const connectedToNode = curConnection.startNode?.nodeId == node.nodeId;
            const connectedToSocket = curConnection.startSocketId == socketId;

            if (connectedToNode && connectedToSocket){
                outputConnections.push(curConnection as Node_Connection);
            }
        }

        return outputConnections;
    }

    cancelConnection(connection: Core.iNodeConnection): void {
        this.editor.revertMakeConnection({connectionObj: connection});
        this.undoStore.popLast();
    }

    getConnectedInputSocket(node: Core.iEditorNode, socketId: string, inputConnection?: Node_Connection): Core.iEditorNodeOutput | Core.iEditorNodeInput | undefined {
        const connection = inputConnection ?? this.getInputConnection(node, socketId);

        if (!connection){
            return undefined;
        }

        return connection.startSocket;
    }

    getSelectedNodes(): Node[] {
        return [...this.editor.selectedNodes];
    }

    clearSelectedNodes(): void {
        this.editor.selectedNodes.splice(0, this.editor.selectedNodes.length);
    }

    addNode(node: Node, commit: boolean = true): void {
        this.editor.addNode({templateId: node.templateId, nodeRef: node}, commit);
    }

    deleteNodes(nodeList: Node[], commit: boolean = true): void {
        this.editor.deleteNodes({nodeRefList: nodeList}, commit);
    }

    deleteConnections(connectionList: Node_Connection[], commit: boolean = true): void {
        this.editor.removeConnectionList({connectionObjList: connectionList}, commit);
    }

    forEachNode(callback: (node: Node)=>void, isGlobal = true): void {
        if (isGlobal){
            const allLogic = this.gameDataStore.getAllLogic;

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
        this.editor.emit('dialog-open', {confirmDialog: true, textInfo, callback});
    }

    dialogVariable(callback: (positive: boolean, varInfo: Core.iVarInfo)=>void, edit?: Core.iVarInfo): void {
        this.editor.dialogVariable(callback, edit);
    }

    popLastCommit(){
        return this.undoStore.popLast();
    }

    t(text: string): string {
        const { t } = useI18n();
        return t(text);
    }

    nextTick(callback: ()=>void): void {
        this.editor.nextTick(callback);
    }

    registerAction<T extends {}>(key: any, action: Core.ActionCallback<T>, revert: Core.ActionCallback<T>): void {
        this.editor.actionMap.set(key, action);
        this.editor.revertMap.set(key, revert);
    }

    executeAction<T>(key: any, args: T, commit: boolean): void {
        const data = this.editor.actionMap.get(key)(args, commit) ?? {};
        this.undoStore.commit({action: key, data});
    }
}