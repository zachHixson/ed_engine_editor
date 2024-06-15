import { defineStore } from 'pinia';
import type Core from '@/core';

interface Error {
    errorId: symbol,
    nodeId: number,
    logicId: number,
    msgId: string,
    fatal?: boolean,
}

export interface iState {
    selectedNavTool: Core.NAV_TOOL_TYPE | null,
    openCategory: string | null,
    graphPanelOpen: boolean,
    globalVariableMap: Map<string, Core.iEditorVariable>,
    clipboard: {
        nodeData: Core.iNodeSaveData[],
        connectionData: Core.iConnectionSaveData[],
    },
    errors: ReadonlyArray<Error>,
}

export const useLogicEditorStore = defineStore({
    id: 'LogicEditor',

    state: (): iState => ({
        selectedNavTool: null,
        openCategory: null,
        graphPanelOpen: false,
        globalVariableMap: new Map<string, Core.iEditorVariable>(),
        clipboard: {
            nodeData: [],
            connectionData: [],
        },
        errors: [],
    }),
    
    getters: {
        getSelectedNavTool: (state): Core.NAV_TOOL_TYPE | null => state.selectedNavTool,
        getOpenCategory: (state): string | null => state.openCategory,
        isGraphPanelOpen: (state): boolean => state.graphPanelOpen,
        getGlobalVariableMap: (state): Map<string, Core.iEditorVariable> => state.globalVariableMap,
        getClipboard: (state): iState['clipboard'] => state.clipboard,
    },

    actions: {
        selectNavTool(newTool: Core.NAV_TOOL_TYPE | null){ this.selectedNavTool = newTool },
        setOpenCategory(category: string | null){ this.openCategory = category },
        setGraphPanelState(newState: boolean){ this.graphPanelOpen = newState },
        setClipboard(nodeData: Core.iNodeSaveData[], connectionData: Core.iConnectionSaveData[]){
            this.clipboard.nodeData = nodeData;
            this.clipboard.connectionData = connectionData;
        },
        addError(newError: Core.iNodeExceptionData){
            (this.errors as Error[]).push(newError);
        },
        clearError(id: symbol){
            const idx = this.errors.findIndex(e => e.errorId == id);
            (this.errors as Error[]).splice(idx, 1);
        },
        clearAllErrors(){
            (this.errors as Error[]).splice(0, this.errors.length);
        },
    }
});