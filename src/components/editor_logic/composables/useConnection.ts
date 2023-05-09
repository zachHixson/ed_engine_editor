import { ref, nextTick } from 'vue';
import type { iHoverSocket } from '../node_components/Socket.vue';
import type { GenericSocket } from './sharedTypes';
import Node_Connection from "../node_components/Node_Connection";
import type Connection from '../node_components/Connection.vue';
import type Node from '@/components/editor_logic/node_components/Node.vue';
import type Logic from '../node_components/Logic';
import type { iRelinkInfo } from '../node_components/Node.vue';
import type { ActionMap } from './sharedTypes';
import type Undo_Store from '@/components/common/Undo_Store';
import type { iActionStore } from '@/components/common/Undo_Store';
import Core from '@/core';

export type ActionMakeConnectionProps = {connectionObj: Node_Connection, socketOver: iHoverSocket, prevSocket?: GenericSocket};
export type ActionRemoveConnectionProps = {connectionObj: Node_Connection};
export type ActionBatchRemoveConnectionsProps = {connectionObjList: Node_Connection[]};

export default function useConnection(
    props: {selectedAsset: Logic},
    actionMap: ActionMap,
    revertMap: ActionMap,
    undoStore: Undo_Store<iActionStore>
){
    const draggingConnection = ref<Node_Connection | null>(null);
    const nodeRefs = ref<InstanceType<typeof Node>[]>([]);
    const connectionRefs = ref<InstanceType<typeof Connection>[]>([]);

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
    
        connectionObj.startNode?.onNewConnection && connectionObj.startNode.onNewConnection(connectionObj);
        connectionObj.endNode?.onNewConnection && connectionObj.endNode.onNewConnection(connectionObj);
    
        //if connection was removed entirely by a previous undo, we need to recreate
        if (!props.selectedAsset.connections.includes(connectionObj)){
            props.selectedAsset.addConnection(connectionObj);
        }
    
        //if this is being connected through a redo, then the socketEl reference might be deprecated and needs a relink
        if (!socketOver.socketEl){
            nextTick(()=>{
                relinkConnections();
            })
        }
    
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
    
        if (makeCommit){
            const data = {connectionObj: Object.assign(new Node_Connection(), connectionObj)};
            const prevSocket = undoStore.cache.get('prev_socket');
    
            Object.assign(data.connectionObj, prevSocket);
            undoStore.commit({action: Core.LOGIC_ACTION.DISCONNECT, data});
        }
    
        props.selectedAsset.removeConnection(connectionObj.id);
        connectionObj.startNode?.onRemoveConnection && connectionObj.startNode?.onRemoveConnection(connectionObj);
        connectionObj.endNode?.onRemoveConnection && connectionObj.endNode?.onRemoveConnection(connectionObj);
    }

    function actionBatchRemoveConnections({connectionObjList}: ActionBatchRemoveConnectionsProps, makeCommit = true): void {
        if (makeCommit){
            const clonedList = connectionObjList.map(connection => Object.assign(new Node_Connection(), connection));
            const data = {connectionObjList: clonedList};
            undoStore.commit({action: Core.LOGIC_ACTION.BATCH_REMOVE_CONNECTIONS, data});
        }

        for (let i = 0; i < connectionObjList.length; i++){
            const curConnection = connectionObjList[i];

            props.selectedAsset.removeConnection(curConnection.id);
            curConnection.startNode?.onRemoveConnection && curConnection.startNode?.onRemoveConnection(curConnection);
            curConnection.endNode?.onRemoveConnection && curConnection.endNode?.onRemoveConnection(curConnection);
        }
    }

    function revertMakeConnection({connectionObj, prevSocket}: ActionMakeConnectionProps): void {
        if (prevSocket){
            Object.assign(connectionObj, prevSocket);
            relinkConnections();
        }
        else{
            props.selectedAsset.removeConnection(connectionObj.id);
        }
    }
    
    function revertRemoveConnection({connectionObj}: ActionRemoveConnectionProps): void {
        props.selectedAsset.addConnection(connectionObj);
        
        nextTick(()=>{
            relinkConnections();
        });
    }

    function revertBatchRemoveConnections({connectionObjList}: ActionBatchRemoveConnectionsProps): void {
        for (let i = 0; i < connectionObjList.length; i++){
            props.selectedAsset.addConnection(connectionObjList[i]);
        }

        nextTick(()=>{
            relinkConnections();
        });
    }

    actionMap.set(Core.LOGIC_ACTION.CONNECT, actionMakeConnection);
    actionMap.set(Core.LOGIC_ACTION.DISCONNECT, actionRemoveConnection);
    actionMap.set(Core.LOGIC_ACTION.BATCH_REMOVE_CONNECTIONS, actionBatchRemoveConnections);
    revertMap.set(Core.LOGIC_ACTION.CONNECT, revertMakeConnection);
    revertMap.set(Core.LOGIC_ACTION.DISCONNECT, revertRemoveConnection);
    revertMap.set(Core.LOGIC_ACTION.BATCH_REMOVE_CONNECTIONS, revertBatchRemoveConnections);

    return {
        nodeRefs,
        connectionRefs,
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