import { sGameObjectSaveData, sRoomSaveData, sSpriteSaveData, sLogicSaveData, GetKeyTypesFrom } from "./core";

export type iAnyObj = {[key: string | number | symbol]: any};

export type tSerializedGameData = {
    projectName: string,
    editor_version: string,
    newestID: number,
    selectedRoomId: number | null,
    startRoom: number | null,
    sprites: GetKeyTypesFrom<typeof sSpriteSaveData>[],
    objects: GetKeyTypesFrom<typeof sGameObjectSaveData>[],
    rooms: GetKeyTypesFrom<typeof sRoomSaveData>[],
    logic: GetKeyTypesFrom<typeof sLogicSaveData>[],
}