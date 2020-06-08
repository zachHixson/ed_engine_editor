const state = {
    selectedEditor: 'level'
}

const getters = {
    selectedTab: state => state.selectedEditor
};

const actions = {
    switchTab({commit}, newEditor){
        commit('switchTab', newEditor);
    }
};

const mutations = {
    switchTab: (state, newEditor) => state.selectedEditor = newEditor
};

export default {
    state,
    getters,
    actions,
    mutations
};