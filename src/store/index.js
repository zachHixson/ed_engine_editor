import Vue from 'vue'
import Vuex from 'vuex'
import {version as EDITOR_VERSION} from '@/../package.json';
import MainWindow from './modules/MainWindow';
import GameData from './modules/GameData';
import ArtEditor from './modules/ArtEditor';
import AssetBrowser from './modules/AssetBrowser';
import RoomEditor from './modules/RoomEditor';
import LogicEditor from './modules/LogicEditor';
import i18n from '@/i18n';

Vue.use(Vuex);

const PLAY_STATES = {
    PLAYING: Symbol('playing'),
    DEBUGGING: Symbol('debugging'),
    NOT_PLAYING: Symbol('not_playing'),
}
Object.freeze(PLAY_STATES);

export default new Vuex.Store({
    state: {
        projectName: i18n.t('editor_main.default_name'),
        inputActive: false,
        playState: PLAY_STATES.NOT_PLAYING,
    },
    getters: {
        getProjectName: state => state.projectName,
        getProjectData: (state, getters) => {
            return {
                projectName: state.projectName,
                editor_version: EDITOR_VERSION,
                newestID: Shared.ID_Generator.getCurrentID(),
                selectedRoomId: AssetBrowser.state.selectedRoom.id,
                startRoom: getters['GameData/getStartRoom'],
                sprites: getters['GameData/getAllSprites'],
                objects: getters['GameData/getAllObjects'],
                rooms: getters['GameData/getAllRooms'],
                logic: getters['GameData/getAllLogic'],
            };
        },
        getSaveData: (state, getters) => {
            let saveObj = {
                projectName: state.projectName,
                editor_version: EDITOR_VERSION,
                newestID: Shared.ID_Generator.getCurrentID(),
                selectedRoomId: AssetBrowser.state.selectedRoom.id,
                startRoom: getters['GameData/getStartRoom'],
                sprites: getters['GameData/getSpriteSaveData'],
                objects: getters['GameData/getObjectSaveData'],
                rooms: getters['GameData/getRoomSaveData'],
                logic: getters['GameData/getLogicSaveData'],
            }
    
            return JSON.stringify(saveObj);
        },
        getInputActive: state => state.inputActive,
        getPlayStates: ()=>{return PLAY_STATES},
        getPlayState: state => state.playState,
    },
    actions: {
        setProjectName({commit}, newName){
            commit('setProjectName', newName);
        },
        newProject({commit, dispatch, getters}){
            let newRoom = null;

            commit('newProject');
            dispatch('GameData/addAsset', Shared.CATEGORY_ID.ROOM);
            newRoom = getters['GameData/getAllRooms'][0];
            dispatch('AssetBrowser/selectRoom', newRoom);
        },
        loadSaveData({commit, dispatch, getters}, projString){
            let loadObj = JSON.parse(projString);

            commit('loadSaveData', loadObj);
            dispatch('GameData/loadSaveData', loadObj);

            if (loadObj.selectedRoomId != undefined){
                let room = getters['GameData/getAllRooms'].find(r => r.id == loadObj.selectedRoomId);
                dispatch('AssetBrowser/selectRoom', room);
            }
        },
        setInputActive({commit}, newState){
            commit('setInputActive', newState);
        },
        setPlayState({commit}, newState){
            commit('setPlayState', newState);
        },
    },
    mutations: {
        setProjectName: (state, newName) => {
            state.projectName = newName;
        },
        newProject: (state) => {
            let gameData = GameData.state;
            state.projectName = i18n.t('editor_main.default_name');
            gameData.sprites = [];
            gameData.objects = [];
            gameData.rooms = [];
            Shared.ID_Generator.reset();
        },
        loadSaveData: (state, loadObj) => {
            let gameData = GameData.state;
            
            state.projectName = loadObj.projectName;
            gameData.editor_version = loadObj.editor_version;
            Shared.ID_Generator.setID(loadObj.newestID);
        },
        setInputActive: (state, newState) => {
            state.inputActive = newState;
        },
        setPlayState: (state, newState) => {
            state.playState = newState;
        },
    },
    modules: {
        MainWindow,
        GameData,
        ArtEditor,
        AssetBrowser,
        RoomEditor,
        LogicEditor,
    }
});
