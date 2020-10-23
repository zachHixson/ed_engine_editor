const state = {
    selectedAsset: null
}

const getters = {
    getSelectedAsset: (state) => state.selectedAsset
}

const actions = {
    selectAsset({commit}, newAsset){
        commit('selectAsset', newAsset);
    },
    deselectAssets({commit}){
        commit('deselectAsset');
    }
}

const mutations = {
    selectAsset: (state, newAsset) => state.selectedAsset = newAsset,
    deselectAsset: state => state.selectedAsset = null
}

export default {
    namespaced: true,
    state,
    getters,
    actions,
    mutations
}