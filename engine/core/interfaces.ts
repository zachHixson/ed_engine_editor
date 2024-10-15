import { tGameObjectSaveData, tRoomSaveData, tSpriteSaveData, tLogicSaveData } from "./core";

export type iAnyObj = {[key: string | number | symbol]: any};

export type tSerializedGameData = {
    projectName: string,
    editor_version: string,
    newestID: number,
    selectedRoomId: number | null,
    startRoom: number | null,
    sprites: tSpriteSaveData[],
    objects: tGameObjectSaveData[],
    rooms: tRoomSaveData[],
    logic: tLogicSaveData[],
}