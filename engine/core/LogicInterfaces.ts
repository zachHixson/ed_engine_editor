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
    Node_Enums,
    Instance_Object,
    CATEGORY_ID
} from "./core";

type Graph = {};
type Connection = {};
type iNodeAPI = {};

interface iNode_Base extends iNodeLifecycleEvents {
    template: iNodeTemplate;
    nodeId: number;
    isEvent: boolean;
    widgetData?: any;
    dataCache: Map<string, any>;
    getOutputType(outputName: string): {type: SOCKET_TYPE, isList: boolean};
    getInputType(inputName: string): {type: SOCKET_TYPE, isList: boolean};
}

export interface iNodeLifecycleEvents {
    init?: ()=>void; // Fired on constructor
    beforeSave?: ()=>void;
    afterSave?: (saveData: iNodeSaveData)=>void;
    beforeLoad?: (saveData: iNodeSaveData)=>void;
    afterLoad?: (saveData: iNodeSaveData)=>void;
    logicLoaded?: (logic: iEditorLogic | iEngineLogic)=>void;
    initVariableNodes?: ()=>void; // Fired after data is loaded, but before afterGameDataLoaded
    afterGameDataLoaded?: ()=>void;
    onCreate?: // Fired when instance is spawned, or when editor node is created
        ((this: iEngineNode, instanceContext: Instance_Object)=>void) |
        ((this: iEditorNode)=>void);
    onBeforeMount?: ()=>void;
    onMount?: ()=>void;
    onNewVariable?: ()=>void;
    onInput?: (event: InputEvent)=>void;
    onMove?: ()=>void;
    onNewConnection?: (connection: iNodeConnection, isUndo?: boolean)=>void;
    onRemoveConnection?: (connection: iNodeConnection, isUndo?: boolean)=>void;
    onValueChange?: (value: any)=>void;
    onDeleteStopped?: (protectedNodes: iEditorNode[])=>void;
    onBeforeDelete?: ()=>void;
    onBeforeUnmount?: ()=>void;
    onTick?: (instanceContext: Instance_Object)=>void;
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
    editorAPI: iEditorAPI;

    //misc settings
    reverseInputs?: boolean;
    reverseOutputs?: boolean;
    inputBoxWidth?: number;
    decoratorIcon?: string | null;
    decoratorText?: string | null;
    stackDataIO?: boolean;

    method(methodName: string, data?: any): any;
    getInput(inputName: string): any | null;
    emit(eventName: string, data?: any): void;
}

export interface iNodeConnection {
    id: number;
    startNode: iEditorNode | null;
    endNode: iEditorNode | null;
    startSocketId: string | null;
    endSocketId: string | null;
    disconnectedFrom: string | null;
}

export interface iNewVarInfo {
    name: string,
    type: SOCKET_TYPE,
    isGlobal: boolean,
    isList: boolean,
}

export interface iEditorAPI {
    editor: iAnyObj;
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
    dialogNewVariable(callback: (positive: boolean, varInfo: iNewVarInfo)=>void): void;
    popLastCommit(): void;
    t(text: string): string;
}

export interface iEngineLogic {
    id: number;
    category_ID: CATEGORY_ID;
    events: Map<string, iEngineNode[]>;
    localVariableDefaults: Map<string, any>;

    setLocalVariableDefault(name: string, value: any, type: SOCKET_TYPE, isList: boolean): void;
    executeEvent(eventName: string, instance: Instance_Object, data: any): void;
    dispatchOnCreate(instanceContext: Instance_Object): void;
    dispatchLogicLoaded(): void;
    dispatchAfterGameDataLoaded(): void;
    dispatchOnTick(instanceContext: Instance_Object): void;
}

export interface iEngineInTrigger {
    execute: string,
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
    execute: string,
    isList?: boolean,
    linkToType?: string,
};

export type iEngineNodeMethod = (this: iEngineNode, instanceContext: Instance_Object, data?: any) => any;

export type iEngineVariable = {value: any, type: SOCKET_TYPE, isList: boolean};

export interface iEngineNode extends iNode_Base {
    inTriggers: Map<string, iEngineInTrigger>;
    outTriggers: Map<string, iEngineOutTrigger>;
    inputs: Map<string, iEngineInput>;
    outputs: Map<string, iEngineOutput>;
    parentScript: iEngineLogic;

    engine: Engine;

    method(methodName: string, instanceContext: Instance_Object, data?: any): any;
    getWidgetData(): any;
    getInput(inputName: string, instanceContext: Instance_Object): any;
    triggerOutput(outputId: string, instanceContext: Instance_Object): void;
}

type iEditorConnectionSaveData = any;

export interface iLogicSaveData extends iAssetSaveData {
    selectedGraphId: number,
    graphs: Array<{id: number, name: string, navState: iNavSaveData}>,
    nodes: iNodeSaveData[],
    connections: iEditorConnectionSaveData[],
}

export interface iNodeSaveData {
    templateId: string,
    nodeId: number,
    graphId: number,
    pos: { x: number, y: number },
    inputs: { id: string, value: any }[],
    widgetData: any,
    details?: any,
}

export interface iConnectionSaveData {
    id: number,
    type: Node_Enums.SOCKET_TYPE,
    graphId: number,
    startSocketId: string,
    endSocketId: string,
    startNodeId: number,
    endNodeId: number,
}