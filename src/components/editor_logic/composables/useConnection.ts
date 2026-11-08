import { nextTick } from 'vue';
import type { iHoverSocket } from '@/components/editor_logic/node_components/Socket.vue';
import type { GenericSocket } from '@/components/editor_logic/LogicMain.vue';
import Node_Connection from "@/components/editor_logic/node_components/Node_Connection";
import type Logic from '@/components/editor_logic/node_components/Logic';
import type { iRelinkInfo } from '@/components/editor_logic/node_components/Node.vue';
import type { ActionData, DomRefs, LogicEditorState } from '@/components/editor_logic/LogicMain.vue';
import type { ActionCallbackData } from '@engine/core/interfaces';
import type { iEditorLogic, iNodeConnection } from '@engine/core/LogicInterfaces';
import { LOGIC_ACTION } from '@/components/editor_logic/LogicMain.vue';

export type ActionMakeConnectionProps = {actionType: LOGIC_ACTION.CONNECT, connectionObj: Node_Connection, socketOver: iHoverSocket, prevSocket?: GenericSocket};
export type ActionRemoveConnectionProps = {actionType: LOGIC_ACTION.DISCONNECT, connectionObj: Node_Connection};
export type ActionBatchRemoveConnectionsProps = {actionType: LOGIC_ACTION.BATCH_REMOVE_CONNECTIONS, connectionObjList: Node_Connection[], connectionObjMap?: Map<Logic, Node_Connection[]>};

export default function useConnection(
    props: {selectedAsset: Logic},
    domRefs: DomRefs,
    actionData: ActionData,
    state: LogicEditorState,
){
    const { nodeRefs, connectionRefs } = domRefs;
    const { actionMap, revertMap, undoStore } = actionData;
    const { draggingConnection } = state;

    function createConnection(connectionObj: iNodeConnection): void {
        props.selectedAsset.addConnection(connectionObj);
        draggingConnection.value = connectionObj;
    }

    function dragConnection(connectionObj: iNodeConnection): void {
        const {startNode, startSocketId, endNode, endSocketId} = connectionObj;

        draggingConnection.value = connectionObj;
        undoStore.cache.set('prev_socket', {startNode, startSocketId, endNode, endSocketId});
    }

    function relinkConnections(): void {
        const nodeEls = nodeRefs.value;
        const connectionEls = connectionRefs.value;
        const nodeInfo = new Map<number, iRelinkInfo>();

        nodeEls.forEach(nodeEl => {
            const info = nodeEl.getRelinkInfo();
            nodeInfo.set(info.id, info);
        });

        connectionEls?.forEach(connectionEl => connectionEl.relink(nodeInfo));
    }

    function actionMakeConnection(data: ActionCallbackData, makeCommit = true): void {
        if (data.actionType != LOGIC_ACTION.CONNECT) return;

        const { connectionObj, socketOver } = data as ActionMakeConnectionProps;

        if (socketOver.isInput){
            connectionObj.endNode = socketOver.node!;
            connectionObj.endSocketId = socketOver.socketData.id;
            connectionObj.endSocketEl = socketOver.socketEl;
        }
        else{
            connectionObj.startNode = socketOver.node!;
            connectionObj.startSocketId = socketOver.socketData.id;
            connectionObj.startSocketEl = socketOver.socketEl;
        }

        //if connection was removed entirely by a previous undo, we need to recreate
        if (!props.selectedAsset.connections.includes(connectionObj)){
            props.selectedAsset.addConnection(connectionObj);
        }

        connectionObj.startNode?.onNewConnection && connectionObj.startNode.onNewConnection(connectionObj);
        connectionObj.endNode?.onNewConnection && connectionObj.endNode.onNewConnection(connectionObj);

        if (makeCommit){
            const prevSocket = undoStore.cache.get('prev_socket') as GenericSocket;
            const socketOverCopy = Object.assign({}, socketOver);

            socketOverCopy.socketEl = null;

            const data: ActionMakeConnectionProps = {actionType: LOGIC_ACTION.CONNECT, connectionObj, socketOver: socketOverCopy, prevSocket};
            undoStore.commit(data);

            nextTick(()=>{
                connectionObj.update();
            });
        }

        undoStore.cache.delete('prev_socket');
    }

    function actionRemoveConnection(data: ActionCallbackData, makeCommit = true): void {
        if (data.actionType != LOGIC_ACTION.DISCONNECT) return;

        const { connectionObj } = data as ActionRemoveConnectionProps;
        const { startNode, endNode } = connectionObj;

        makeCommit &&= !!(connectionObj.startNode && connectionObj.endNode);

        startNode?.onRemoveConnection && startNode.onRemoveConnection(connectionObj);
        endNode?.onRemoveConnection && endNode.onRemoveConnection(connectionObj);

        if (makeCommit){
            const data = {actionType: LOGIC_ACTION.DISCONNECT, connectionObj: Object.assign(new Node_Connection({id: 0}), connectionObj)};
            const prevSocket = undoStore.cache.get('prev_socket');

            Object.assign(data.connectionObj, prevSocket);
            undoStore.cache.delete('prev_socket');
            undoStore.commit(data);
        }

        props.selectedAsset.removeConnection(connectionObj.id);
    }

    function actionBatchRemoveConnections(data: ActionCallbackData, makeCommit = true): void {
        if (data.actionType != LOGIC_ACTION.BATCH_REMOVE_CONNECTIONS) return;

        const { connectionObjList } = data as ActionBatchRemoveConnectionsProps;

        for (let i = 0; i < connectionObjList.length; i++){
            const curConnection = connectionObjList[i];
            const { startNode, endNode } = curConnection;

            startNode?.onRemoveConnection && startNode.onRemoveConnection(curConnection);
            endNode?.onRemoveConnection && endNode.onRemoveConnection(curConnection);
        }

        if (makeCommit){
            const clonedList = connectionObjList.map(connection => Object.assign(new Node_Connection({id: 0}), connection));
            const connectionObjMap = new Map<iEditorLogic, iNodeConnection[]>
            const data = {actionType: LOGIC_ACTION.BATCH_REMOVE_CONNECTIONS, connectionObjList, connectionObjMap};

            clonedList.forEach(c => {
                const logic = (c.startNode?.parentScript ?? c.endNode?.parentScript)!;
                let cList = connectionObjMap.get(logic);

                if (!cList){
                    cList = [];
                    connectionObjMap.set(logic, cList);
                }

                cList.push(c);
            });

            undoStore.commit(data);
        }

        for (let i = 0; i < connectionObjList.length; i++){
            const c = connectionObjList[i];
            const parentScript = c.startNode?.parentScript ?? c.endNode?.parentScript!;
            parentScript.removeConnection(connectionObjList[i].id);
        }
    }

    function revertMakeConnection(data: ActionCallbackData): void {
        if (data.actionType != LOGIC_ACTION.CONNECT) return;

        const { connectionObj, prevSocket } = data as ActionMakeConnectionProps;
        const { startNode, endNode } = connectionObj;

        startNode?.onRemoveConnection && startNode.onRemoveConnection(connectionObj, true);
        endNode?.onRemoveConnection && endNode.onRemoveConnection(connectionObj, true);

        if (prevSocket){
            Object.assign(connectionObj, prevSocket);
        }
        else{
            props.selectedAsset.removeConnection(connectionObj.id);
        }
    }

    function revertRemoveConnection(data: ActionCallbackData): void {
        if (data.actionType != LOGIC_ACTION.DISCONNECT) return;

        const { connectionObj } = data as ActionRemoveConnectionProps;
        const { startNode, endNode } = connectionObj;

        props.selectedAsset.addConnection(connectionObj);

        startNode?.onNewConnection && startNode.onNewConnection(connectionObj, true);
        endNode?.onNewConnection && endNode.onNewConnection(connectionObj, true);
    }

    function revertBatchRemoveConnections(data: ActionCallbackData): void {
        if (data.actionType != LOGIC_ACTION.BATCH_REMOVE_CONNECTIONS) return;

        const { connectionObjMap } = data as ActionBatchRemoveConnectionsProps;

        if (!connectionObjMap) {
            throw new Error('Attempting to revert actionBatchRemoveConnections, but no connectionObjMap provided');
        }

        connectionObjMap.forEach((cList, logic) => {
            cList.forEach(c => {
                logic.addConnection(c);
                c.startNode?.onNewConnection && c.startNode.onNewConnection(c, true);
                c.endNode?.onNewConnection && c.endNode.onNewConnection(c, true);

                //clear node exception
                c.startNode!.editorAPI.clearNodeException(Symbol.for(c.id.toString() + 'connection_deleted'));
            });
        });
    }

    actionMap.set(LOGIC_ACTION.CONNECT, actionMakeConnection);
    actionMap.set(LOGIC_ACTION.DISCONNECT, actionRemoveConnection);
    actionMap.set(LOGIC_ACTION.BATCH_REMOVE_CONNECTIONS, actionBatchRemoveConnections);
    revertMap.set(LOGIC_ACTION.CONNECT, revertMakeConnection);
    revertMap.set(LOGIC_ACTION.DISCONNECT, revertRemoveConnection);
    revertMap.set(LOGIC_ACTION.BATCH_REMOVE_CONNECTIONS, revertBatchRemoveConnections);

    return {
        draggingConnection,
        dragConnection,
        relinkConnections,
        createConnection,
        makeConnection: actionMakeConnection,
        removeConnection: actionRemoveConnection,
        removeConnectionList: actionBatchRemoveConnections,
        revertMakeConnection,
    };
}
