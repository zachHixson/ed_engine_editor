import { defineStore } from 'pinia';
import {version as EDITOR_VERSION} from '@/../package.json';
import i18n from '@/i18n';
import Node_API from '@/components/editor_logic/Node_API.ts';
import type iLoadObj from './iLoadObj';
import { useGameDataStore } from './GameData';
import { useAssetBrowserStore } from './AssetBrowser';
import Shared from '@/Shared';

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
    nodeAPI: any,
    selectedEditor: typeof Shared.EDITOR_ID,
}

export const useMainStore = defineStore({
    id: 'main',

    state: (): iState => ({
        projectName: t('editor_main.default_name'),
        inputActive: false,
        playState: PLAY_STATE.NOT_PLAYING,
        nodeAPI: new Node_API(),
        selectedEditor: Shared.EDITOR_ID.ROOM,
    }),

    getters: {
        getProjectName: (state): string => state.projectName,
        getSaveData: (state): any => {
            const gameDataStore = useGameDataStore();
            const saveObj = {
                projectName: state.projectName,
                editor_version: EDITOR_VERSION,
                newestID: Shared.ID_Generator.getCurrentID(),
                startRoom: gameDataStore.getStartRoom,
                sprites: gameDataStore.getSpriteSaveData,
                objects: gameDataStore.getObjectSaveData,
                rooms: gameDataStore.getRoomSaveData,
                logic: gameDataStore.getLogicSaveData,
            }

            return JSON.stringify(saveObj);
        },
        getSelectedEditor: (state): object => state.selectedEditor,
        getInputActive: (state): boolean => state.inputActive,
        getPlayState: (state): PLAY_STATE => state.playState,
        getNodeAPI: (state): object => state.nodeAPI,
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
            Shared.ID_Generator.reset();
            gameDataStore.addAsset(Shared.CATEGORY_ID.ROOM);
            assetBrowserStore.selectRoom(gameDataStore.getAllRooms[0]);
        },
        loadSaveData(projString: string){
            const assetBrowserStore = useAssetBrowserStore();
            const gameDataStore = useGameDataStore();
            const loadObj: iLoadObj = JSON.parse(projString) || {};

            this.projectName = loadObj.projectName;
            Shared.ID_Generator.setID(loadObj.newestID);
            gameDataStore.loadSaveData(loadObj, this.nodeAPI);
            
            if (loadObj.selectedRoomId != undefined){
                const room = gameDataStore.getAllRooms.find(r => r.id == loadObj.selectedRoomId)
                assetBrowserStore.selectRoom(room)
            }

            this.nodeAPI.forEachNode(node => node.afterGameDataLoaded());
        },
        setSelectedEditor(newEditor: typeof Shared.EDITOR_ID){ this.selectedEditor = newEditor },
        setInputActive(newState: boolean){
            this.inputActive = newState;
        },
        setPlayState(newState: PLAY_STATE): void {
            this.playState = newState;
        }
    },
})
