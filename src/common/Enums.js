let curEnum = 0;

export const CATEGORY_ID = {
    UNDEFINED: -1,
    SPRITE: curEnum++,
    OBJECT: curEnum++,
    TILE: curEnum++,
    ROOM: curEnum++
}
Object.freeze(CATEGORY_ID);

export const CATEGORY_TYPE = {
    UNDEFINED: 'UNDEFINED',
    SPRITE: 'SPRITE',
    OBJECT: 'OBJECT',
    TILE: 'TILE',
    ROOM: 'ROOM'
}
Object.freeze(CATEGORY_TYPE);

export const EDITOR_ID = {
    ROOM: curEnum++,
    ART: curEnum++,
    OBJECT: curEnum++,
    LOGIC: curEnum++
}
Object.freeze(EDITOR_ID);

export const EDITOR_TYPE = {
    ROOM: 'ROOM',
    ART: 'ART',
    OBJECT: 'OBJECT',
    LOGIC: 'LOGIC'
}
Object.freeze(EDITOR_TYPE);

export const ART_TOOL_SIZE = {
    SMALL: curEnum++,
    MEDIUM: curEnum++,
    LARGE: curEnum++
}
Object.freeze(ART_TOOL_SIZE);

export const ART_TOOL_TYPE = {
    BRUSH: curEnum++,
    BUCKET: curEnum++,
    LINE: curEnum++,
    BOX: curEnum++,
    BOX_FILL: curEnum++,
    ELLIPSE: curEnum++,
    ELLIPSE_FILL: curEnum++,
    ERASER: curEnum++,
    EYE_DROPPER: curEnum++
}
Object.freeze(ART_TOOL_TYPE);

export const ROOM_TOOL_TYPE = {
    SELECT_MOVE: curEnum++,
    ADD_BRUSH: curEnum++,
    ERASER: curEnum++,
    CAMERA: curEnum++,
    ROOM_PROPERTIES: curEnum++,
    TOGGLE_GRID: curEnum++,
}
Object.freeze(ROOM_TOOL_TYPE);