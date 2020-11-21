import Vue from 'vue'
import Vuex from 'vuex'
import {version as EDITOR_VERSION} from '@/../package.json';
import ID_Generator from '@/common/ID_Generator';
import MainWindow from './modules/MainWindow';
import GameData from './modules/GameData';
import ArtEditor from './modules/ArtEditor';
import AssetBrowser from './modules/AssetBrowser';
import RoomEditor from './modules/RoomEditor';
import Sprite from '@/common/data_classes/Sprite';
import Game_Object from '@/common/data_classes/Game_Object';
import Room from '@/common/data_classes/Room';

Vue.use(Vuex);

export default new Vuex.Store({
    state: {
        projectName: 'untitled'
    },
    getters: {
        getProjectName: state => state.projectName,
        getSaveData: (state) => {
            let gameData = GameData.state;
            let saveObj = {
                projectName: state.projectName,
                editor_version: EDITOR_VERSION,
                newestID: ID_Generator.getCurrentID(),
                startRoom: gameData.startRoomId,
                sprites: gameData.sprites.map(s => s.toSaveData()),
                objects: gameData.objects.map(o => o.toSaveData()),
                rooms: gameData.rooms.map(r => r.toSaveData())
            }
    
            return JSON.stringify(saveObj);
        }
    },
    actions: {
        setProjectName({commit}, newName){
            commit('setProjectName', newName);
        },
        newProject({commit}){
            commit('newProject');
        },
        loadSaveData({commit}, projString){
            commit('loadSaveData', projString);
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
        loadSaveData: (state, projString) => {
            let gameData = GameData.state;
            let loadObj = JSON.parse(projString);
            
            state.projectName = loadObj.projectName;
            gameData.editor_version = loadObj.editor_version;
            ID_Generator.setID(loadObj.newestID);
            gameData.startRoomId = loadObj.startRoomId,
            gameData.sprites = loadObj.sprites.map(s => new Sprite().fromSaveData(s));
            gameData.objects = loadObj.objects.map(o => new Game_Object().fromSaveData(o));
            gameData.rooms = loadObj.rooms.map(r => new Room().fromSaveData(r, gameData.objects, gameData.sprites));
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
