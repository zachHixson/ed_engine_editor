const state = {
    selectedAsset: null,
    selectedRoom: null
}

const getters = {
    getSelectedAsset: (state) => state.selectedAsset,
    getSelectedRoom: (state) => state.selectedRoom
}

const actions = {
    selectAsset({commit}, newAsset){
        commit('selectAsset', newAsset);
    },
    deselectAssets({commit}){
        commit('deselectAsset');
    },
    selectRoom({commit}, newRoom){
        commit('selectRoom', newRoom);
    },
    deselectRoom({commit}){
        commit('deselectRoom');
    },
    deselectAllAssets({commit}){
        commit('deselectAsset');
        commit('deselectRoom');
    }
}

const mutations = {
    selectAsset: (state, newAsset) => state.selectedAsset = newAsset,
    deselectAsset: state => state.selectedAsset = null,
    selectRoom: (state, newRoom) => state.selectedRoom = newRoom,
    deselectRoom: (state) => state.selectedRoom = null
}

export default {
    namespaced: true,
    state,
    getters,
    actions,
    mutations
}