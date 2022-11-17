import awaitShared from "@/components/common/awaitShared";

const state = {
    selectedColor: awaitShared(() => state.selectedColor = new Shared.Color(255, 255, 255, 255)),
    selectedSize: awaitShared(() => state.selectedSize = Shared.ART_TOOL_SIZE.SMALL),
    selectedTool: awaitShared(() => state.selectedTool = Shared.ART_TOOL_TYPE.BRUSH),
    selectedNavTool: null,
    selectedFrame: 0,
    toolPanelOpen: true,
    animPanelOpen: false
}

const getters = {
    getSelectedColor: state => state.selectedColor,
    getSelectedSize: state => state.selectedSize,
    getSelectedTool: state => state.selectedTool,
    getSelectedNavTool: state => state.selectedNavTool,
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
    setSelectedNavTool({commit}, newTool){
        commit('setSelectedNavTool', newTool);
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
    setSelectedNavTool: (state, newTool) => state.selectedNavTool = newTool,
    selectFrame: (state, newFrame) => state.selectedFrame = newFrame,
    setToolPanelState: (state, newState) => state.toolPanelOpen = newState,
    setAnimPanelState: (state, newState) => state.animPanelOpen = newState
};

export default {
    namespaced: true,
    state,
    getters,
    actions,
    mutations
};