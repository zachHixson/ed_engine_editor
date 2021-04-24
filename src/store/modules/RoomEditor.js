import {ROOM_TOOL_TYPE} from '@/common/Enums';
import {navStates, navGetters, navActions, navMutations} from './Navigation';

const state = {
    ...navStates(),
    selectedTool: ROOM_TOOL_TYPE.SELECT_MOVE,
    propertiesOpen: false,
    viewGrid: true
}

const getters = {
    ...navGetters(),
    getSelectedTool: state => state.selectedTool,
    getPropPanelState: state => state.propertiesOpen,
    getGridState: state => state.viewGrid
}

const actions = {
    ...navActions(),
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
    ...navMutations(),
    setSelectedTool: (state, newTool) => state.selectedTool = newTool,
    setPropPanelState: (state, newState) => state.propertiesOpen = newState,
    setGridState: (state, newState) => state.viewGrid = newState
}

export default {
    namespaced: true,
    state,
    getters,
    actions,
    mutations
}