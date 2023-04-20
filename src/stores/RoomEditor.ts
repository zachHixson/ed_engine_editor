import { defineStore } from 'pinia';
import Core from '@/core';

interface iState {
    selectedTool: Core.ROOM_TOOL_TYPE | null,
    selectedNavTool: Core.NAV_TOOL_TYPE | null,
    propertiesOpen: boolean,
    viewGrid: boolean,
    addBrushCopy: boolean,
    addBrushOverlap: boolean,
    addBrushDepth: number | null,
    eraserTopOnly: boolean,
    eraserSelectedType: boolean,
}

export const useRoomEditorStore = defineStore({
    id: 'RoomEditor',

    state: (): iState => ({
        selectedTool: Core.ROOM_TOOL_TYPE.ADD_BRUSH,
        selectedNavTool: null,
        propertiesOpen: false,
        viewGrid: true,
        addBrushCopy: false,
        addBrushOverlap: false,
        addBrushDepth: null,
        eraserTopOnly: true,
        eraserSelectedType: false,
    }),

    getters: {
        getSelectedTool: state => state.selectedTool,
        getSelectedNavTool: state => state.selectedNavTool,
        getPropPanelState: state => state.propertiesOpen,
        getGridState: state => state.viewGrid
    },

    actions: {
        setSelectedTool(newTool: Core.ROOM_TOOL_TYPE | null){ this.selectedTool = newTool },
        setSelectedNavTool(newTool: Core.NAV_TOOL_TYPE | null){ this.selectedNavTool = newTool },
        setPropPanelState(newState: boolean){ this.propertiesOpen = newState },
        setGridState(newState: boolean){ this.viewGrid = newState },
    }
});