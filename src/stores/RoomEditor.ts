import { defineStore } from 'pinia';
import { NAV_TOOL_TYPE } from '@/components/common/NavControlPanel.vue';

export const enum ROOM_TOOL_TYPE {
    SELECT_MOVE = 1,
    ADD_BRUSH,
    ERASER,
    EXIT,
    CAMERA,
    ROOM_PROPERTIES,
    TOGGLE_GRID,
};

interface iState {
    selectedTool: ROOM_TOOL_TYPE | null,
    selectedNavTool: NAV_TOOL_TYPE | null,
    propertiesOpen: boolean,
    viewGrid: boolean,
    addBrushCopy: boolean,
    addBrushOverlap: boolean,
    addBrushDepth: number | null,
    eraserTopOnly: boolean,
    eraserSelectedType: boolean,
}

export const useRoomEditorStore = defineStore('RoomEditor', {
    state: (): iState => ({
        selectedTool: ROOM_TOOL_TYPE.ADD_BRUSH,
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
        setSelectedTool(newTool: ROOM_TOOL_TYPE | null){ this.selectedTool = newTool },
        setSelectedNavTool(newTool: NAV_TOOL_TYPE | null){ this.selectedNavTool = newTool },
        setPropPanelState(newState: boolean){ this.propertiesOpen = newState },
        setGridState(newState: boolean){ this.viewGrid = newState },
    }
});
