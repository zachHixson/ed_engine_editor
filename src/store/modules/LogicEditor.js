const state = {
    selectedNavTool: null,
    eventPanelOpen: true,
    libraryPanelOpen: true,
}

const getters = {
    test: state => state,
    getSelectedNavTool: state => state.selectedNavTool,
    isEventPanelOpen: state => state.eventPanelOpen,
    isLibraryPanelOpen: state => state.libraryPanelOpen,
};

const actions = {
    selectNavTool({commit}, newTool){
        commit('selectNavTool', newTool);
    },
    setEventPanelState({commit}, newState){
        commit('setEventPanelState', newState);
    },
    setLibraryPanelState({commit}, newState){
        commit('setLibraryPanelState', newState);
    },
};

const mutations = {
    selectNavTool: (state, newTool) => state.selectedNavTool = newTool,
    setEventPanelState: (state, newState) => state.eventPanelOpen = newState,
    setLibraryPanelState: (state, newState) => state.libraryPanelOpen = newState,
};

export default {
    namespaced: true,
    state,
    getters,
    actions,
    mutations
};