import { defineStore } from 'pinia';

interface iState {
    selectedAsset: Shared.AssetBase | null,
    selectedRoom: Shared.Room | null,
}

export const useAssetBrowserStore = defineStore({
    id: 'AssetBrowser',

    state: () => ({
        selectedAsset: null,
        selectedRoom: null,
    }),

    getters: {
        getSelectedAsset: state => state.selectedAsset,
        getSelectedRoom: state => state.selectedRoom,
    },

    actions: {
        selectAsset(newAsset: Shared.AssetBase){ this.selectedAsset = newAsset },
        deselectAsset(){ this.selectedAsset = null },
        selectRoom(newRoom: Shared.Room){ this.selectedRoom = newRoom },
        deselectRoom(){ this.selectedRoom = null },
        deselectAllAssets(){ this.deselectAsset(); this.deselectRoom(); }
    }
})