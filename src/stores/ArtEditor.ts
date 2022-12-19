import { defineStore } from 'pinia';

interface iState {
    selectedColor: Shared.Color,
    selectedSize: Shared.ART_TOOL_SIZE,
    selectedTool: Shared.ART_TOOL_TYPE | null,
    selectedNavTool: Shared.NAV_TOOL_TYPE | null,
    selectedFrame: number,
    toolPanelOpen: boolean,
    animPanelOpen: boolean,
}

export const useArtEditorStore = defineStore({
    id: 'ArtEditor',

    state: (): iState => ({
        selectedColor: new Shared.Color(255, 255, 255, 255),
        selectedSize: Shared.ART_TOOL_SIZE.SMALL,
        selectedTool: Shared.ART_TOOL_TYPE.BRUSH,
        selectedNavTool: null,
        selectedFrame: 0,
        toolPanelOpen: true,
        animPanelOpen: false,
    }),

    getters: {
        getSelectedColor: state => state.selectedColor,
        getSelectedSize: state => state.selectedSize,
        getSelectedTool: state => state.selectedTool,
        getSelectedNavTool: state => state.selectedNavTool,
        getSelectedFrame: state => state.selectedFrame,
        isToolPanelOpen: state => state.toolPanelOpen,
        isAnimPanelOpen: state => state.animPanelOpen,
    },

    actions: {
        selectColor(newColor: Shared.Color){ this.selectedColor = newColor },
        selectSize(newSize: Shared.ART_TOOL_SIZE){ this.selectedSize = newSize },
        selectTool(newTool: Shared.ART_TOOL_TYPE){ this.selectedTool = newTool },
        setSelectedNavTool(newTool: Shared.NAV_TOOL_TYPE){ this.selectedNavTool = newTool },
        selectFrame(newFrame: number){ this.selectedFrame = newFrame },
        setToolPanelState(newState: boolean){ this.toolPanelOpen = newState },
        setAnimPanelState(newState: boolean){ this.animPanelOpen = newState },
    },
});