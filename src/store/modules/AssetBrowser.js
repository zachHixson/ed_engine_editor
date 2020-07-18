const state = {
    
}

const getters = {
    getSelectedAsset: (state, getters, rootState) => rootState.GameData.sprites[0]
}

const actions = {
    
}

const mutations = {

}

export default {
    namespaced: true,
    state,
    getters,
    actions,
    mutations
}