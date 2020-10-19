import {version as EDITOR_VERSION} from '@/../package.json';
import i18n from '@/i18n';
import {CATEGORY_ID} from '@/common/Enums';
import Sprite from '@/common/data_classes/Sprite';
import Game_Object from '@/common/data_classes/Game_Object';
import Room from '@/common/data_classes/Room';

const state = {
    projectName: 'untitled',
    sprites: [],
    objects: [],
    rooms: []
};

const getters = {
    getRandomSprite: () => {
        let tempData = [];

        for (let i = 0; i < 16 * 16; i++) {
            let hexAlph = "0123456789ABCDEF";
            let curHex = '#';
            for (let i = 0; i < 6; i++) {
                curHex += (hexAlph.charAt(Math.floor(Math.random() * hexAlph.length)));
            }

            if (Math.random() > 0.5){
                tempData.push(curHex);
            }
            else{
                tempData.push('');
            }
        }

        tempData[0] = "#FF0000";
        tempData[1] = "#00FF00";
        tempData[2] = "#0000FF";

        return tempData;
    },
    getEmptySprite: () => new Array(16 * 16).fill(''),
    getAllSprites: state => state.sprites,
    getAllObjects: state => state.objects,
    getAllRooms: state => state.rooms,
    getSaveData: (state) => {
        let saveObj = {
            projectName: state.projectName,
            editor_version: EDITOR_VERSION,
            sprites: state.sprites.map(s => s.toSaveData()),
            objects: state.objects.map(o => o.toSaveData()),
            rooms: state.rooms.map(r => r.toSaveData())
        }

        return JSON.stringify(saveObj);
    }
};

const actions = {
    addAsset({commit}, category){
        commit('addAsset', category);
    },
    deleteAsset({commit}, {category, id}){
        commit('deleteAsset', {category, id});
    },
    loadSaveData({commit}, projString){
        commit('loadSaveData', projString);
    }
};

const mutations = {
    addAsset: (state, category) => {
        switch (category){
            case CATEGORY_ID.SPRITE:
                let spriteName = i18n.tc(`asset_browser.sprite_prefix`) + getSuffixNum(state.sprites);
                let newSprite = new Sprite();
                newSprite.name = spriteName;
                state.sprites.push(newSprite);
                break;
            case CATEGORY_ID.OBJECT:
                let objName = i18n.tc(`asset_browser.object_prefix`) + getSuffixNum(state.objects);
                let newObject = new Game_Object();
                newObject.name = objName;
                state.objects.push(newObject);
                break;
            case CATEGORY_ID.ROOM:
                let roomName = i18n.tc(`asset_browser.room_prefix`) + getSuffixNum(state.rooms);
                let newRoom = new Room();
                newRoom.name = roomName;
                state.rooms.push(newRoom);
                break;
        }
    },
    deleteAsset: (state, {category, id}) => {
        let curList;
        let hasFound = false;

        switch(category){
            case CATEGORY_ID.SPRITE:
                curList = state.sprites;
                break;
            case CATEGORY_ID.OBJECT:
                curList = state.objects;
                break;
            case CATEGORY_ID.ROOM:
                curList = state.rooms;
                break;
        }

        for (let i = 0; !hasFound && i < curList.length; i++){
            if (curList[i].ID == id){
                curList.splice(i, 1);
                hasFound = true;
            }
        }
    },
    loadSaveData: (state, projString) => {
        let loadObj = JSON.parse(projString);
        
        state.projectName = loadObj.projectName;
        state.editor_version = loadObj.editor_version;
        state.sprites = loadObj.sprites.map(s => new Sprite().fromSaveData(s));
        state.objects = loadObj.objects.map(o => new Game_Object().fromSaveData(o));
        state.rooms = loadObj.rooms.map(r => new Room().fromSaveData(r));
    }
};

function getSuffixNum(list){
    const PADDING = 2;
    let requiredDigits;
    let largest = -1;
    let output = "";

    //search num
    for (let i = 0; i < list.length; i++){
        let suffixNumSearch = /(\d+)$/.exec(list[i].name);
        
        if (suffixNumSearch != null){
            let suffixNum = parseInt(suffixNumSearch[1]);

            if (suffixNum > largest){
                largest = suffixNum;
            }
        }
    }

    largest++;

    //pad number
    if (largest > 0){
        requiredDigits = Math.floor(Math.log(largest)/Math.log(10)) + 1;
    }
    else{
        requiredDigits = 1;
    }
    
    if (requiredDigits < PADDING){
        output = new Array(PADDING - requiredDigits).fill('0').join('');
    }

    return (output + largest);
}

export default {
    namespaced: true,
    state,
    getters,
    actions,
    mutations
}