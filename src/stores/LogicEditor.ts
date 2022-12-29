import { defineStore } from 'pinia';
import type Core from '@/core';

interface iState {
    selectedNavTool: Core.NAV_TOOL_TYPE | null,
    libraryPanelOpen: boolean,
    graphPanelOpen: boolean,
    globalVariableMap: Map<string, Core.Node_Enums.SOCKET_TYPE>
}

export const useLogicEditorStore = defineStore({
    id: 'LogicEditor',

    state: (): iState => ({
        selectedNavTool: null,
        libraryPanelOpen: true,
        graphPanelOpen: false,
        globalVariableMap: new Map<string, Core.Node_Enums.SOCKET_TYPE>(),
    }),
    
    getters: {
        getSelectedNavTool: (state): Core.NAV_TOOL_TYPE | null => state.selectedNavTool,
        isLibraryPanelOpen: (state): boolean => state.libraryPanelOpen,
        isGraphPanelOpen: (state): boolean => state.graphPanelOpen,
        getGlobalVariableMap: (state): Map<string, Core.Node_Enums.SOCKET_TYPE> => state.globalVariableMap,
    },

    actions: {
        selectNavTool(newTool: Core.NAV_TOOL_TYPE | null){ this.selectedNavTool = newTool },
        setLibraryPanelState(newState: boolean){ this.libraryPanelOpen = newState },
        setGraphPanelState(newState: boolean){ this.graphPanelOpen = newState },
    }
});