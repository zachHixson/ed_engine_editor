import Vue from 'vue'
import Vuex from 'vuex'
import {version as EDITOR_VERSION} from '@/../package.json';
import ID_Generator from '@/common/ID_Generator';
import {CATEGORY_ID} from '@/common/Enums';
import MainWindow from './modules/MainWindow';
import GameData from './modules/GameData';
import ArtEditor from './modules/ArtEditor';
import AssetBrowser from './modules/AssetBrowser';
import RoomEditor from './modules/RoomEditor';

Vue.use(Vuex);

export default new Vuex.Store({
    state: {
        projectName: 'untitled'
    },
    getters: {
        getProjectName: state => state.projectName,
        getSaveData: (state, getters) => {
            let gameData = GameData.state;
            let saveObj = {
                projectName: state.projectName,
                editor_version: EDITOR_VERSION,
                newestID: ID_Generator.getCurrentID(),
                selectedRoomId: AssetBrowser.state.selectedRoom.ID,
                startRoom: getters['GameData/getStartRoom'],
                sprites: getters['GameData/getSpriteSaveData'],
                objects: getters['GameData/getObjectSaveData'],
                rooms: getters['GameData/getRoomSaveData']
            }
    
            return JSON.stringify(saveObj);
        }
    },
    actions: {
        setProjectName({commit}, newName){
            commit('setProjectName', newName);
        },
        newProject({commit, dispatch, getters}){
            let newRoom = null;

            commit('newProject');
            dispatch('GameData/addAsset', CATEGORY_ID.ROOM);
            newRoom = getters['GameData/getAllRooms'][0];
            dispatch('AssetBrowser/selectRoom', newRoom);
        },
        loadSaveData({commit, dispatch, getters}, projString){
            let loadObj = JSON.parse(projString);

            commit('loadSaveData', loadObj);
            dispatch('GameData/loadSaveData', loadObj);

            if (loadObj.selectedRoomId != undefined){
                let room = getters['GameData/getAllRooms'].filter(r => r.ID == loadObj.selectedRoomId)[0];
                dispatch('AssetBrowser/selectRoom', room);
            }
        }
    },
    mutations: {
        setProjectName: (state, newName) => {
            state.projectName = newName;
        },
        newProject: (state) => {
            let gameData = GameData.state;
            state.projectName = 'untitled';
            gameData.sprites = [];
            gameData.objects = [];
            gameData.rooms = [];
            ID_Generator.reset();
        },
        loadSaveData: (state, loadObj) => {
            let gameData = GameData.state;
            
            state.projectName = loadObj.projectName;
            gameData.editor_version = loadObj.editor_version;
            ID_Generator.setID(loadObj.newestID);
        }
    },
    modules: {
        MainWindow,
        GameData,
        ArtEditor,
        AssetBrowser,
        RoomEditor
    }
});
