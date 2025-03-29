import { SpriteSave, GameObjectSave, RoomSave, LogicSave } from '@compiled/SaveTypes';

export type iAnyObj = {[key: string | number | symbol]: any};

export type tSerializedGameData = {
    projectName: string,
    editor_version: string,
    newestID: number,
    selectedRoomId: number | null,
    startRoom: number | null,
    sprites: SpriteSave[],
    objects: GameObjectSave[],
    rooms: RoomSave[],
    logic: LogicSave[],
}