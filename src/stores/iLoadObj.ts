type iAnyObj = {[key: string | number | symbol]: any};

export default interface iLoadObj {
    projectName: string,
    editor_version: string,
    newestID: number,
    selectedRoomId: number,
    startRoom: number | null,
    sprites: iAnyObj,
    objects: iAnyObj,
    rooms: iAnyObj,
    logic: iAnyObj,
}