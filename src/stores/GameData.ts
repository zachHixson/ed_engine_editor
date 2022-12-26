import { defineStore } from 'pinia';
import Logic from '@/components/editor_logic/Logic';
import type Node_API from '@/components/editor_logic/Node_API';
import i18n from '@/i18n';
import Core from '@/core';

const t = i18n.global.t;

interface iState {
    startRoomId: number | null,
    sprites: Core.Sprite[],
    objects: Core.Game_Object[],
    logic: Logic[],
    rooms: Core.Room[]
}

export const useGameDataStore = defineStore({
    id: 'GameData',

    state: (): iState => ({
        startRoomId: null,
        sprites: [],
        objects: [],
        logic: [],
        rooms: []
    }),

    getters: {
        getStartRoom: (state): number | null => state.startRoomId,
        getAllSprites: (state): Core.Sprite[] => state.sprites as Core.Sprite[],
        getAllObjects: (state): Core.Game_Object[] => state.objects as Core.Game_Object[],
        getAllLogic: (state): Logic[] => state.logic as Logic[],
        getAllRooms: (state): Core.Room[] => state.rooms as Core.Room[],
        getSpriteSaveData: (state): object => state.sprites.map(s => s.toSaveData()),
        getObjectSaveData: (state): object => state.objects.map(o => o.toSaveData()),
        getRoomSaveData: (state): object => state.rooms.map(r => r.toSaveData()),
        getLogicSaveData: (state): object => state.logic.map(r => r.toSaveData()),
    },

    actions: {
        setStartRoomId(newStartRoomId: number){
            this.startRoomId = newStartRoomId;
        },
        setSpriteList(sprites: Core.Sprite[]){
            this.sprites = sprites;
        },
        setObjectList(objects: Core.Game_Object[]){
            this.objects = objects;
        },
        setLogicList(logic: Logic[]){
            this.logic = logic;
        },
        setRoomList(rooms: Core.Room[]){
            this.rooms = rooms;
        },
        addAsset(category: Core.CATEGORY_ID){
            switch (category){
                case Core.CATEGORY_ID.SPRITE:
                    let spriteName = t(`asset_browser.sprite_prefix`) + getSuffixNum(this.sprites);
                    let newSprite = new Core.Sprite();
                    newSprite.name = spriteName;
                    newSprite.sortOrder = this.sprites.length;
                    this.sprites.push(newSprite);
                    break;
                case Core.CATEGORY_ID.OBJECT:
                    let objName = t(`asset_browser.object_prefix`) + getSuffixNum(this.objects);
                    let newObject = new Core.Game_Object();
                    newObject.name = objName;
                    newObject.sortOrder = this.objects.length;
                    this.objects.push(newObject);
                    break;
                case Core.CATEGORY_ID.LOGIC:
                    let logicName = t(`asset_browser.logic_prefix`) + getSuffixNum(this.logic);
                    let newLogic = new Logic();
                    newLogic.name = logicName;
                    newLogic.sortOrder = this.logic.length;
                    newLogic.addGraph();
                    this.logic.push(newLogic);
                    break;
                case Core.CATEGORY_ID.ROOM:
                    let roomName = t(`asset_browser.room_prefix`) + getSuffixNum(this.rooms);
                    let newRoom = new Core.Room();
                    newRoom.name = roomName;
                    newRoom.sortOrder = this.rooms.length;
                    this.rooms.push(newRoom);
                    break;
            }
        },
        deleteAsset(category: Core.CATEGORY_ID, id: number){
            let curList: Core.Asset_Base[];
            let hasFound = false;
    
            switch(category){
                case Core.CATEGORY_ID.SPRITE:
                    curList = this.sprites;
                    break;
                case Core.CATEGORY_ID.OBJECT:
                    curList = this.objects;
                    break;
                case Core.CATEGORY_ID.LOGIC:
                    curList = this.logic;
                    break;
                case Core.CATEGORY_ID.ROOM:
                    curList = this.rooms;
                    break;
                default:
                    curList = this.sprites;
            }
    
            for (let i = 0; !hasFound && i < curList.length; i++){
                if (curList[i].id == id){
                    curList.splice(i, 1);
                    hasFound = true;
                }
            }
        },
        loadSaveData(loadObj: Core.iSerializedGameData, nodeAPI: Node_API){
            this.startRoomId = loadObj.startRoom;
            this.sprites = loadObj.sprites.map(s => new Core.Sprite().fromSaveData(s));
            this.objects = loadObj.objects.map(o => new Core.Game_Object().fromSaveData(o, this.sprites as Core.Sprite[]));
            this.rooms = loadObj.rooms.map(r => new Core.Room().fromSaveData(r, this.objects as Core.Game_Object[]));
            this.logic = loadObj.logic.map(l => new Logic().fromSaveData(l, nodeAPI));
        },
        purgeMissingReferences(){
            this.objects.forEach(o => o.purgeMissingReferences(this.sprites as Core.Sprite[]));
            this.rooms.forEach(r => r.purgeMissingReferences(this.objects as Core.Game_Object[], this.rooms as Core.Room[]));
        }
    }
});

function getSuffixNum(list: {name: string, [key: string]: any}[]){
    const PADDING = 2;
    let requiredDigits;
    let nameList = list.map(l => l.name);
    let largest = Core.Util.getHighestEndingNumber(nameList);
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