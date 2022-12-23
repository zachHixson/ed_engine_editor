import { Vector } from "./Vector";

export type iAnyObj = {[key: string | number | symbol]: any};

export interface iSerializedGameData {
    projectName: string,
    editor_version: string,
    newestID: number,
    selectedRoomId: number,
    startRoom: number | null,
    sprites: iAnyObj[],
    objects: iAnyObj[],
    rooms: iAnyObj[],
    logic: iAnyObj[],
}

export interface iNavState {
    zoomFac: number;
    offset: Vector;
}