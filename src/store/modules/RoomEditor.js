// import {ROOM_TOOL_TYPE} from '@shared/Enums';

const state = {
    selectedTool: null,
    selectedNavTool: null,
    propertiesOpen: false,
    viewGrid: true
}

const init = ()=>{
    if (!window.Shared){
        setTimeout(init);
        return;
    }

    state.selectedTool = Shared.ROOM_TOOL_TYPE.SELECT_MOVE;
}

init();

const getters = {
    getSelectedTool: state => state.selectedTool,
    getSelectedNavTool: state => state.selectedNavTool,
    getPropPanelState: state => state.propertiesOpen,
    getGridState: state => state.viewGrid
}

const actions = {
    setSelectedTool({commit}, newTool){
        commit('setSelectedTool', newTool);
    },
    setSelectedNavTool({commit}, newTool){
        commit('setSelectedNavTool', newTool);
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
    setSelectedNavTool: (state, newTool) => state.selectedNavTool = newTool,
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