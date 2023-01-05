import { iGameObjectSaveData, iRoomSaveData, iSpriteSaveData, iLogicSaveData } from "./core";
import { Vector } from "./Vector";

export type iAnyObj = {[key: string | number | symbol]: any};

export interface iSerializedGameData {
    projectName: string,
    editor_version: string,
    newestID: number,
    selectedRoomId: number | null,
    startRoom: number | null,
    sprites: iSpriteSaveData[],
    objects: iGameObjectSaveData[],
    rooms: iRoomSaveData[],
    logic: iLogicSaveData[],
}