import { defineStore } from 'pinia';
import Shared from '@/Shared';

interface iState {
    selectedTool: typeof Shared.ROOM_TOOL_TYPE | null,
    selectedNavTool: typeof Shared.NAV_TOOL_TYPE | null,
    propertiesOpen: boolean,
    viewGrid: boolean,
}

export const useRoomEditorStore = defineStore({
    id: 'RoomEditor',

    state: (): iState => ({
        selectedTool: Shared.ROOM_TOOL_TYPE.SELECT_MOVE,
        selectedNavTool: null,
        propertiesOpen: false,
        viewGrid: true
    }),

    getters: {
        getSelectedTool: state => state.selectedTool,
        getSelectedNavTool: state => state.selectedNavTool,
        getPropPanelState: state => state.propertiesOpen,
        getGridState: state => state.viewGrid
    },

    actions: {
        setSelectedTool(newTool: typeof Shared.ROOM_TOOL_TYPE){ this.selectedTool = newTool },
        setSelectedNavTool(newTool: typeof Shared.NAV_TOOL_TYPE){ this.selectedNavTool = newTool },
        setPropPanelState(newState: boolean){ this.propertiesOpen = newState },
        setGridState(newState: boolean){ this.viewGrid = newState },
    }
});