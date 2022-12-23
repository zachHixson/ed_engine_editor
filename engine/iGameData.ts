import { Game_Object, Room, Sprite } from "./core/core_filemap";
import Logic from "./Logic";

export default interface iGameData {
    startRoom: number,
    sprites: Sprite[],
    objects: Game_Object[],
    rooms: Room[],
    logic: Logic[],
}