const state = {
    selectedAsset: null
}

const getters = {
    getSelectedAsset: (state) => state.selectedAsset
}

const actions = {
    selectAsset({commit}, newAsset){
        commit('selectAsset', newAsset);
    }
}

const mutations = {
    selectAsset: (state, newAsset) => state.selectedAsset = newAsset
}

export default {
    namespaced: true,
    state,
    getters,
    actions,
    mutations
}