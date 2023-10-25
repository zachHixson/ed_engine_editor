import { ref, reactive, onMounted, onBeforeUnmount } from 'vue';
import type { Ref, ComputedRef } from 'vue';
import { useLogicEditorStore } from "@/stores/LogicEditor";
import { LogicMainEventBus } from '../LogicMain.vue';
import type Node_Connection from '../node_components/Node_Connection';
import type { iHoverSocket } from '../node_components/Socket.vue';
import type { default as Node_Obj } from '../node_components/Node';
import Core from '@/core';
import type HotkeyMap from '@/components/common/HotkeyMap';
import type { ActionMakeConnectionProps, ActionRemoveConnectionProps } from './useConnection';
import type { ActionMoveNodesProps } from './useNode';
import type Logic from '../node_components/Logic';

const { Vector } = Core;

export const mouseDownPos = new Vector();
export const shiftDown = {value: false};

export default function useInput(
    props: { selectedAsset: Logic },
    hotkeyMap: HotkeyMap,
    nodeViewportRef: Ref<HTMLDivElement | undefined>,
    draggingConnection: Ref<Node_Connection | null>,
    isDraggingNode: Ref<boolean>,
    inputActive: ComputedRef<boolean>,
    visibleNodes: ComputedRef<Node_Obj[]>,
    selectedNodes: ComputedRef<Node_Obj[]>,
    deselectAllNodes: ()=>void,
    clientToNavPos: (pos: Core.Vector)=>Core.Vector,
    makeConnection: (props: ActionMakeConnectionProps, commit?: boolean)=>void,
    removeConnection: (props: ActionRemoveConnectionProps, commit?: boolean)=>void,
    moveNodes: (props: ActionMoveNodesProps, commit?: boolean)=>void,
){
    const logicEditorStore = useLogicEditorStore();
    
    const selectionBoxRef = ref<HTMLDivElement>();

    const lastMouseDragPos = new Vector();
    const selectionBox = reactive({
        active: false,
        origin: new Vector(),
        dim: new Vector(),
    });
    const currentSocketOver = ref<iHoverSocket | null>(null);
    const navControlPanelScroll = (event: WheelEvent)=>LogicMainEventBus.emit('mouse-wheel', event);
    const contextMenuPosition = ref<Core.Vector | null>(null);

    onMounted(()=>{
        window.addEventListener('keydown', keyDown);
        window.addEventListener('keyup', keyUp);
        window.addEventListener('mouseup', mouseUp);
        nodeViewportRef.value!.addEventListener('click', mouseClick);
        nodeViewportRef.value!.addEventListener('mousedown', mouseDown);
        nodeViewportRef.value!.addEventListener('mousemove', mouseMove);
        nodeViewportRef.value!.addEventListener('mouseenter', mouseEnter);
        nodeViewportRef.value!.addEventListener('mouseleave', mouseLeave);
        nodeViewportRef.value!.addEventListener('wheel', navControlPanelScroll);
        nodeViewportRef.value!.addEventListener('contextmenu', contextMenu);
    });

    onBeforeUnmount(()=>{
        window.removeEventListener('keydown', keyDown);
        window.removeEventListener('keyup', keyUp as EventListener);
        window.removeEventListener('mouseup', mouseUp);
        nodeViewportRef.value!.removeEventListener('click', mouseClick);
        nodeViewportRef.value!.removeEventListener('mousedown', mouseDown);
        nodeViewportRef.value!.removeEventListener('mousemove', mouseMove);
        nodeViewportRef.value!.removeEventListener('mouseenter', mouseEnter);
        nodeViewportRef.value!.removeEventListener('mouseleave', mouseLeave);
        nodeViewportRef.value!.removeEventListener('wheel', navControlPanelScroll);
        nodeViewportRef.value!.removeEventListener('contextmenu', contextMenu);
    });

    function mouseClick(event: MouseEvent): void {
        let mouseUpPos = new Vector(event.clientX, event.clientY);
    
        if (mouseUpPos.equalTo(mouseDownPos)){
            logicEditorStore.selectNavTool(null);
        }
    
        if (
            event.target == event.currentTarget &&
            !shiftDown.value &&
            mouseUpPos.distanceTo(mouseDownPos) < 5
        ){
            deselectAllNodes();
        }
    }
    
    function keyDown(event: KeyboardEvent): void {
        hotkeyMap.keyDown(event);
        if (event.key == 'Shift') shiftDown.value = true;
    }
    
    function keyUp(event: KeyboardEvent): void {
        hotkeyMap.keyUp(event);
        if (event.key == 'Shift') shiftDown.value = false;
    }
    
    function mouseDown(event: MouseEvent): void {
        mouseDownPos.x = event.clientX;
        mouseDownPos.y = event.clientY;
        lastMouseDragPos.copy(mouseDownPos);
        LogicMainEventBus.emit('mouse-down', event);
    
        //position selection box
        if (event.button == 0 && event.target == event.currentTarget){
            const vpBounds = nodeViewportRef.value!.getBoundingClientRect();
            const vpOrigin = new Vector(vpBounds.left, vpBounds.top);
            const startPos = new Vector(event.clientX, event.clientY).subtract(vpOrigin);
    
            selectionBox.active = true;
            selectionBox.origin.copy(startPos);
            selectionBox.dim.zero();
        }
    }
    
    function mouseUp(event: MouseEvent): void {
        isDraggingNode.value = false;
        LogicMainEventBus.emit('mouse-up', event);
        selectionBox.active = false;
        selectNodesInBox();
    
        if (draggingConnection.value){
            const socketOver = currentSocketOver.value as iHoverSocket;
            const connectionObj = draggingConnection.value as Node_Connection;
            const startType = !!connectionObj.startSocketEl ? connectionObj.type : socketOver?.socketData.type;
            const endType = !!connectionObj.startSocketEl ? socketOver?.socketData.type : connectionObj.type;
            const isTrigger = startType == endType && startType == null;
            const typeMatch = isTrigger || Core.canConvertSocket(startType, endType);
            const directionMatch = !!connectionObj.startSocketEl == !!socketOver?.isInput;
    
            draggingConnection.value = null;
    
            if (
                socketOver &&
                typeMatch &&
                directionMatch &&
                connectionObj.canConnect &&
                socketOver.canConnect &&
                !socketOver.socketData.disabled
            ){
                const leftNode = ((socketOver.isInput) ? socketOver.node : connectionObj.endNode) as Node_Obj;
                const rightNode = (!(socketOver.isInput) ? socketOver.node : connectionObj.startNode) as Node_Obj;
    
                if (!checkLoop(leftNode, rightNode)){
                    makeConnection({connectionObj, socketOver});
                    return;
                }
            }
    
            removeConnection({connectionObj});
        }
    }
    
    function mouseEnter(event: MouseEvent): void {
        if (!inputActive.value){
            hotkeyMap.mouseEnter();
        }
        LogicMainEventBus.emit('mouse-enter', event);
    }
    
    function mouseLeave(event: MouseEvent): void {
        hotkeyMap.mouseLeave();
        LogicMainEventBus.emit('mouse-leave', event);
    }
    
    function mouseMove(event: MouseEvent): void {
        const vpBounds = nodeViewportRef.value!.getBoundingClientRect();
        const vpOrigin = new Vector(vpBounds.left, vpBounds.top);
        const newOrigin = new Vector(event.clientX, event.clientY).subtract(vpOrigin);
        const selectionBoxDim = new Vector(event.clientX, event.clientY).subtract(mouseDownPos);
    
        LogicMainEventBus.emit('mouse-move', event);
        selectionBox.dim.copy(selectionBoxDim);
    
        //if rectangle dimensions are negative, set origin to mouse position
        if (selectionBoxDim.x < 0){
            selectionBox.origin.x = newOrigin.x;
            selectionBox.dim.x = Math.abs(selectionBox.dim.x);
        }
    
        if (selectionBoxDim.y < 0){
            selectionBox.origin.y = newOrigin.y;
            selectionBox.dim.y = Math.abs(selectionBox.dim.y);
        }
    
        //calculate node velocity and move nodes if applicable
        if (isDraggingNode.value){
            const startPos = clientToNavPos(lastMouseDragPos);
            const mousePos = new Vector(event.clientX, event.clientY);
            const mouseNavPos = clientToNavPos(mousePos);
            const velocity = mouseNavPos.subtract(startPos);
            
            moveNodes({nodeRefList: selectedNodes.value, velocity}, false);
            lastMouseDragPos.copy(mousePos);
        }
    }

    function contextMenu(e: MouseEvent): void {
        const viewportDim = nodeViewportRef.value!.getBoundingClientRect();
        const mousePos = new Vector(e.clientX - viewportDim.x, e.clientY - viewportDim.y);
        e.preventDefault();
        contextMenuPosition.value = mousePos;
    }
    
    function navToolSelected(newTool: Core.NAV_TOOL_TYPE): void {
        const logicEditorStore = useLogicEditorStore();
        logicEditorStore.selectNavTool(newTool);
    }

    function selectNodesInBox(): void {
        visibleNodes.value.forEach(node => {
            const selectionBounds = selectionBoxRef.value!.getBoundingClientRect();
            const nodeBounds = node.domRef!.getBoundingClientRect();
            const overlapX = selectionBounds.right >= nodeBounds.left && nodeBounds.right >= selectionBounds.left;
            const overlapY = selectionBounds.bottom >= nodeBounds.top && nodeBounds.bottom >= selectionBounds.top;
            const isSelected = selectedNodes.value.find(n => n.nodeId == node.nodeId);
    
            if (overlapX && overlapY && !isSelected){
                selectedNodes.value.push(node);
            }
        });
    }

    function checkLoop(leftNode: Node_Obj, rightNode: Node_Obj): boolean {
        const connectionMap = new Map();
        const checkedNodes = new Map();
        const connections = props.selectedAsset.connections;
    
        for (let i = 0; i < connections.length - 1; i++){
            const connection = connections[i];
            const id = connection.startNode?.nodeId + '/' + connection.startSocketId;
            connectionMap.set(id, connection);
        }
    
        checkedNodes.set(rightNode.nodeId, true);
    
        return _checkLoop({endNode: leftNode}, connectionMap, checkedNodes);
    }
    
    function _checkLoop(connection: {endNode: Node_Obj | null}, connectionMap: Map<string, Node_Connection>, checkedNodes: Map<number, boolean>): boolean {
        const curNode = connection.endNode!;
        const socketArr: {id: string}[] = [];
        let foundLoop = false;
    
        if (checkedNodes.get(curNode.nodeId)){
            return true;
        }
    
        checkedNodes.set(curNode.nodeId, true);
    
        curNode.outTriggers?.forEach(trigger => socketArr.push(trigger));
        curNode.outputs?.forEach(output => socketArr.push(output));
    
        for (let i = 0; !foundLoop && i < socketArr.length; i++){
            const socket = socketArr[i];
            const connectionPath = curNode.nodeId + '/' + socket.id;
            const nextConnection = connectionMap.get(connectionPath);
    
            if (nextConnection){
                const checkedNodesCopy = new Map(checkedNodes);
                foundLoop ||= _checkLoop(nextConnection, connectionMap, checkedNodesCopy);
            }
        }
    
        return !!foundLoop;
    }

    return {
        currentSocketOver,
        selectionBox,
        selectionBoxRef,
        navToolSelected,
        contextMenuPosition,
    }
}