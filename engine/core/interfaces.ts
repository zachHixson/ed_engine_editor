import type {
    Sprite,
    Game_Object,
    iEngineLogic,
    iEditorLogic,
    Room,
    SpriteSave,
    GameObjectSave,
    RoomSave,
    LogicSave,
} from './core';

export type ActionCallbackData = {actionType: Symbol | number};
export type ActionCallback = (data: ActionCallbackData, commit?: boolean) => (ActionCallbackData | void);

export type AssetMap = {
    sprite: Map<number, Sprite>,
    object: Map<number, Game_Object>,
    engineLogic?: Map<number, iEngineLogic>,
    editorLogic?: Map<number, iEditorLogic>,
    room?: Map<number, Room>,
};

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
