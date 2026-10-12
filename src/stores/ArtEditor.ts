import { defineStore } from 'pinia';
import { NAV_TOOL_TYPE } from '@/components/common/NavControlPanel.vue';
import Core from '@/core';

export const enum ART_TOOL_SIZE {
    SMALL = 1,
    MEDIUM,
    LARGE,
};

export const enum ART_TOOL_TYPE {
    BRUSH = 1,
    BUCKET,
    LINE,
    BOX,
    BOX_FILL,
    ELLIPSE,
    ELLIPSE_FILL,
    ERASER,
    MOVE,
    EYE_DROPPER,
};

interface iState {
    selectedColor: any, //Pinia doesn't like the private variables in Core.Draw.Color for some reason, so using 'any' instead.
    selectedSize: ART_TOOL_SIZE,
    selectedTool: ART_TOOL_TYPE | null,
    selectedNavTool: NAV_TOOL_TYPE | null,
    selectedFrame: number,
    toolPanelOpen: boolean,
    animPanelOpen: boolean,
}

export const useArtEditorStore = defineStore('ArtEditor', {
    state: (): iState => ({
        selectedColor: new Core.Draw.Color(255, 255, 255, 255),
        selectedSize: ART_TOOL_SIZE.SMALL,
        selectedTool: ART_TOOL_TYPE.BRUSH,
        selectedNavTool: null,
        selectedFrame: 0,
        toolPanelOpen: true,
        animPanelOpen: false,
    }),

    getters: {
        getSelectedColor: (state): Core.Draw.Color => state.selectedColor,
        getSelectedSize: (state): ART_TOOL_SIZE => state.selectedSize,
        getSelectedTool: (state): ART_TOOL_TYPE | null => state.selectedTool,
        getSelectedNavTool: (state): NAV_TOOL_TYPE | null => state.selectedNavTool,
        getSelectedFrame: (state): number => state.selectedFrame,
        isToolPanelOpen: (state): boolean => state.toolPanelOpen,
        isAnimPanelOpen: (state): boolean => state.animPanelOpen,
    },

    actions: {
        selectColor(newColor: Core.Draw.Color){ this.selectedColor = newColor },
        selectSize(newSize: ART_TOOL_SIZE){ this.selectedSize = newSize },
        selectTool(newTool: ART_TOOL_TYPE | null){ this.selectedTool = newTool },
        setSelectedNavTool(newTool: NAV_TOOL_TYPE | null){ this.selectedNavTool = newTool },
        selectFrame(newFrame: number){ this.selectedFrame = newFrame },
        setToolPanelState(newState: boolean){ this.toolPanelOpen = newState },
        setAnimPanelState(newState: boolean){ this.animPanelOpen = newState },
    },
});
