import { iAnyObj } from "./interfaces";
import { SOCKET_TYPE } from "./nodes/Node_Enums";
import { Vector } from "./Vector";
import Engine from "@engine/Engine";
import {
    iAssetSaveData,
    iInput,
    iInTrigger,
    iNavSaveData,
    iNodeTemplate,
    iOutput,
    Instance_Object,
    CATEGORY_ID,
    Event_Emitter,
    Node_Enums
} from "./core";

//types needed for node editor API, which is the only place the engine code has to know about editor types
//@ts-ignore
import type Undo_Store from '@src/components/common/Undo_Store';
//@ts-ignore
import type { iActionStore } from '@src/components/common/Undo_Store';

type Graph = {};
type Connection = {};
type iNodeAPI = {};
export type ActionCallback<T> = (args: T, commit: boolean) => (Partial<T> | void);

interface iNode_Base extends iNodeLifecycleEvents {
    template: iNodeTemplate;
    nodeId: number;
    isEvent: boolean;
    widgetData?: any;
    setNodeData<T>(data: T): T;
    getNodeData<T>(): T;
}

export interface iNodeLifecycleEvents {
    registerActions?: (editorAPI: iEditorAPI)=>void; //Fired once per template each time the node editor is opened
    init?: ()=>void; // Fired on constructor
    beforeSave?: ()=>void;
    afterSave?: (saveData: iNodeSaveData)=>void;
    beforeLoad?: (saveData: iNodeSaveData)=>void;
    afterLoad?: (saveData: iNodeSaveData)=>void;
    logicLoaded?: (logic: iEditorLogic | iEngineLogic)=>void;
    afterGameDataLoaded?: ()=>void;
    onCreate?: // Fired when instance is spawned, or when editor node is created
        ((this: iEngineNode, eventContext: iEventContext)=>void) |
        ((this: iEditorNode)=>void);
    onBeforeMount?: ()=>void;
    onMount?: ()=>void;
    onNewVariable?: ()=>void;
    onEdit?: ()=>void;
    onInput?: (event: InputEvent)=>void;
    onMove?: ()=>void;
    onNewConnection?: (connection: iNodeConnection, isUndo?: boolean)=>void;
    onRemoveConnection?: (connection: iNodeConnection, isUndo?: boolean)=>void;
    onValueChange?: (value: any)=>void;
    onDeleteStopped?: (protectedNodes: iEditorNode[])=>void;
    onBeforeDelete?: ()=>void;
    onBeforeUnmount?: ()=>void;
}

export interface iEditorLogic {
    id: number;
    name: string;
    graphs: Graph[];
    nodes: iEditorNode[];
    connections: iNodeConnection[];
    selectedGraphId: number | null;
    selectedNodes: iEditorNode[];
    localVariables: Map<string, iEditorVariable>;

    addNode(templateId: string, pos: Vector, nodeAPI: iNodeAPI, nodeRef?: iEditorNode): iEditorNode;
    deleteNode(nodeRef: iEditorNode): void;
    addConnection(connectionObj: iNodeConnection): void;
    removeConnection(id: number, connectionObj?: Connection): boolean;
    setLocalVariable(name: string, type: SOCKET_TYPE, isList: boolean): void;
    getLocalVariable(name: string): iEditorVariable | undefined;
    deleteLocalVariable(name: string): void;
}

export interface iEditorNodeInTrigger extends iInTrigger {
    node: iEditorNode,
};

export interface iEditorNodeInput extends iInput {
    node: iEditorNode;
    value: any;
};

export interface iEditorNodeOutput extends iOutput {
    node: iEditorNode,
};

export type iEditorNodeMethod = (this: iEditorNode, data?: any) => any;

export type iEditorVariable = {type: SOCKET_TYPE, isList: boolean};

export interface iEditorNode extends iNode_Base {
    templateId: string;
    widget?: any;
    inTriggers: Map<string, iEditorNodeInTrigger>;
    outTriggers: Map<string, {
        id: string,
        node: iEditorNode,
    }>;
    inputs: Map<string, iEditorNodeInput>;
    outputs: Map<string, iEditorNodeOutput>;
    parentScript: iEditorLogic;
    editorCanDelete: boolean;
    showEditButton: boolean;
    editorAPI: iEditorAPI;
    domRef: HTMLDivElement | null;

    //misc settings
    reverseInputs?: boolean;
    reverseOutputs?: boolean;
    inputBoxWidth?: number;
    decoratorIcon?: string | null;
    decoratorText?: string | null;
    stackDataIO?: boolean;
    doNotCopy?: boolean;

    onEditorMove: Event_Emitter<(newPos: Vector)=>void>;
    onForceUpdate: Event_Emitter<()=>void>;
    onForceSocketUpdate: Event_Emitter<(socketName?: string)=>void>;
    onUpdateConnections: Event_Emitter<()=>void>;
    onRecalcWidth: Event_Emitter<()=>void>;

    getInput<T>(inputName: string): T;
    refresh(): void;
}

export interface iNodeConnection {
    id: number;
    startNode: iEditorNode | null;
    endNode: iEditorNode | null;
    startSocketId: string | null;
    endSocketId: string | null;
    disconnectedFrom: string | null;

    onConnectionUpdate: Event_Emitter<()=>void>;
    onForceUpdate: Event_Emitter<()=>void>;
}

export interface iVarInfo {
    name: string,
    type: SOCKET_TYPE,
    isGlobal: boolean,
    isList: boolean,
}

export interface iEditorAPI {
    editor: iAnyObj;
    undoStore: Undo_Store<iActionStore>;
    globalVariableMap: Map<string, iEditorVariable>;
    gameDataStore: any;
    logicEditorStore: any;

    getGlobalVariable(name: string): iEditorVariable | undefined;
    setGlobalVariable(name: string, type: SOCKET_TYPE, isList: boolean): void;
    deleteGlobalVariable(name: string): void;
    getVariableUsage(name: string, nodeType: string | null, isGlobal: boolean): iEditorNode[];
    getInputConnection(node: iEditorNode, socketId: string): iNodeConnection | null;
    getOutputConnections(node: iEditorNode, socketId: string): iNodeConnection[];
    cancelConnection(connection: iNodeConnection): void;
    getConnectedInputSocket(node: iEditorNode, socketId: string, inputConnection?: iNodeConnection): iEditorNodeInput | iEditorNodeOutput | undefined;
    getSelectedNodes(): iEditorNode[];
    clearSelectedNodes(): void;
    addNode(node: iEditorNode, commit?: boolean): void;
    deleteNodes(nodeList: iEditorNode[], commit?: boolean): void;
    deleteConnections(connectionList: iNodeConnection[], commit?: boolean): void;
    forEachNode(callback: (...args: any)=>void, isGlobal: boolean): void;
    dialogConfirm(textInfo: {textId: string, vars: {[keys: string]: any}}, callback: (positive: boolean)=>void): void;
    dialogVariable(callback: (positive: boolean, varInfo: iVarInfo)=>void, edit?: iVarInfo): void;
    popLastCommit(): void;
    t(text: string): string;
    nextTick(callback: ()=>void): void;
    registerAction<T extends {}>(key: any, action: ActionCallback<T>, revert: ActionCallback<T>): void;
    executeAction<T>(key: any, args: T, commit: boolean): void;
    pushNodeException(data: iNodeExceptionData): void;
    clearNodeException(errorId: symbol): void;
}

export interface iEngineLogic {
    id: number;
    name: string;
    graphNames: Map<number, string>;
    category_ID: CATEGORY_ID;
    events: Map<string, iEngineNode[]>;
    localVariableDefaults: Map<string, any>;

    setLocalVariableDefault(name: string, value: any, type: SOCKET_TYPE, isList: boolean): void;
    executeEvent(eventName: string, instance: Instance_Object, data: any): void;
    dispatchOnCreate(instance: Instance_Object): void;
    dispatchLogicLoaded(): void;
    dispatchAfterGameDataLoaded(): void;
}

export interface iEngineInTrigger {
    execute(eventContext: iEventContext, data: any): void,
    node: iEngineNode,
    connection: iEngineOutTrigger | null,
};

export interface iEngineOutTrigger {
    connection: iEngineInTrigger | null,
}

export interface iEngineInput {
    value: any,
    type: SOCKET_TYPE,
    connection: iEngineOutput | null,
    isList?: boolean,
};

export interface iEngineOutput {
    id: string,
    connection: iEngineInput | null,
    node: iEngineNode,
    type: SOCKET_TYPE,
    execute(eventContext: iEventContext, data: any): void,
    isList?: boolean,
};

export type iEngineNodeMethod = (this: iEngineNode, eventContext: iEventContext, data?: any) => any;

export type iEngineVariable = {value: any, type: SOCKET_TYPE, isList: boolean};

export interface iEngineNode extends iNode_Base {
    inTriggers: Map<string, iEngineInTrigger>;
    outTriggers: Map<string, iEngineOutTrigger>;
    inputs: Map<string, iEngineInput>;
    outputs: Map<string, iEngineOutput>;
    parentScript: iEngineLogic;
    graphId: number;

    engine: Engine;

    getWidgetData(): any;
    getInput<T>(inputName: string, eventContext: iEventContext, convertList?: boolean): T;
    triggerOutput(outputId: string, eventContext: iEventContext): void;
    throwOnNullInput<T>(inputName: string, eventContext: iEventContext, errorId: string, fatal?: boolean): T | typeof Node_Enums.THROWN | null;
    throwOnNullInput<T>(inputName: string, eventContext: iEventContext, errorId: string, fatal: true, rejectNoConnection?: boolean): T | null;
}

export type iEventContext = {eventKey: number, instance: Instance_Object};

export interface iLogicSaveData extends iAssetSaveData {
    selectedGraphId: number,
    graphs: Array<{id: number, name: string, nav: iNavSaveData}>,
    nodes: iNodeSaveData[],
    connections: iConnectionSaveData[],
}

export interface iNodeSaveData {
    tId: string, //templateId
    nId: number, //nodeId
    gId: number, //groupId
    pos: { x: number, y: number },
    inp: { id: string, value: any }[], //inputs
    widg: any, //widgetData
    d?: any, //extra save data appended by node
}

export interface iConnectionSaveData {
    id: number,
    gId: number, //group ID
    sSocId: string, //start socket ID
    eSocId: string, //end socket ID
    sNodeId: number, //start node ID
    eNodeId: number, //end node ID
}

export interface iNodeExceptionData {
    errorId: symbol;
    msgId: string;
    msgVars?: {[key: string]: any};
    logicId: number;
    nodeId: number;
    fatal?: boolean;
    onClearCallback?: (data: iNodeExceptionData)=>void;
}