import Victor from 'victor';

const state = {
    selectedTool: null,
    zoomFac: 1,
    offset: new Victor(0, 0)
};

const getters = {
    getSelectedTool: state => state.selectedTool,
    getZoomFac: state => state.zoomFac,
    getOffset: state => state.offset
};

const actions = {
    setSelectedTool({ commit }, newTool) {
        commit('setTool', newTool);
    },
    setZoomFac({ commit }, newZoomLevel) {
        commit('setZoomFac', newZoomLevel);
    },
    setOffset({ commit }, newOffset){
        commit('setOffset', newOffset);
    }
};

const mutations = {
    setTool: (state, newTool) => state.selectedTool = newTool,
    setZoomFac: (state, newZoomFac) => state.zoomFac = newZoomFac,
    setOffset: (state, newOffset) => state.offset.copy(newOffset)
};

export default {
    state,
    getters,
    actions,
    mutations
}