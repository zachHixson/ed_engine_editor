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
        test: state => state,
        getSelectedNavTool: state => state.selectedNavTool,
        isLibraryPanelOpen: state => state.libraryPanelOpen,
        isGraphPanelOpen: state => state.graphPanelOpen,
        getGlobalVariableMap: state => state.globalVariableMap,
    },

    actions: {
        selectNavTool(newTool: Shared.NAV_TOOL_TYPE){ this.selectedNavTool = newTool },
        setLibraryPanelState(newState: boolean){ this.libraryPanelOpen = newState },
        setGraphPanelState(newState: boolean){ this.graphPanelOpen = newState },
    }
});