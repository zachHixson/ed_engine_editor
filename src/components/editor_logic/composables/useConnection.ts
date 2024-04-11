import { nextTick } from 'vue';
import type { iHoverSocket } from '../node_components/Socket.vue';
import type { GenericSocket } from '../LogicMain.vue';
import Node_Connection from "../node_components/Node_Connection";
import type Logic from '../node_components/Logic';
import type { iRelinkInfo } from '../node_components/Node.vue';
import type { ActionData, DomRefs, LogicEditorState } from '../LogicMain.vue';
import Core from '@/core';

export type ActionMakeConnectionProps = {connectionObj: Node_Connection, socketOver: iHoverSocket, prevSocket?: GenericSocket};
export type ActionRemoveConnectionProps = {connectionObj: Node_Connection};
export type ActionBatchRemoveConnectionsProps = {connectionObjList: Node_Connection[], connectionObjMap: Map<Logic, Node_Connection[]>};

export default function useConnection(
    props: {selectedAsset: Logic},
    domRefs: DomRefs,
    actionData: ActionData,
    state: LogicEditorState,
){
    const { nodeRefs, connectionRefs } = domRefs; 
    const { actionMap, revertMap, undoStore } = actionData;
    const { draggingConnection } = state;

    function createConnection(connectionObj: Node_Connection): void {
        props.selectedAsset.addConnection(connectionObj);
        draggingConnection.value = connectionObj;
    }
    
    function dragConnection(connectionObj: Node_Connection): void {
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

    function actionMakeConnection({connectionObj, socketOver}: ActionMakeConnectionProps, makeCommit = true): void {
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

        connectionObj.startNode?.onNewConnection(connectionObj);
        connectionObj.endNode?.onNewConnection(connectionObj);
    
        if (makeCommit){
            const prevSocket = undoStore.cache.get('prev_socket');
            const socketOverCopy: any = Object.assign({}, socketOver);
    
            delete socketOverCopy.socketEl;
    
            const data = {connectionObj, socketOver: socketOverCopy, prevSocket} satisfies ActionMakeConnectionProps;
            undoStore.commit({action: Core.LOGIC_ACTION.CONNECT, data});
    
            nextTick(()=>{
                connectionObj.update();
            });
        }
    
        undoStore.cache.delete('prev_socket');
    }
    
    function actionRemoveConnection({connectionObj}: ActionRemoveConnectionProps, makeCommit = true): void {
        makeCommit &&= !!(connectionObj.startNode && connectionObj.endNode);

        connectionObj.startNode?.onRemoveConnection(connectionObj);
        connectionObj.endNode?.onRemoveConnection(connectionObj);
    
        if (makeCommit){
            const data = {connectionObj: Object.assign(new Node_Connection(), connectionObj)};
            const prevSocket = undoStore.cache.get('prev_socket');
    
            Object.assign(data.connectionObj, prevSocket);
            undoStore.cache.delete('prev_socket');
            undoStore.commit({action: Core.LOGIC_ACTION.DISCONNECT, data});
        }

        props.selectedAsset.removeConnection(connectionObj.id);
    }

    function actionBatchRemoveConnections({connectionObjList}: ActionBatchRemoveConnectionsProps, makeCommit = true): void {
        for (let i = 0; i < connectionObjList.length; i++){
            const curConnection = connectionObjList[i];

            curConnection.startNode?.onRemoveConnection(curConnection);
            curConnection.endNode?.onRemoveConnection(curConnection);
        }

        if (makeCommit){
            const clonedList = connectionObjList.map(connection => Object.assign(new Node_Connection(), connection));
            const connectionObjMap = new Map<Logic, Node_Connection[]>
            const data = {connectionObjList, connectionObjMap};

            clonedList.forEach(c => {
                const logic = (c.startNode?.parentScript ?? c.endNode?.parentScript)!;
                let cList = connectionObjMap.get(logic);

                if (!cList){
                    cList = [];
                    connectionObjMap.set(logic, cList);
                }

                cList.push(c);
            });

            undoStore.commit({action: Core.LOGIC_ACTION.BATCH_REMOVE_CONNECTIONS, data});
        }

        for (let i = 0; i < connectionObjList.length; i++){
            const c = connectionObjList[i];
            const parentScript = c.startNode?.parentScript ?? c.endNode?.parentScript!;
            parentScript.removeConnection(connectionObjList[i].id);
        }
    }

    function revertMakeConnection({connectionObj, prevSocket}: ActionMakeConnectionProps): void {
        connectionObj.startNode?.onRemoveConnection(connectionObj, true);
        connectionObj.endNode?.onRemoveConnection(connectionObj, true);

        if (prevSocket){
            Object.assign(connectionObj, prevSocket);
        }
        else{
            props.selectedAsset.removeConnection(connectionObj.id);
        }
    }
    
    function revertRemoveConnection({connectionObj}: ActionRemoveConnectionProps): void {
        props.selectedAsset.addConnection(connectionObj);

        connectionObj.startNode?.onNewConnection(connectionObj, true);
        connectionObj.endNode?.onNewConnection(connectionObj, true);
    }

    function revertBatchRemoveConnections({connectionObjMap}: ActionBatchRemoveConnectionsProps): void {
        connectionObjMap.forEach((cList, logic) => {
            cList.forEach(c => {
                logic.addConnection(c);
                c.startNode?.onNewConnection(c, true);
                c.endNode?.onNewConnection(c, true);
            });
        });
    }

    actionMap.set(Core.LOGIC_ACTION.CONNECT, actionMakeConnection);
    actionMap.set(Core.LOGIC_ACTION.DISCONNECT, actionRemoveConnection);
    actionMap.set(Core.LOGIC_ACTION.BATCH_REMOVE_CONNECTIONS, actionBatchRemoveConnections);
    revertMap.set(Core.LOGIC_ACTION.CONNECT, revertMakeConnection);
    revertMap.set(Core.LOGIC_ACTION.DISCONNECT, revertRemoveConnection);
    revertMap.set(Core.LOGIC_ACTION.BATCH_REMOVE_CONNECTIONS, revertBatchRemoveConnections);

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