import { defineStore } from 'pinia';
import { useI18nStore } from './I18n';
import Logic from '@/components/editor_logic/node_components/Logic';
import Core from '@/core';

interface iState {
    startRoomId: number | null,
    sprites: Core.Sprite[],
    objects: Core.Game_Object[],
    logic: Logic[],
    rooms: Core.Room[]
}

export const useGameDataStore = defineStore('GameData', {
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
        getSpriteSaveData: (state) => (): Core.SpriteSave[] => state.sprites.map(s => s.toSaveData()),
        getObjectSaveData: (state) => (): Core.GameObjectSave[] => state.objects.map(o => o.toSaveData()),
        getRoomSaveData: (state) => (): Core.RoomSave[] => state.rooms.map(r => r.toSaveData()),
        getLogicSaveData: (state) => (): Core.LogicSave[] => state.logic.map(r => r.toSaveData()),
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
            const { t } = useI18nStore();

            switch (category){
                case Core.CATEGORY_ID.SPRITE:
                    const spriteName = t(`asset_browser.sprite_prefix`) + getSuffixNum(this.sprites);
                    const newSprite = new Core.Sprite();
                    newSprite.name = spriteName;
                    newSprite.sortOrder = this.sprites.length;
                    this.sprites.push(newSprite);
                    break;
                case Core.CATEGORY_ID.OBJECT:
                    const objName = t(`asset_browser.object_prefix`) + getSuffixNum(this.objects);
                    const newObject = new Core.Game_Object();
                    newObject.name = objName;
                    newObject.sortOrder = this.objects.length;
                    this.objects.push(newObject);
                    break;
                case Core.CATEGORY_ID.LOGIC:
                    const logicName = t(`asset_browser.logic_prefix`) + getSuffixNum(this.logic);
                    const newLogic = new Logic();
                    newLogic.name = logicName;
                    newLogic.sortOrder = this.logic.length;
                    newLogic.addGraph();
                    this.logic.push(newLogic);
                    break;
                case Core.CATEGORY_ID.ROOM:
                    const roomName = t(`asset_browser.room_prefix`) + getSuffixNum(this.rooms);
                    const newRoom = new Core.Room();
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
        loadSaveData(loadObj: Core.tSerializedGameData, nodeAPI: Core.iEditorAPI){
            const spriteMap = new Map<number, Core.Sprite>();
            const objectMap = new Map<number, Core.Game_Object>();
            const assetMap: Core.AssetMap = {
                sprite: spriteMap,
                object: objectMap,
            };
            const self = this as unknown as iState;

            self.startRoomId = loadObj.startRoom;

            self.sprites = loadObj.sprites.map(s => Core.Sprite.fromSaveData(s));
            self.sprites.forEach(sprite => spriteMap.set(sprite.id, sprite));

            self.objects = loadObj.objects.map(o => Core.Game_Object.fromSaveData(o, spriteMap));
            self.objects.forEach(object => objectMap.set(object.id, object));

            self.rooms = loadObj.rooms.map(r => Core.Room.fromSaveData(r, assetMap));
            self.logic = loadObj.logic.map(l => Logic.fromSaveData(l, nodeAPI));
        },
        purgeMissingReferences(){
            const spriteMap = new Map<number, Core.Sprite>();
            const objectMap = new Map<number, Core.Game_Object>();
            const logicMap = new Map<number, Core.iEditorLogic>();
            const roomMap = new Map<number, Core.Room>();
            const assetMap: Core.AssetMap = {
                sprite: spriteMap,
                object: objectMap,
                editorLogic: logicMap,
                room: roomMap,
            };
            const self = this as unknown as iState;

            self.sprites.forEach(s => spriteMap.set(s.id, s));
            self.objects.forEach(o => objectMap.set(o.id, o));
            self.logic.forEach(l => logicMap.set(l.id, l));
            self.rooms.forEach(r => roomMap.set(r.id, r));

            self.objects.forEach(o => o.purgeMissingReferences(self.sprites));
            self.rooms.forEach(r => r.purgeMissingReferences(assetMap));
        }
    }
});

function getSuffixNum(list: Core.Asset_Base[]){
    const PADDING = 2;
    const nameList = list.map(l => l.name);
    let requiredDigits;
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
