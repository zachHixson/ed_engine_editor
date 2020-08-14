import Navigation from './Navigation';

const state = {
    selectedColor : "#FFFFFF",
    selectedSize: 0,
    selectedTool: 0,
    selectedFrame: 0,
    toolPanelOpen: true,
    animPanelOpen: false
}

const getters = {
    getSelectedColor: state => state.selectedColor,
    getSelectedSize: state => state.selectedSize,
    getSelectedTool: state => state.selectedTool,
    getSelectedFrame: state => state.selectedFrame,
    isToolPanelOpen: state => state.toolPanelOpen,
    isAnimPanelOpen: state => state.animPanelOpen
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
    },
    selectFrame({commit}, newFrame){
        commit('selectFrame', newFrame);
    },
    setToolPanelState({commit}, newState){
        commit('setToolPanelState', newState);
    },
    setAnimPanelState({commit}, newState){
        commit('setAnimPanelState', newState);
    }
};

const mutations = {
    selectColor: (state, newColor) => state.selectedColor = newColor,
    selectSize: (state, newSize) => state.selectedSize = newSize,
    selectTool: (state, newTool) => state.selectedTool = newTool,
    selectFrame: (state, newFrame) => state.selectedFrame = newFrame,
    setToolPanelState: (state, newState) => state.toolPanelOpen = newState,
    setAnimPanelState: (state, newState) => state.animPanelOpen = newState
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