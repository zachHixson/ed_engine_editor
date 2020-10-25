import {ROOM_TOOL_TYPE} from '@/common/Enums';
import Navigation from './Navigation';

const state = {
    selectedTool: ROOM_TOOL_TYPE.SELECT_MOVE,
    propertiesOpen: false,
    viewGrid: true
}

const getters = {
    getSelectedTool: state => state.selectedTool,
    getPropPanelState: state => state.propertiesOpen,
    getGridState: state => state.viewGrid
}

const actions = {
    setSelectedTool({commit}, newTool){
        commit('setSelectedTool', newTool);
    },
    setPropPanelState({commit}, newState){
        commit('setPropPanelState', newState);
    },
    setGridState({commit}, newState){
        commit('setGridState', newState);
    }
}

const mutations = {
    setSelectedTool: (state, newTool) => state.selectedTool = newTool,
    setPropPanelState: (state, newState) => state.propertiesOpen = newState,
    setGridState: (state, newState) => state.viewGrid = newState
}

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
}