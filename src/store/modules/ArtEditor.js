import {navStates, navGetters, navActions, navMutations} from './Navigation';
import {ART_TOOL_SIZE, ART_TOOL_TYPE} from '@/common/Enums';

const state = {
    ...navStates(),
    selectedColor : "#FFFFFF",
    selectedSize: ART_TOOL_SIZE.SMALL,
    selectedTool: ART_TOOL_TYPE.BRUSH,
    selectedFrame: 0,
    toolPanelOpen: true,
    animPanelOpen: false
}

const getters = {
    ...navGetters(),
    getSelectedColor: state => state.selectedColor,
    getSelectedSize: state => state.selectedSize,
    getSelectedTool: state => state.selectedTool,
    getSelectedFrame: state => state.selectedFrame,
    isToolPanelOpen: state => state.toolPanelOpen,
    isAnimPanelOpen: state => state.animPanelOpen
};

const actions = {
    ...navActions(),
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
    ...navMutations(),
    selectColor: (state, newColor) => state.selectedColor = newColor,
    selectSize: (state, newSize) => state.selectedSize = newSize,
    selectTool: (state, newTool) => state.selectedTool = newTool,
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