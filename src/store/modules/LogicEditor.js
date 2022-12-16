const state = {
    selectedNavTool: null,
    libraryPanelOpen: true,
    graphPanelOpen: false,
    globalVariableMap: new Map(),
}

const getters = {
    test: state => state,
    getSelectedNavTool: state => state.selectedNavTool,
    isLibraryPanelOpen: state => state.libraryPanelOpen,
    isGraphPanelOpen: state => state.graphPanelOpen,
    getGlobalVariableMap: state => state.globalVariableMap,
};

const actions = {
    selectNavTool({commit}, newTool){
        commit('selectNavTool', newTool);
    },
    setLibraryPanelState({commit}, newState){
        commit('setLibraryPanelState', newState);
    },
    setGraphPanelState({commit}, newState){
        commit('setGraphPanelState', newState);
    },
};

const mutations = {
    selectNavTool: (state, newTool) => state.selectedNavTool = newTool,
    setLibraryPanelState: (state, newState) => state.libraryPanelOpen = newState,
    setGraphPanelState: (state, newState) => state.graphPanelOpen = newState,
};

export default {
    namespaced: true,
    state,
    getters,
    actions,
    mutations
};