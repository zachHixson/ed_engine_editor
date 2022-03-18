import i18n from '@/i18n';

const state = {
    startRoomId: null,
    sprites: [],
    objects: [],
    logic: [],
    rooms: []
};

const getters = {
    getStartRoom: state => state.startRoomId,
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
    getAllLogic: state => state.logic,
    getAllRooms: state => state.rooms,
    getSpriteSaveData: state => state.sprites.map(s => s.toSaveData()),
    getObjectSaveData: state => state.objects.map(o => o.toSaveData()),
    getRoomSaveData: state => state.rooms.map(r => r.toSaveData()),
    getLogicSaveData: state => state.logic.map(r => r.toSaveData()),
};

const actions = {
    setStartRoomId({commit}, newStartRoomId){
        commit('setStartRoomId', newStartRoomId);
    },
    addAsset({commit}, category){
        commit('addAsset', category);
    },
    deleteAsset({commit}, {category, id}){
        commit('deleteAsset', {category, id});
    },
    loadSaveData({commit}, loadObj){
        commit('loadSaveData', loadObj);
    },
    purgeMissingReferences({commit}){
        commit('purgeMissingReferences');
    }
};

const mutations = {
    setStartRoomId: (state, newStartRoomId) => {
        state.startRoomId = newStartRoomId;
    },
    addAsset: (state, category) => {
        switch (category){
            case Shared.CATEGORY_ID.SPRITE:
                let spriteName = i18n.tc(`asset_browser.sprite_prefix`) + getSuffixNum(state.sprites);
                let newSprite = new Shared.Sprite();
                newSprite.name = spriteName;
                state.sprites.push(newSprite);
                break;
            case Shared.CATEGORY_ID.OBJECT:
                let objName = i18n.tc(`asset_browser.object_prefix`) + getSuffixNum(state.objects);
                let newObject = new Shared.Game_Object();
                newObject.name = objName;
                state.objects.push(newObject);
                break;
            case Shared.CATEGORY_ID.LOGIC:
                let logicName = i18n.tc(`asset_browser.logic_prefix`) + getSuffixNum(state.logic);
                let newLogic = new Shared.Logic();
                newLogic.name = logicName;
                state.logic.push(newLogic);
                break;
            case Shared.CATEGORY_ID.ROOM:
                let roomName = i18n.tc(`asset_browser.room_prefix`) + getSuffixNum(state.rooms);
                let newRoom = new Shared.Room();
                newRoom.name = roomName;
                state.rooms.push(newRoom);
                break;
        }
    },
    deleteAsset: (state, {category, id}) => {
        let curList;
        let hasFound = false;

        switch(category){
            case Shared.CATEGORY_ID.SPRITE:
                curList = state.sprites;
                break;
            case Shared.CATEGORY_ID.OBJECT:
                curList = state.objects;
                break;
            case Shared.CATEGORY_ID.LOGIC:
                curList = state.logic;
                break;
            case Shared.CATEGORY_ID.ROOM:
                curList = state.rooms;
                break;
        }

        for (let i = 0; !hasFound && i < curList.length; i++){
            if (curList[i].id == id){
                curList.splice(i, 1);
                hasFound = true;
            }
        }
    },
    loadSaveData(state, loadObj){
        state.startRoomId = loadObj.startRoom;
        state.sprites = loadObj.sprites.map(s => new Shared.Sprite().fromSaveData(s));
        state.objects = loadObj.objects.map(o => new Shared.Game_Object().fromSaveData(o, state.sprites));
        state.rooms = loadObj.rooms.map(r => new Shared.Room().fromSaveData(r, state.objects));
        state.logic = loadObj.logic.map(l => new Shared.Logic().fromSaveData(l));
    },
    purgeMissingReferences(){
        state.objects.forEach(o => o.purgeMissingReferences(state.sprites));
        state.rooms.forEach(r => r.purgeMissingReferences(state.objects, state.rooms));
    }
};

function getSuffixNum(list){
    const PADDING = 2;
    let requiredDigits;
    let nameList = list.map(l => l.name);
    let largest = Shared.getHighestEndingNumber(nameList);
    let output = "";

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