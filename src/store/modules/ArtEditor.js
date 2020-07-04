import Navigation from './Navigation';

const state = {
    selectedColor : "#FFFFFF",
    selectedSize: 'small_brush',
    selectedTool: 'brush'
}

const getters = {
    getSelectedColor: state => state.selectedColor,
    getSelectedSize: state => state.selectedSize,
    getSelectedTool: state => state.selectedTool
};

const actions = {
    selectColor({commit}, newColor){
        commit('selectColor', newColor);
    },
    selectSize({commit}, newSize){
        commit('selectSize', newSize);
    },
    selectTool({commit}, newTool){
        commit('selectTool', newTool);
    }
};

const mutations = {
    selectColor: (state, newColor) => state.selectedColor = newColor,
    selectSize: (state, newSize) => state.selectedSize = newSize,
    selectTool: (state, newTool) => state.selectedTool = newTool
};

const modules = {
    Navigation
}

export default {
    namespaced: true,
    state,
    getters,
    actions,
    mutations,
    modules
};