import { defineStore } from 'pinia';
import {version as EDITOR_VERSION} from '@/../package.json';
import {useI18n} from 'vue-i18n';
import Node_API from '@/components/editor_logic/Node_API.ts';
import type iLoadObj from './iLoadObj';
import { useGameDataStore } from './GameData';
import { useAssetBrowserStore } from './AssetBrowser';

const {t} = useI18n();
const gameDataStore = useGameDataStore();
const assetBrowserStore = useAssetBrowserStore();

enum PLAY_STATE {
    PLAYING,
    DEBUGGING,
    NOT_PLAYING,
};

interface iState {
    projectName: string,
    inputActive: boolean,
    playState: PLAY_STATE,
    nodeAPI: any,
    selectedEditor: Shared.EDITOR_ID,
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
        getProjectName: state => state.projectName,
        getSaveData: state => {
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
        getSelectedEditor: state => state.selectedEditor,
        getInputActive: state => state.inputActive,
        getPlayStates: ()=>{return PLAY_STATE},
        getPlayState: state => state.playState,
        getNodeAPI: state => state.nodeAPI,
    },

    actions: {
        setProjectName(newName: string) {
            this.projectName = newName;
        },
        newProject(){
            this.projectName = t('editor_main.default_name');
            gameDataStore.setSpriteList([]);
            gameDataStore.setObjectList([]);
            gameDataStore.setRoomList([]);
            Shared.ID_Generator.reset();
            gameDataStore.addAsset(Shared.CATEGORY_ID.ROOM);
            assetBrowserStore.selectRoom(gameDataStore.getAllRooms[0]);
        },
        loadSaveData(projString: string){
            const loadObj: iLoadObj = JSON.parse(projString) || {};
            const gameData = {} //gameData.state

            this.projectName = loadObj.projectName;
            Shared.ID_Generator.setID(loadObj.newestID);
            gameDataStore.loadSaveData(loadObj, this.nodeAPI);
            
            if (loadObj.selectedRoomId != undefined){
                const room = gameDataStore.getAllRooms.find(r => r.id == loadObj.selectedRoomId)
                //assetBrowser.selectRoom(room)
            }

            this.nodeAPI.forEachNode(node => node.afterGameDataLoaded());
        },
        setSelectedEditor(newEditor: Shared.EDITOR_ID){ this.selectedEditor = newEditor },
        setInputActive(newState: boolean){
            this.inputActive = newState;
        }
    },
})
