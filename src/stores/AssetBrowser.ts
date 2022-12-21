import { defineStore } from 'pinia';
import type Shared from '@/Shared';

interface iState {
    selectedAsset: typeof Shared.Asset_Base | null,
    selectedRoom: typeof Shared.Room | null,
}

export const useAssetBrowserStore = defineStore({
    id: 'AssetBrowser',

    state: () => ({
        selectedAsset: null,
        selectedRoom: null,
    }),

    getters: {
        getSelectedAsset: (state): typeof Shared.Asset_Base => state.selectedAsset,
        getSelectedRoom: (state): typeof Shared.Room => state.selectedRoom,
    },

    actions: {
        selectAsset(newAsset: typeof Shared.Asset_Base){ this.selectedAsset = newAsset },
        deselectAssets(){ this.selectedAsset = null },
        selectRoom(newRoom: typeof Shared.Room){ this.selectedRoom = newRoom },
        deselectRoom(){ this.selectedRoom = null },
        deselectAllAssets(){ this.deselectAssets(); this.deselectRoom(); }
    }
})