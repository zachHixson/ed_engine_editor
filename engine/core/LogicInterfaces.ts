import { iAnyObj } from "./interfaces";
import { SOCKET_TYPE } from "./nodes/Node_Enums";
import { Vector } from "./Vector";
import Engine from "@engine/Engine";
import { iAssetSaveData, iInput, iInTrigger, iNavSaveData, iNodeTemplate, iOutput, Node_Enums, Object_Instance } from "./core";

type Graph = {};
type Connection = {};
type iNodeAPI = {};

interface iNode_Base extends iNodeLifecycleEvents {
    template: iNodeTemplate;
    nodeId: number;
    isEvent: boolean;
    widgetData?: iAnyObj | null;
    dataCache: Map<string, any>;
}

export interface iNodeLifecycleEvents {
    init?: ()=>void;
    onCreate?: ()=>void;
    beforeSave?: ()=>void;
    afterSave?: (saveData: iAnyObj)=>void;
    beforeLoad?: (saveData: iAnyObj)=>void;
    afterLoad?: ()=>void;
    logicLoaded?: (logic: iEditorLogic | iEngineLogic)=>void;
    afterGameDataLoaded?: ()=>void;
    onScriptAdd?: ()=>void;
    onMount?: ()=>void;
    allNodesMounted?: ()=>void;
    onNewVariable?: ()=>void;
    onInput?: (event: InputEvent)=>void;
    onMove?: ()=>void;
    onNewConnection?: (connection: iNodeConnection)=>void;
    onRemoveConnection?: (connection: iNodeConnection)=>void;
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
    localVariables: Map<string, SOCKET_TYPE>;

    addNode(templateId: string, pos: Vector, nodeAPI: iNodeAPI, nodeRef?: iEditorNode): iEditorNode;
    deleteNode(nodeRef: iEditorNode): void;
    addConnection(connectionObj: iNodeConnection): void;
    removeConnection(id: number, connectionObj?: Connection): boolean;
    setLocalVariable(name: string, type: SOCKET_TYPE): void;
    getLocalVariable(name: string): SOCKET_TYPE | undefined;
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

export interface iEditorNode extends iNode_Base {
    templateId: string;
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

    method(methodName: string): any;
    getInput(inputName: string): any | null;
    emit(eventName: string, data?: any): void;
}

export interface iNodeConnection {
    id: number;
    startNode: iEditorNode | null;
    endNode: iEditorNode | null;
    startSocketId: string | null;
    endSocketId: string | null;
}

export interface iNewVarInfo {
    name: string,
    type: SOCKET_TYPE,
    isGlobal: boolean,
    isList: boolean,
}

export interface iEditorAPI {
    editor: iAnyObj;
    globalVariableMap: Map<string, SOCKET_TYPE>;

    getGlobalVariable(name: string): SOCKET_TYPE | undefined;
    setGlobalVariable(name: string, type: SOCKET_TYPE): void;
    deleteGlobalVariable(name: string): void;
    getVariableUsage(name: string, nodeType: string | null, isGlobal: boolean): iEditorNode[];
    getConnection(node: iEditorNode, socketId: string): iNodeConnection | null;
    cancelConnection(connection: iNodeConnection): void;
    getConnectedSocket(node: iEditorNode, socketId: string, inputConnection?: iNodeConnection): iEditorNodeInput | iEditorNodeOutput | undefined;
    getSelectedNodes(): iEditorNode[];
    clearSelectedNodes(): void;
    addNode(node: iEditorNode, commit?: boolean): void;
    deleteNodes(nodeList: iEditorNode[], commit?: boolean): void;
    forEachNode(callback: (...args: any)=>void, isGlobal: boolean): void;
    dialogConfirm(textInfo: {textId: string, vars: {[keys: string]: any}}, callback: (positive: boolean)=>void): void;
    dialogNewVariable(callback: (positive: boolean, varInfo: iNewVarInfo)=>void): void;
    popLastCommit(): void;
}

export interface iEngineLogic {
    id: number;
    events: Map<string, iEngineNode[]>;
    localVariableDefaults: Map<string, any>;

    setLocalVariableDefault(name: string, data: iAnyObj): void;
    executeEvent(eventName: string, instance: Object_Instance, data: any): void;
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
    connection: iEngineOuput | null,
};

export interface iEngineOuput {
    id: string,
    connection: iEngineInput | null,
    node: iEngineNode,
    type: SOCKET_TYPE,
    execute: string,
};

export interface iEngineNode extends iNode_Base {
    inTriggers: Map<string, iEngineInTrigger>;
    outTriggers: Map<string, iEngineOutTrigger>;
    inputs: Map<string, iEngineInput>;
    outputs: Map<string, iEngineOuput>;
    parentScript: iEngineLogic;

    engine: Engine;
    instance: Object_Instance;

    method(methodName: string, data?: any): any;
    getWidgetData(): any;
    getInput(inputName: string): any;
    triggerOutput(outputId: string): void;
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