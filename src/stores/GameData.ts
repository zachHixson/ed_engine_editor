import { defineStore } from 'pinia';
import Logic from '@/components/editor_logic/Logic.ts';
import Node_API from '@/components/editor_logic/Node_API.ts';
import {useI18n} from 'vue-i18n';
import type iLoadObj from './iLoadObj';

const {t} = useI18n();

interface iState {
    startRoomId: number | null,
    sprites: Shared.Sprite[],
    objects: Shared.Game_Object[],
    logic: Logic[],
    rooms: Shared.Room[]
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
        getStartRoom: state => state.startRoomId,
        getAllSprites: state => state.sprites,
        getAllObjects: state => state.objects,
        getAllLogic: state => state.logic,
        getAllRooms: state => state.rooms,
        getSpriteSaveData: state => state.sprites.map(s => s.toSaveData()),
        getObjectSaveData: state => state.objects.map(o => o.toSaveData()),
        getRoomSaveData: state => state.rooms.map(r => r.toSaveData()),
        getLogicSaveData: state => state.logic.map(r => r.toSaveData()),
    },

    actions: {
        setStartRoomId(newStartRoomId: number){
            this.startRoomId = newStartRoomId;
        },
        setSpriteList(sprites: Shared.Sprite[]){
            this.sprites = sprites;
        },
        setObjectList(objects: Shared.Game_Object[]){
            this.sprites = objects;
        },
        setLogicList(logic: Logic[]){
            this.sprites = logic;
        },
        setRoomList(rooms: Shared.Room[]){
            this.sprites = rooms;
        },
        addAsset(category: Shared.CATEGORY_ID){
            switch (category){
                case Shared.CATEGORY_ID.SPRITE:
                    let spriteName = t(`asset_browser.sprite_prefix`) + getSuffixNum(this.sprites);
                    let newSprite = new Shared.Sprite();
                    newSprite.name = spriteName;
                    newSprite.sortOrder = this.sprites.length;
                    this.sprites.push(newSprite);
                    break;
                case Shared.CATEGORY_ID.OBJECT:
                    let objName = t(`asset_browser.object_prefix`) + getSuffixNum(this.objects);
                    let newObject = new Shared.Game_Object();
                    newObject.name = objName;
                    newObject.sortOrder = this.objects.length;
                    this.objects.push(newObject);
                    break;
                case Shared.CATEGORY_ID.LOGIC:
                    let logicName = t(`asset_browser.logic_prefix`) + getSuffixNum(this.logic);
                    let newLogic = new Logic();
                    newLogic.name = logicName;
                    newLogic.sortOrder = this.logic.length;
                    newLogic.addGraph();
                    this.logic.push(newLogic);
                    break;
                case Shared.CATEGORY_ID.ROOM:
                    let roomName = t(`asset_browser.room_prefix`) + getSuffixNum(this.rooms);
                    let newRoom = new Shared.Room();
                    newRoom.name = roomName;
                    newRoom.sortOrder = this.rooms.length;
                    this.rooms.push(newRoom);
                    break;
            }
        },
        deleteAsset(category: Shared.CATEGORY_ID, id: number){
            let curList: Shared.AssetBase[];
            let hasFound = false;
    
            switch(category){
                case Shared.CATEGORY_ID.SPRITE:
                    curList = this.sprites;
                    break;
                case Shared.CATEGORY_ID.OBJECT:
                    curList = this.objects;
                    break;
                case Shared.CATEGORY_ID.LOGIC:
                    curList = this.logic;
                    break;
                case Shared.CATEGORY_ID.ROOM:
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
        loadSaveData(loadObj: iLoadObj, nodeAPI: Node_API){
            this.startRoomId = loadObj.startRoom;
            this.sprites = loadObj.sprites.map(s => new Shared.Sprite().fromSaveData(s));
            this.objects = loadObj.objects.map(o => new Shared.Game_Object().fromSaveData(o, this.sprites));
            this.rooms = loadObj.rooms.map(r => new Shared.Room().fromSaveData(r, this.objects));
            this.logic = loadObj.logic.map(l => new Logic().fromSaveData(l, nodeAPI));
        },
        purgeMissingReferences(){
            this.objects.forEach(o => o.purgeMissingReferences(this.sprites));
            this.rooms.forEach(r => r.purgeMissingReferences(this.objects, this.rooms));
        }
    }
});

function getSuffixNum(list: {name: string, [key: string]: any}[]){
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