import { defineStore } from 'pinia';
import type Core from '@/core';

export interface iState {
    selectedNavTool: Core.NAV_TOOL_TYPE | null,
    openCategory: string | null,
    graphPanelOpen: boolean,
    globalVariableMap: Map<string, Core.iEditorVariable>,
    clipboard: {
        nodeData: Core.NodeSave[],
        connectionData: Core.ConnectionSave[],
    },
    errors: ReadonlyArray<Core.iNodeExceptionData>,
    nodeDoc: any,
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
        nodeDoc: {},
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
        setClipboard(nodeData: Core.NodeSave[], connectionData: Core.ConnectionSave[]){
            this.clipboard.nodeData = nodeData;
            this.clipboard.connectionData = connectionData;
        },
        addError(newError: Core.iNodeExceptionData) {
            const errors = this.errors as Core.iNodeExceptionData[];

            for (let i = 0; i < errors.length; i++){
                if (errors[i].errorId == newError.errorId) return;
            }

            (this.errors as Core.iNodeExceptionData[]).push(newError);
        },
        clearError(id: symbol){
            const idx = this.errors.findIndex(e => e.errorId == id);
            if (idx < 0) return;
            const error = this.errors[idx];
            if (error.onClearCallback) error.onClearCallback(error);
            (this.errors as Core.iNodeExceptionData[]).splice(idx, 1);
        },
        clearAllErrors(){
            const errors = this.errors as Core.iNodeExceptionData[];
            errors.forEach(e => {if (e.onClearCallback) e.onClearCallback(e)});
            errors.splice(0, this.errors.length);
        },
        setNodeDoc(rawJson: string){
            this.nodeDoc = JSON.parse(rawJson);
        },
        getNodeDoc(templateId: string): any {
            return this.nodeDoc[templateId];
        },
    }
});