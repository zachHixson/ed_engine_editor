import { nextTick } from 'vue';
import type { Ref, ComputedRef } from 'vue';
import type { default as Node_Obj } from '../node_components/Node';
import type Logic from '../node_components/Logic';
import type Node_Connection from '../node_components/Node_Connection';
import { useMainStore } from '@/stores/Main';
import { useLogicEditorStore } from '@/stores/LogicEditor';
import type Undo_Store from '@/components/common/Undo_Store';
import type { iActionStore } from '@/components/common/Undo_Store';
import type { ActionMap } from './sharedTypes';
import { mouseDownPos, shiftDown } from './useInput';
import Core from '@/core';

type ActionAddNodeProps = {templateId: string, nodeRef?: Node_Obj};
type ActionDeleteNodesProps = {nodeRefList: Node_Obj[], connectionRefMap?: Map<Logic, Node_Connection[]>};
export type ActionMoveNodesProps = {nodeRefList: Node_Obj[], velocity: Core.Vector};

const { Vector } = Core;

export default function useNode(
    props: { selectedAsset: Logic },
    actionMap: ActionMap,
    revertMap: ActionMap,
    undoStore: Undo_Store<iActionStore>,
    navHotkeyTool: Ref<Core.NAV_TOOL_TYPE | null>,
    isDraggingNode: Ref<boolean>,
    nodeViewportRef: Ref<HTMLDivElement | undefined>,
    visibleNodes: ComputedRef<Node_Obj[]>,
    selectedNodes: ComputedRef<Node_Obj[]>,
    clientToNavPos: (pos: Core.Vector)=>Core.Vector,
    relinkConnections: ()=>void,
){
    const mainStore = useMainStore();
    const logicEditorStore = useLogicEditorStore();

    const contentsBounds = [0, 0, 0, 0];

    function nodeClick({nodeObj, event}: {nodeObj: Node_Obj, event: MouseEvent}): void {
        const mousePos = new Vector(event.clientX, event.clientY);
    
        if (mouseDownPos.distanceTo(mousePos) < 2){
            deselectAllNodes();
            selectedNodes.value.push(nodeObj);
        }
    }
    
    function nodeDown(node: Node_Obj): void {
        const alreadySelected = !!selectedNodes.value.find(n => n.nodeId == node.nodeId);
        const navHotkeyActive = navHotkeyTool.value != null;
        const navToolSelected = logicEditorStore.getSelectedNavTool != null;
    
        if (!alreadySelected) {
            if (!shiftDown.value){
                deselectAllNodes();
            }
    
            selectedNodes.value.push(node);
        }
    
        if (!(navHotkeyActive || navToolSelected)){
            isDraggingNode.value = true;
        }
    }
    
    function nodeMoveEnd(): void {
        actionMoveNodes({nodeRefList: selectedNodes.value, velocity: new Vector()}, true);
        updateNodeBounds();
    }

    function getNewNodePos(): Core.Vector {
        const vpBounds = nodeViewportRef.value!.getBoundingClientRect();
        const vpUl = new Vector(vpBounds.left, vpBounds.top);
        const vpBr = new Vector(vpBounds.right, vpBounds.bottom);
        const midpoint = vpUl.clone().add(vpBr).divideScalar(2);
        const navPos = clientToNavPos(midpoint);
    
        for (let i = 0; i < props.selectedAsset.nodes.length; i++){
            let curNode = props.selectedAsset.nodes[i];
    
            if (curNode.pos.equalTo(navPos)){
                let size = 50;
                let ul = new Vector(-size, -size);
                let br = new Vector(size, size);
                navPos.add(new Vector(0, 0).randomize(ul, br));
            }
        }
        
        return navPos;
    }
    
    function updateNodeBounds(): void {
        const nodes = visibleNodes.value;
    
        if (nodes.length == 0){
            contentsBounds.forEach((i, idx) => contentsBounds[idx] = 0);
            return;
        }
    
        //calculate client/screen space bounds
        const firstBoundingRect = nodes[0].domRef!.getBoundingClientRect();
        const ul = new Vector(firstBoundingRect.left, firstBoundingRect.top);
        const br = new Vector(firstBoundingRect.right, firstBoundingRect.bottom);
        const vpBounds = nodeViewportRef.value!.getBoundingClientRect();
        const vpSize = new Vector(vpBounds.right - vpBounds.left, vpBounds.bottom - vpBounds.top);
        const vpOrigin = new Vector(vpBounds.left, vpBounds.top);
        const navZoom = props.selectedAsset.graphNavState.zoomFac;
        const navOrigin = props.selectedAsset.graphNavState.offset.clone().multiplyScalar(navZoom);
    
        for (let i = 1; i < nodes.length; i++){
            const curNodeBounds = nodes[i].domRef!.getBoundingClientRect();
            ul.x = Math.min(ul.x, curNodeBounds.left);
            ul.y = Math.min(ul.y, curNodeBounds.top);
            br.x = Math.max(br.x, curNodeBounds.right);
            br.y = Math.max(br.y, curNodeBounds.bottom);
        }
    
        //align "world space" origin with center of viewport
        ul.subtract(navOrigin).subtract(vpOrigin).subtract(vpSize.clone().divideScalar(2));
        br.subtract(navOrigin).subtract(vpOrigin).subtract(vpSize.clone().divideScalar(2));
        ul.divideScalar(navZoom);
        br.divideScalar(navZoom);
    
        //commit result
        contentsBounds[0] = ul.x;
        contentsBounds[1] = -ul.y;
        contentsBounds[2] = br.x;
        contentsBounds[3] = -br.y;
    }
    
    function selectAllNodes(): void {
        selectedNodes.value.splice(0);
        selectedNodes.value.push(...props.selectedAsset.nodes);
    }
    
    function deselectAllNodes(): void {
        selectedNodes.value.splice(0);
    }
    
    function deleteSelectedNodes(): void {
        const protectedNodes: Node_Obj[] = [];
        const deletableNodes = selectedNodes.value.filter(node => {
            if (node.editorCanDelete) return true;
    
            protectedNodes.push(node);
            return false;
        });
    
        if (deletableNodes.length){
            actionDeleteNodes({nodeRefList: deletableNodes}, true);
            deselectAllNodes();
        }
    
        protectedNodes.forEach(node => node.onDeleteStopped && node.onDeleteStopped(protectedNodes));
    }

    function actionAddNode({templateId, nodeRef}: ActionAddNodeProps, makeCommit = true): void {
        const nodeAPI = mainStore.getNodeAPI;
        const pos = getNewNodePos();
        const newNode = props.selectedAsset.addNode(templateId, pos, nodeAPI, nodeRef);
    
        if (makeCommit){
            const data = {templateId, nodeRef: newNode} satisfies ActionAddNodeProps;
            undoStore.commit({action: Core.LOGIC_ACTION.ADD_NODE, data});
        }
    
        if (!nodeRef) newNode.onCreate && newNode.onCreate();
    }
    
    function actionDeleteNodes({nodeRefList}: ActionDeleteNodesProps, makeCommit = true): void {
        const connectionRefMap: Map<Logic, Node_Connection[]> = new Map();
    
        nodeRefList.forEach(node => {
            //find and delete connections attached to the node
            const currentConnections: Node_Connection[] = [];
            
            node.parentScript.connections.forEach(connection => {
                const startNodeId = connection.startNode!.nodeId;
                const endNodeId = connection.endNode!.nodeId;
    
                if (startNodeId == node.nodeId || endNodeId == node.nodeId){
                    currentConnections.push(connection);
                }
            });
    
            currentConnections.forEach(connection => {
                const connectionMapGet = connectionRefMap.get(node.parentScript) ?? [];
    
                if (!connectionMapGet.length) connectionRefMap.set(node.parentScript, connectionMapGet);
                connectionMapGet.push(connection);
                node.parentScript.removeConnection(connection.id);
                connection.startNode?.onRemoveConnection && connection.startNode?.onRemoveConnection(connection);
                connection.endNode?.onRemoveConnection && connection.endNode?.onRemoveConnection(connection);
            });
    
            //delete node
            node.onBeforeDelete && node.onBeforeDelete();
            node.parentScript.deleteNode(node);
        });
    
        if (makeCommit){
            const data = {nodeRefList: [...nodeRefList], connectionRefMap} satisfies ActionDeleteNodesProps;
            undoStore.commit({action: Core.LOGIC_ACTION.DELETE_NODES, data});
        }
    }
    
    function actionMoveNodes({nodeRefList, velocity}: ActionMoveNodesProps, makeCommit = true): void {
        if (makeCommit){
            const startVec = undoStore.cache.get('move_start');
    
            if (startVec){
                const totalVel = nodeRefList[0].pos.clone().subtract(startVec);
                const data = {nodeRefList: [...nodeRefList], velocity: totalVel};
    
                undoStore.commit({action: Core.LOGIC_ACTION.MOVE, data});
                undoStore.cache.delete('move_start');
            }
    
            return;
        }
    
        for (let i = 0; i < nodeRefList.length; i++){
            const curNode = nodeRefList[i];
            const newPos = curNode.pos.clone().add(velocity);
    
            curNode.setPos(newPos);
        }
    
        if (!undoStore.cache.get('move_start')){
            undoStore.cache.set('move_start', nodeRefList[0].pos.clone());
        }
    }

    function revertAddNode({nodeRef}: ActionAddNodeProps): void {
        nodeRef!.onBeforeDelete && nodeRef!.onBeforeDelete();
        props.selectedAsset.deleteNode(nodeRef!);
    }
    
    function revertDeleteNodes({nodeRefList, connectionRefMap}: ActionDeleteNodesProps): void {
        const nodeAPI = mainStore.getNodeAPI;
    
        nodeRefList.forEach(node => {
            node.parentScript.addNode(node.templateId, new Vector(), nodeAPI, node);
        });
    
        connectionRefMap!.forEach((connectionList, parentScript) => {
            connectionList.forEach(connection => {
                parentScript.addConnection(connection);
                connection.startNode?.onNewConnection && connection.startNode.onNewConnection(connection);
                connection.endNode?.onNewConnection && connection.endNode.onNewConnection(connection);
            });
        });
    
        nextTick(()=>{
            relinkConnections();
        });
    }
    
    function revertMoveNodes({nodeRefList, velocity}: ActionMoveNodesProps): void {
        for (let i = 0; i < nodeRefList.length; i++){
            const curNode = nodeRefList[i];
            const newPos = curNode.pos.clone().subtract(velocity);
    
            curNode.setPos(newPos);
        }
    }

    actionMap.set(Core.LOGIC_ACTION.ADD_NODE, actionAddNode);
    actionMap.set(Core.LOGIC_ACTION.DELETE_NODES, actionDeleteNodes);
    actionMap.set(Core.LOGIC_ACTION.MOVE, actionMoveNodes);
    revertMap.set(Core.LOGIC_ACTION.ADD_NODE, revertAddNode);
    revertMap.set(Core.LOGIC_ACTION.DELETE_NODES, revertDeleteNodes);
    revertMap.set(Core.LOGIC_ACTION.MOVE, revertMoveNodes);

    return {
        nodeClick,
        nodeDown,
        nodeMoveEnd,
        contentsBounds,
        updateNodeBounds,
        selectAllNodes,
        deselectAllNodes,
        deleteSelectedNodes,
        addNode: actionAddNode,
        deleteNodes: actionDeleteNodes,
        moveNodes: actionMoveNodes,
    };
}