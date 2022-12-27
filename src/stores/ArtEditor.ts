import { defineStore } from 'pinia';
import Core from '@/core';

interface iState {
    selectedColor: any, //Pinia doesn't like the private variables in Core.Draw.Color for some reason, so using 'any' instead.
    selectedSize: Core.ART_TOOL_SIZE,
    selectedTool: Core.ART_TOOL_TYPE | null,
    selectedNavTool: Core.NAV_TOOL_TYPE | null,
    selectedFrame: number,
    toolPanelOpen: boolean,
    animPanelOpen: boolean,
}

export const useArtEditorStore = defineStore({
    id: 'ArtEditor',

    state: (): iState => ({
        selectedColor: new Core.Draw.Color(255, 255, 255, 255),
        selectedSize: Core.ART_TOOL_SIZE.SMALL,
        selectedTool: Core.ART_TOOL_TYPE.BRUSH,
        selectedNavTool: null,
        selectedFrame: 0,
        toolPanelOpen: true,
        animPanelOpen: false,
    }),

    getters: {
        getSelectedColor: (state): Core.Draw.Color => state.selectedColor,
        getSelectedSize: (state): Core.ART_TOOL_SIZE => state.selectedSize,
        getSelectedTool: (state): Core.ART_TOOL_TYPE | null => state.selectedTool,
        getSelectedNavTool: (state): Core.NAV_TOOL_TYPE | null => state.selectedNavTool,
        getSelectedFrame: (state): number => state.selectedFrame,
        isToolPanelOpen: (state): boolean => state.toolPanelOpen,
        isAnimPanelOpen: (state): boolean => state.animPanelOpen,
    },

    actions: {
        selectColor(newColor: Core.Draw.Color){ this.selectedColor = newColor },
        selectSize(newSize: Core.ART_TOOL_SIZE){ this.selectedSize = newSize },
        selectTool(newTool: Core.ART_TOOL_TYPE){ this.selectedTool = newTool },
        setSelectedNavTool(newTool: Core.NAV_TOOL_TYPE | null){ this.selectedNavTool = newTool },
        selectFrame(newFrame: number){ this.selectedFrame = newFrame },
        setToolPanelState(newState: boolean){ this.toolPanelOpen = newState },
        setAnimPanelState(newState: boolean){ this.animPanelOpen = newState },
    },
});