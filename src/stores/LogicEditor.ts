import { defineStore } from 'pinia';

interface iState {
    selectedNavTool: Shared.NAV_TOOL_TYPE | null,
    libraryPanelOpen: boolean,
    graphPanelOpen: boolean,
    globalVariableMap: Map<string, Shared.SOCKET_TYPE>
}

export const useLogicEditorStore = defineStore({
    id: 'LogicEditor',

    state: (): iState => ({
        selectedNavTool: null,
        libraryPanelOpen: true,
        graphPanelOpen: false,
        globalVariableMap: new Map<string, Shared.SOCKET_TYPE>(),
    }),
    
    getters: {
        getSelectedNavTool: (state): Shared.NAV_TOOL_TYPE => state.selectedNavTool,
        isLibraryPanelOpen: (state): boolean => state.libraryPanelOpen,
        isGraphPanelOpen: (state): boolean => state.graphPanelOpen,
        getGlobalVariableMap: (state): Map<string, Shared.SOCKET_TYPE> => state.globalVariableMap,
    },

    actions: {
        selectNavTool(newTool: Shared.NAV_TOOL_TYPE){ this.selectedNavTool = newTool },
        setLibraryPanelState(newState: boolean){ this.libraryPanelOpen = newState },
        setGraphPanelState(newState: boolean){ this.graphPanelOpen = newState },
    }
});