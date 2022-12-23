import { iAnyObj } from "./interfaces";
import { SOCKET_TYPE } from "./nodes/Node_Enums";
import { Vector } from "./Vector";
import Engine from "@engine/Engine";
import { iInput, iInTrigger, iNodeTemplate, iOutput, Object_Instance } from "./core_filemap";

type Graph = {};
type Connection = {};
type EditorNode = {};
type iNodeAPI = {};

interface iNode_Base extends iNodeLifecycleEvents {
    template: iNodeTemplate;
    nodeId: number;
    parentScript: iEngineLogic;
    engine: Engine;
    isEvent: boolean;
    widgetData: iAnyObj | null;
}

export interface iNodeLifecycleEvents {
    init?: ()=>void;
    onCreate?: ()=>void;
    beforeSave?: ()=>void;
    afterSave?: (saveData: iAnyObj)=>void;
    beforeLoad?: (saveData: iAnyObj)=>void;
    afterLoad?: ()=>void;
    logicLoaded?: ()=>void;
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
}

export interface iEditorLogic extends iNode_Base {
    id: number;
    name: string;
    graphs: Graph[];
    nodes: EditorNode[];
    connections: Connection[];
    selectedGraphId: number | null;
    selectedNodes: EditorNode[];
    localVariables: Map<string, SOCKET_TYPE>;

    addNode(templateId: number, pos: Vector, nodeRef: EditorNode, nodeAPI: iNodeAPI): void;
    deleteNode(nodeRef: EditorNode): void;
    addConnection(connectionObj: Connection): void;
    removeConnection(id: number, connectionObj: Connection): boolean;
    setLocalVariable(name: string, type: SOCKET_TYPE): void;
    getLocalVariable(name: string): SOCKET_TYPE;
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
    value: any,
    node: iEditorNode,
};

export interface iEditorNode {
    template: iNodeTemplate;
    templateId: string;
    nodeId: number;
    isEvent: boolean;
    widgetData: any;
    inTriggers: Map<string, iEditorNodeInTrigger>;
    outTriggers: Map<string, {
        id: number,
        node: iEditorNode,
    }>;
    inputs: Map<string, iEditorNodeInput>;
    outputs: Map<string, iEditorNodeOutput>;
    parentScript: iEditorLogic;
    dataCache: Map<string, any>;
    editorCanDelete: boolean;
    editorAPI: iEditorAPI;

    //misc settings
    reverseInputs?: boolean;
    reverseOutputs?: boolean;
    inputBoxWidth?: number;
    decoratorIcon?: string | null;
    decoratorText?: string | null;

    method(methodName: string): any;
    getInput(inputName: string): iEditorNodeInput;
    emit(eventName: string, data?: any): void;
}

export interface iNodeConnection {
    id: number;
    startNodeId: number;
    endNodeId: number;
    startSocketId: string;
    endSocketId: string;
}

export interface iEditorAPI {
    editor: iAnyObj;
    store: iAnyObj;
    globalVariableMap: Map<string, SOCKET_TYPE>;

    getGlobalVariable(name: string): SOCKET_TYPE;
    setGlobalVariable(name: string, type: SOCKET_TYPE): void;
    deleteGlobalVariable(name: string): void;
    getVariableUsage(name: string, nodeType: string | null, isGlobal: boolean): iEditorNode[];
    getConnection(node: iEditorNode, socketId: string): iNodeConnection;
    cancelConnection(connection: iNodeConnection): void;
    getConnectedSocket(node: iEditorNode, socketId: string, inputConnection?: iNodeConnection): iEditorNodeInput | iEditorNodeOutput;
    getSelectedNodes(): iEditorNode[];
    clearSelectedNodes(): void;
    addNode(node: iEditorNode, commit?: boolean): void;
    deleteNodes(nodeList: iEditorNode[], commit?: boolean): void;
    forEachNode(callback: (...args: any)=>void, isGlobal: boolean): void;
    dialogConfirm(textInfo: {textId: string, vars: {[keys: string]: any}}, callback: (positive: boolean)=>void): void;
    dialogNewVariable(callback: (positive: boolean, varInfo: {
        name: string,
        type: SOCKET_TYPE,
        isGlobal: boolean,
        isList: boolean,
    })=>void): void;
    popLastCommit(): void;
}

export interface iEngineLogic {
    id: number;
    events: Map<string, iEngineNode[]>;

    setLocalVariableDefault(name: string, data: iAnyObj): void;
}

export interface iEngineInTrigger {
    execute: string,
    node: iEngineNode,
    connection: iEngineInTrigger | null,
};

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
    outTriggers: Map<string, {
        connection: iEngineInTrigger | null,
    }>;
    inputs: Map<string, iEngineInput>;
    outputs: Map<string, iEngineOuput>;

    instance: Object_Instance;
    data: any;

    method(methodName: string, data?: any): any;
    getWidgetData(): any;
    getInput(inputName: string): any;
    triggerOutput(outputId: string): void;
}