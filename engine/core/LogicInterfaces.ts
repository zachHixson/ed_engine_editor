import type { Vec2 } from "linearz";
import { SOCKET_TYPE, type SocketTypeLookup } from "./nodes/Node_Enums";
import Engine from "@engine/Engine";
import {
    iInput,
    iInTrigger,
    iNodeTemplate,
    iOutput,
    Instance_Object,
    CATEGORY_ID,
    Event_Emitter,
    Node_Enums,
    tNavSaveData,
    Asset_Base,
    AssetSave,
    ActionCallback,
    ActionCallbackData,
    Widget,
} from "./core";

//types needed for node editor API, which is the only place the engine code has to know about editor types
import type Undo_Store from '@src/components/common/Undo_Store';
import type { useGameDataStore } from "@src/stores/GameData";

type Graph = {};
type Connection = {};
type vec = [number, number];

export type ConnectionSave = [
	id: number,
	graphId: number,
	startSocketId: string,
	endSocketId: string,
	startNodeId: number,
	endNodeId: number,
];

export type NodeSave = [
    templateId: string,
    nodeId: number,
    graphId: number,
    pos: vec,
    inputs: Array<[inputId: string, inputData: number | string]>,
    widgetData: {[key: string]: unknown},
    extra: unknown,
];

export type GraphSave = [
    id: number,
    name: string,
    navData: tNavSaveData,
];

export type LogicSave = [
    ...AssetSave,
    selectedGraphId: number,
    graphList: Array<GraphSave>,
    nodeDataList: Array<NodeSave>,
    connectionDataList: Array<ConnectionSave>,
];

interface iNode_Base {
    template: iNodeTemplate;
    nodeId: number;
    isEvent: boolean;
    widgetData?: unknown;
    setNodeData<T>(data: T): void;
    getNodeData<T>(): T;
}

export interface iNodeLifeCycleShared {
    onCreate: ((this: iEngineNode, eventContext: iEventContext)=>void) | ((this: iEditorNode)=>void);
    logicLoaded: (logic: iEditorLogic | iEngineLogic)=>void;
    afterGameDataLoaded: ()=>void;
}

export interface iEngineNodeLifecycle extends iNodeLifeCycleShared {}

export interface iEditorNodeLifecycle extends iNodeLifeCycleShared {
    init: ()=>void; // Fired on constructor
    beforeSave: ()=>void;
    afterSave: (saveData: NodeSave)=>void;
    beforeLoad: (saveData: NodeSave)=>void;
    afterLoad: (saveData: NodeSave)=>void;
    onBeforeMount: ()=>void;
    onMount: ()=>void;
    onNewVariable: ()=>void;
    onEdit: ()=>void;
    onInput: (event: iNodeInputEvent)=>void;
    onMove: ()=>void;
    onNewConnection: (connection: iNodeConnection, isUndo?: boolean)=>void;
    onRemoveConnection: (connection: iNodeConnection, isUndo?: boolean)=>void;
    onValueChange: (value: unknown)=>void;
    onDeleteStopped: (protectedNodes: iEditorNode[])=>void;
    onBeforeDelete: ()=>void;
    onBeforeUnmount: ()=>void;
}

export interface iTemplateLifecycle extends Partial<iEngineNodeLifecycle>, Partial<iEditorNodeLifecycle> {
    registerActions?: (editorAPI: iEditorAPI)=>void; //Fired once per template each time the node editor is opened
}

export interface iNodeLifecycleEventsXXX {
    registerActions?: (editorAPI: iEditorAPI)=>void; //Fired once per template each time the node editor is opened
    init?: ()=>void; // Fired on constructor
    beforeSave?: ()=>void;
    afterSave?: (saveData: NodeSave)=>void;
    beforeLoad?: (saveData: NodeSave)=>void;
    afterLoad?: (saveData: NodeSave)=>void;
    logicLoaded?: (logic: iEditorLogic | iEngineLogic)=>void;
    afterGameDataLoaded?: ()=>void;
    onCreate?: // Fired when instance is spawned, or when editor node is created
        ((this: iEngineNode, eventContext: iEventContext)=>void) |
        ((this: iEditorNode)=>void);
    onBeforeMount?: ()=>void;
    onMount?: ()=>void;
    onNewVariable?: ()=>void;
    onEdit?: ()=>void;
    onInput?: (event: iNodeInputEvent)=>void;
    onMove?: ()=>void;
    onNewConnection?: (connection: iNodeConnection, isUndo?: boolean)=>void;
    onRemoveConnection?: (connection: iNodeConnection, isUndo?: boolean)=>void;
    onValueChange?: (value: unknown)=>void;
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

    addNode(templateId: string, pos: Vec2, nodeAPI: iEditorAPI, nodeRef?: iEditorNode): iEditorNode;
    deleteNode(nodeRef: iEditorNode): void;
    addConnection(connectionObj: iNodeConnection): void;
    removeConnection(id: number, connectionObj?: Connection): boolean;
    setLocalVariable(name: string, type: SOCKET_TYPE, isList: boolean): void;
    getLocalVariable(name: string): iEditorVariable | undefined;
    deleteLocalVariable(name: string): void;
    toSaveData(): LogicSave;
}

export interface iEditorNodeInTrigger extends iInTrigger {
    node: iEditorNode,
};

export interface iEditorNodeOutTrigger {
    id: string,
    node: iEditorNode,
}

export type iEditorNodeInput = iInput & {
    node: iEditorNode;
    value: number | string | boolean | null;
};

export interface iEditorNodeOutput extends iOutput {
    node: iEditorNode,
};

export type iEditorNodeMethod = (this: iEditorNode, data?: unknown) => unknown;

export type iEditorVariable = {type: SOCKET_TYPE, isList: boolean};

export interface iEditorNode extends iNode_Base, iEditorNodeLifecycle {
    templateId: string;
    widget?: Widget;
    inTriggers: Map<string, iEditorNodeInTrigger>;
    outTriggers: Map<string, iEditorNodeOutTrigger>;
    inputs: Map<string, iEditorNodeInput>;
    outputs: Map<string, iEditorNodeOutput>;
    parentScript: iEditorLogic;
    graphId: number;
    pos: Vec2;
    editorCanDelete: boolean;
    showEditButton: boolean;
    editorAPI: iEditorAPI;
    domRef: HTMLDivElement | null;

    //misc settings
    reverseInputs?: boolean;
    reverseOutputs?: boolean;
    inputBoxWidth?: number;
    stackDataIO?: boolean;
    doNotCopy?: boolean;

    onEditorMove: Event_Emitter<(newPos: Vec2)=>void>;
    onForceUpdate: Event_Emitter<()=>void>;
    onForceSocketUpdate: Event_Emitter<(socketName?: string)=>void>;
    onUpdateConnections: Event_Emitter<()=>void>;
    onRecalcWidth: Event_Emitter<()=>void>;

    setDomRef(domRef: HTMLDivElement): void;
    setPos(newPos: Readonly<Vec2>): void;
    toSaveData(): NodeSave;
    refresh(): void;

    getInput(inputName: string): number | string | boolean | null;
}

export interface iNodeConnection {
    id: number;
    type: Node_Enums.SOCKET_TYPE | null;
    graphId: number;
    canConnect: boolean;
    startNode: iEditorNode | null;
    startSocketEl: HTMLElement | null;
    endNode: iEditorNode | null;
    endSocketEl: HTMLElement | null;
    startSocketId: string | null;
    endSocketId: string | null;
    disconnectedFrom: string | null;

    onConnectionUpdate: Event_Emitter<()=>void>;
    onForceUpdate: Event_Emitter<()=>void>;

    toSaveData(): ConnectionSave;
    componentDestructor(): void;
    update(): void;
}

export interface iVarInfo {
    name: string,
    type: SOCKET_TYPE,
    isGlobal: boolean | 1 | 0,
    isList: boolean | 1 | 0,
}

export interface iEditorAPI {
    undoStore: Undo_Store<ActionCallbackData>;
    globalVariableMap: Map<string, iEditorVariable>;
    gameDataStore: ReturnType<typeof useGameDataStore>;
    logicEditorStore: unknown;

    getGlobalVariable(name: string): iEditorVariable | undefined;
    setGlobalVariable(name: string, type: SOCKET_TYPE, isList: boolean): void;
    deleteGlobalVariable(name: string): void;
    getVariableUsage(name: string, nodeType: string | null, isGlobal: boolean): iEditorNode[];
    getInputConnection(node: iEditorNode, socketId: string): iNodeConnection | null;
    getOutputConnections(node: iEditorNode, socketId: string): iNodeConnection[];
    getConnectedInputSocket(node: iEditorNode, socketId: string, inputConnection?: iNodeConnection): iEditorNodeInput | iEditorNodeOutput | undefined;
    getSelectedNodes(): iEditorNode[];
    clearSelectedNodes(): void;
    addNode(node: iEditorNode, commit?: boolean): void;
    deleteNodes(nodeList: iEditorNode[], commit?: boolean): void;
    deleteConnections(connectionList: iNodeConnection[], commit?: boolean): void;
    forEachNode(callback: (...args: unknown[])=>void, isGlobal: boolean): void;
    dialogConfirm(textInfo: {textId: string, vars: {[keys: string]: unknown}}, callback: (positive: boolean)=>void): void;
    dialogVariable(callback: (positive: boolean, varInfo: iVarInfo)=>void, edit?: iVarInfo): void;
    popLastCommit(): void;
    t(text: string): string;
    nextTick(callback: ()=>void): void;
    registerAction(key: unknown, action: ActionCallback, revert: ActionCallback): void;
    executeAction<T extends ActionCallbackData>(key: unknown, args: T, commit: boolean): void;
    pushNodeException(data: iNodeExceptionData): void;
    clearNodeException(errorId: symbol): void;
}

export interface iEngineLogic {
    id: number;
    name: string;
    graphNames: Map<number, string>;
    category_ID: CATEGORY_ID;
    events: Map<string, iEngineNode[]>;
    localVariableDefaults: Map<string, iEngineVariable>;

    setLocalVariableDefault(name: string, value: unknown, type: SOCKET_TYPE, isList: boolean): void;
    executeEvent(eventName: string, instance: Instance_Object, data: unknown): void;
    dispatchOnCreate(instance: Instance_Object): void;
    dispatchLogicLoaded(): void;
    dispatchAfterGameDataLoaded(): void;
}

export interface iEngineInTrigger {
    execute(eventContext: iEventContext, data: unknown): void,
    node: iEngineNode,
    connection: iEngineOutTrigger | null,
};

export interface iEngineOutTrigger {
    connection: iEngineInTrigger | null,
}

export interface iEngineInput {
    value: unknown,
    type: SOCKET_TYPE,
    connection: iEngineOutput | null,
    isList?: boolean,
};

export interface iEngineOutput {
    id: string,
    connection: iEngineInput | null,
    node: iEngineNode,
    type: SOCKET_TYPE,
    execute(eventContext: iEventContext, data: unknown): void,
    isList?: boolean,
};

export type iEngineNodeMethod = (this: iEngineNode, eventContext: iEventContext, data?: unknown) => unknown;

export type iEngineVariable = {value: unknown, type: SOCKET_TYPE, isList: boolean};

type ResolveKey<T> = T extends SOCKET_TYPE ? T : never;

export interface iEngineNode extends iNode_Base {
    inTriggers: Map<string, iEngineInTrigger>;
    outTriggers: Map<string, iEngineOutTrigger>;
    inputs: Map<string, iEngineInput>;
    outputs: Map<string, iEngineOutput>;
    parentScript: iEngineLogic;
    graphId: number;

    engine: Engine;

    getWidgetData(): unknown;
    triggerOutput(outputId: string, eventContext: iEventContext): void;

    throwOnNullInput<T extends iInput>(socketTemplate: T & {isList?: never}, eventContext: iEventContext, errorId: string, fatal?: false | never): SocketTypeLookup[ResolveKey<T['type']>] | typeof Node_Enums.THROWN | null;
    throwOnNullInput<T extends iInput>(socketTemplate: T & {isList: true}, eventContext: iEventContext, errorId: string, fatal?: false | never): Array<SocketTypeLookup[T['type']]> | typeof Node_Enums.THROWN | null;
    throwOnNullInput<T extends iInput>(socketTemplate: T & {isList?: never}, eventContext: iEventContext, errorId: string, fatal: true): SocketTypeLookup[T['type']] | null;
    throwOnNullInput<T extends iInput>(socketTemplate: T & {isList: true}, eventContext: iEventContext, errorId: string, fatal: true): Array<SocketTypeLookup[T['type']]> | null;

    getInput<T extends iInput>(socketTemplate: T & {isList?: never} & {optional?: never}, eventContext: iEventContext, convertList?: true): SocketTypeLookup[T['type']];
    getInput<T extends iInput>(socketTemplate: T & {isList: true} & {optional?: never}, eventContext: iEventContext): Array<SocketTypeLookup[T['type']]>;

    getOptionalInput<T extends iInput>(socketTemplate: T & {isList?: never} & {optional: true}, eventContext: iEventContext): SocketTypeLookup[T['type']] | null;
}

export interface iEventSignature {id: string, data?: unknown};

export type iEventContext = {eventKey: number, instance: Instance_Object};

export interface iNodeExceptionData {
    errorId: symbol;
    msgId: string;
    msgVars?: Record<string, unknown>;
    logicId: number;
    nodeId: number;
    fatal?: boolean;
    onClearCallback?: (data: iNodeExceptionData)=>void;
}

export interface iNodeInputEvent {
    target: HTMLInputElement,
    value: number | string,
}

export type iSocketInfo = Omit<iEditorNodeInput, 'value'> & {
    value: {
    	data: string;
    	titleId: string;
    	translate: boolean;
    }
};
