import { useLogicEditorStore } from "@/stores/LogicEditor";
import { useGameDataStore } from "@/stores/GameData";
import { useI18nStore } from "@/stores/I18n";
import type Core from '@/core';
import type Node_Connection from "./node_components/Node_Connection";
import Undo_Store from "../common/Undo_Store";

import type useNode from "./composables/useNode";
import type useConnection from "./composables/useConnection";
import type { nextTick } from "vue";
import { LOGIC_ACTION } from "./LogicMain.vue";
import { DIALOG_TYPE, type DialogBoxProps } from '@/components/DialogBox.vue';
import type Logic from "./node_components/Logic";

export type TextInfo = {textId: string, vars: {[keys: string]: unknown}};
export type ActionMap = Map<LOGIC_ACTION, Core.ActionCallback>;

type Editor = {
    addNode: ReturnType<typeof useNode>['addNode'];
    deleteNodes: ReturnType<typeof useNode>['deleteNodes'];
    revertMakeConnection: ReturnType<typeof useConnection>['revertMakeConnection'];
    removeConnectionList: ReturnType<typeof useConnection>['removeConnectionList'];
    relinkConnections: ReturnType<typeof useConnection>['relinkConnections'];
    dialogVariable: (callback: (positive: boolean, varInfo: Core.iVarInfo)=>void, edit?: Core.iVarInfo) => void;
    nextTick: typeof nextTick;
    undoStore: Undo_Store<Core.ActionCallbackData>;
    actionMap: ActionMap;
    revertMap: ActionMap;
    dialogOpen: (props: DialogBoxProps) => void;
    getSelectedNodes: () => Core.iEditorNode[];
    getSelectedAsset: () => Logic;
};

export default class Node_API implements Core.iEditorAPI {
    private _editor: Editor | null = null;

    readonly gameDataStore = useGameDataStore();
    readonly logicEditorStore = useLogicEditorStore();

    private _checkEditor(editor: Editor | null): asserts editor is NonNullable<Editor> {
        if (editor) return;
        throw new Error('Attempted to access Node_API editor context before editor context has been set');
    }

    get undoStore(){
        this._checkEditor(this._editor);
        return this._editor.undoStore as Undo_Store<Core.ActionCallbackData>
    };
    get globalVariableMap(){
        return this.logicEditorStore.globalVariableMap;
    };

    unMount(): void {
        this._editor = null;
    }

    setNodeEditorContext(editorContext: Editor): void {
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

    getVariableUsage(name: string, nodeType: string | null, isGlobal: boolean): Core.iEditorNode[] {
        const usage: Core.iEditorNode[] = [];
        name = name.trim().toLowerCase();

        this.forEachNode(node => {
            const nameInput = node.inputs.get('name');

            if (!nameInput) return;

            const curVarName = (nameInput.value as string).trim().toLowerCase();
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

    getConnectedInputSocket(node: Core.iEditorNode, socketId: string, inputConnection?: Node_Connection): Core.iEditorNodeOutput | Core.iEditorNodeInput | undefined {
        const connection = inputConnection ?? this.getInputConnection(node, socketId);

        if (!connection){
            return undefined;
        }

        return connection.startSocket;
    }

    getSelectedNodes(): Core.iEditorNode[] {
        this._checkEditor(this._editor);
        return [...this._editor.getSelectedNodes()];
    }

    clearSelectedNodes(): void {
        this._checkEditor(this._editor);
        const selectedNodes = this._editor.getSelectedNodes();
        selectedNodes.splice(0, selectedNodes.length);
    }

    addNode(node: Core.iEditorNode, commit: boolean = true): void {
        const data = {actionType: LOGIC_ACTION.ADD_NODE, templateId: node.templateId, nodeRef: node} as Core.ActionCallbackData;
        this._checkEditor(this._editor);
        this._editor.addNode(data, commit);
    }

    deleteNodes(nodeList: Core.iEditorNode[], commit: boolean = true): void {
        const data = {actionType: LOGIC_ACTION.DELETE_NODES, nodeRefList: nodeList} as Core.ActionCallbackData;
        this._checkEditor(this._editor);
        this._editor.deleteNodes(data, commit);
    }

    deleteConnections(connectionList: Core.iNodeConnection[], commit: boolean = true): void {
        const data = {actionType: LOGIC_ACTION.BATCH_REMOVE_CONNECTIONS, connectionObjList: connectionList} as Core.ActionCallbackData;
        this._checkEditor(this._editor);
        this._editor.removeConnectionList(data, commit);
    }

    forEachNode(callback: (node: Core.iEditorNode)=>void, isGlobal = true): void {
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
            this._checkEditor(this._editor);
            const nodes = this._editor.getSelectedAsset().nodes;

            for (let i = 0; i < nodes.length; i++){
                callback(nodes[i]);
            }
        }
    }

    dialogConfirm(textInfo: TextInfo, callback: (positive: boolean)=>void){
        this._checkEditor(this._editor);
        this._editor.dialogOpen({type: DIALOG_TYPE.CONFIRM, textInfo, callback});
    }

    dialogVariable(callback: (positive: boolean, varInfo: Core.iVarInfo)=>void, edit?: Core.iVarInfo): void {
        this._checkEditor(this._editor);
        this._editor.dialogVariable(callback, edit);
    }

    popLastCommit(){
        return this.undoStore.popLast();
    }

    t(text: string): string {
        const { t } = useI18nStore();
        return t(text);
    }

    nextTick(callback: ()=>void): void {
        this._checkEditor(this._editor);
        this._editor.nextTick(callback);
    }

    registerAction(key: LOGIC_ACTION, action: Core.ActionCallback, revert: Core.ActionCallback): void {
        this._checkEditor(this._editor);
        this._editor.actionMap.set(key, action);
        this._editor.revertMap.set(key, revert);
    }

    executeAction<T extends Core.ActionCallbackData>(key: LOGIC_ACTION, args: T, commit: boolean): void {
        this._checkEditor(this._editor);
        const action = this._editor.actionMap.get(key);
        if (!action) throw new Error('failure to get action');
        const data = action(args, commit) ?? {actionType: args.actionType};
        this.undoStore.commit(data);
    }

    pushNodeException(data: Core.iNodeExceptionData): void {
        this.logicEditorStore.addError(data);
    }

    clearNodeException(errorId: symbol): void {
        this.logicEditorStore.clearError(errorId);
    }
}
