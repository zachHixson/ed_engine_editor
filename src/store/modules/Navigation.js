/*
    This "module," is meant to be instanced separately for each editor that uses it,
    therefore the components are declared as functions so they can be used to easily
    add common states and actions to different real modules
*/

import Victor from 'victor';

function navStates(){
    return {
        selectedNavTool: null,
        navZoom: 1,
        navOffset: new Victor(0, 0)
    }
}

function navGetters() {
    return {
        getSelectedNavTool: state => state.selectedNavTool,
        getNavZoom: state => state.navZoom,
        getNavOffset: state => state.navOffset
    }
};

function navActions() {
    return {
        setSelectedNavTool({ commit }, newTool) {
            commit('setNavTool', newTool);
        },
        setNavZoom({ commit }, newZoomLevel) {
            commit('setNavZoom', newZoomLevel);
        },
        setNavOffset({ commit }, newOffset){
            commit('setNavOffset', newOffset);
        }
    }
};

function navMutations() {
    return {
        setNavTool: (state, newTool) => state.selectedNavTool = newTool,
        setNavZoom: (state, newZoomFac) => state.navZoom = newZoomFac,
        setNavOffset: (state, newOffset) => state.navOffset.copy(newOffset)
    }
};

export {
    navStates,
    navGetters,
    navActions,
    navMutations
}