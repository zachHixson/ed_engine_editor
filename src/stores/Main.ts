import { defineStore } from 'pinia';
import {version as EDITOR_VERSION} from '@/../package.json';
import i18n from '@/i18n';
import Node_API from '@/components/editor_logic/Node_API';
import { useGameDataStore } from './GameData';
import { useAssetBrowserStore } from './AssetBrowser';
import Core from '@/core';

const t = i18n.global.t;

export enum PLAY_STATE {
    PLAYING,
    DEBUGGING,
    NOT_PLAYING,
};

interface iState {
    projectName: string,
    inputActive: boolean,
    playState: PLAY_STATE,
    nodeAPI: Node_API,
    selectedEditor: Core.EDITOR_ID,
}

export const useMainStore = defineStore({
    id: 'main',

    state: (): iState => ({
        projectName: t('editor_main.default_name'),
        inputActive: false,
        playState: PLAY_STATE.NOT_PLAYING,
        nodeAPI: new Node_API(),
        selectedEditor: Core.EDITOR_ID.ROOM,
    }),

    getters: {
        getProjectName: (state): string => state.projectName,
        getSaveData: (state) => (): string => {
            const assetBrowserStore = useAssetBrowserStore();
            const gameDataStore = useGameDataStore();
            const saveObj = {
                projectName: state.projectName,
                editor_version: EDITOR_VERSION,
                newestID: Core.ID_Generator.getCurrentID(),
                selectedRoomId: assetBrowserStore.selectedRoom?.id ?? null,
                startRoom: gameDataStore.getStartRoom,
                sprites: gameDataStore.getSpriteSaveData(),
                objects: gameDataStore.getObjectSaveData(),
                rooms: gameDataStore.getRoomSaveData(),
                logic: gameDataStore.getLogicSaveData(),
            } satisfies Core.tSerializedGameData;

            return JSON.stringify(saveObj);
        },
        getSelectedEditor: (state): Core.EDITOR_ID => state.selectedEditor,
        getInputActive: (state): boolean => state.inputActive,
        getPlayState: (state): PLAY_STATE => state.playState,
        getNodeAPI: (state): Node_API => state.nodeAPI as Node_API,
    },

    actions: {
        setProjectName(newName: string) {
            this.projectName = newName;
        },
        newProject(){
            const assetBrowserStore = useAssetBrowserStore();
            const gameDataStore = useGameDataStore();

            this.projectName = t('editor_main.default_name');
            gameDataStore.setSpriteList([]);
            gameDataStore.setObjectList([]);
            gameDataStore.setRoomList([]);
            gameDataStore.setLogicList([]);
            Core.ID_Generator.reset();
            gameDataStore.addAsset(Core.CATEGORY_ID.ROOM);
            assetBrowserStore.deselectAllAssets();
            assetBrowserStore.selectRoom(gameDataStore.getAllRooms[0]);
        },
        loadSaveData(projString: string){
            const assetBrowserStore = useAssetBrowserStore();
            const gameDataStore = useGameDataStore();
            let loadObj: Core.tSerializedGameData;
            
            try {
                loadObj = JSON.parse(projString);
            }
            catch (e) {
                throw new Error('Error parsing JSON data');
            }

            this.projectName = loadObj.projectName;
            Core.ID_Generator.setID(loadObj.newestID);
            gameDataStore.loadSaveData(loadObj, this.nodeAPI as Node_API);
            
            if (loadObj.selectedRoomId != undefined){
                const room = gameDataStore.getAllRooms.find(r => r.id == loadObj.selectedRoomId)
                assetBrowserStore.selectRoom(room!)
            }

            this.nodeAPI.forEachNode(node => node.afterGameDataLoaded && node.afterGameDataLoaded());
        },
        setSelectedEditor(newEditor: Core.EDITOR_ID){ this.selectedEditor = newEditor },
        setInputActive(newState: boolean){
            this.inputActive = newState;
        },
        setPlayState(newState: PLAY_STATE): void {
            this.playState = newState;
        }
    },
})
