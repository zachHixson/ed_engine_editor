const state = {
    selectedColor : "#FFFFFF"
}

const getters = {
    selectedColor: state => state.selectedColor
};

const actions = {
    selectColor({commit}, newColor){
        commit('selectColor', newColor);
    }
};

const mutations = {
    selectColor: (state, newColor) => state.selectedColor = newColor
};

export default {
    namespaced: true,
    state,
    getters,
    actions,
    mutations
};