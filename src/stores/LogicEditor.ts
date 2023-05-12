import { defineStore } from 'pinia';
import type Core from '@/core';

interface iState {
    selectedNavTool: Core.NAV_TOOL_TYPE | null,
    openCategory: string | null,
    graphPanelOpen: boolean,
    globalVariableMap: Map<string, Core.iEditorVariable>,
}

export const useLogicEditorStore = defineStore({
    id: 'LogicEditor',

    state: (): iState => ({
        selectedNavTool: null,
        openCategory: null,
        graphPanelOpen: false,
        globalVariableMap: new Map<string, Core.iEditorVariable>(),
    }),
    
    getters: {
        getSelectedNavTool: (state): Core.NAV_TOOL_TYPE | null => state.selectedNavTool,
        getOpenCategory: (state): string | null => state.openCategory,
        isGraphPanelOpen: (state): boolean => state.graphPanelOpen,
        getGlobalVariableMap: (state): Map<string, Core.iEditorVariable> => state.globalVariableMap,
    },

    actions: {
        selectNavTool(newTool: Core.NAV_TOOL_TYPE | null){ this.selectedNavTool = newTool },
        setOpenCategory(category: string | null){ this.openCategory = category },
        setGraphPanelState(newState: boolean){ this.graphPanelOpen = newState },
    }
});