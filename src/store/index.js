import Vue from 'vue'
import Vuex from 'vuex'
import MainWindow from './modules/MainWindow';
import GameData from './modules/GameData';
import ArtEditor from './modules/ArtEditor';
import AssetBrowser from './modules/AssetBrowser';

Vue.use(Vuex);

export default new Vuex.Store({
    state: {
    },
    mutations: {
    },
    actions: {
    },
    modules: {
        MainWindow,
        GameData,
        ArtEditor,
        AssetBrowser
    }
});
