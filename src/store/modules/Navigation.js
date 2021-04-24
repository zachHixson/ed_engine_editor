/*
    This "module," is meant to be instanced separately for each editor that uses it,
    therefore the components are declared as functions so they can be used to easily
    add common states and actions to different real modules
*/

import Victor from 'victor';

function navStates(){
    return {
        selectedTool: null,
        zoomFac: 1,
        offset: new Victor(0, 0)
    }
}

function navGetters() {
    return {
        getSelectedNavTool: state => state.selectedTool,
        getZoomFac: state => state.zoomFac,
        getOffset: state => state.offset
    }
};

function navActions() {
    return {
        setSelectedNavTool({ commit }, newTool) {
            commit('setTool', newTool);
        },
        setZoomFac({ commit }, newZoomLevel) {
            commit('setZoomFac', newZoomLevel);
        },
        setOffset({ commit }, newOffset){
            commit('setOffset', newOffset);
        }
    }
};

function navMutations() {
    return {
        setTool: (state, newTool) => state.selectedTool = newTool,
        setZoomFac: (state, newZoomFac) => state.zoomFac = newZoomFac,
        setOffset: (state, newOffset) => state.offset.copy(newOffset)
    }
};

export {
    navStates,
    navGetters,
    navActions,
    navMutations
}