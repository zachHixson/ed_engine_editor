import { defineStore } from 'pinia';
import type Core from '@/core';

interface iState {
    selectedAsset: Core.Asset_Base | null,
    selectedRoom: Core.Room | null,
}

export const useAssetBrowserStore = defineStore({
    id: 'AssetBrowser',

    state: (): iState => ({
        selectedAsset: null,
        selectedRoom: null,
    }),

    getters: {
        getSelectedAsset: (state): Core.Asset_Base | null => state.selectedAsset,
        getSelectedRoom: (state): Core.Room | null => state.selectedRoom as Core.Room | null,
    },

    actions: {
        selectAsset(newAsset: Core.Asset_Base){ this.selectedAsset = newAsset },
        deselectAssets(){ this.selectedAsset = null },
        selectRoom(newRoom: Core.Room){ this.selectedRoom = newRoom },
        deselectRoom(){ this.selectedRoom = null },
        deselectAllAssets(){ this.deselectAssets(); this.deselectRoom(); }
    }
})