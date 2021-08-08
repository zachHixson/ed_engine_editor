let curEnum = 0;

export const CATEGORY_ID = {
    UNDEFINED: -1,
    SPRITE: curEnum++,
    OBJECT: curEnum++,
    LOGIC: curEnum++,
    ROOM: curEnum++
}
Object.freeze(CATEGORY_ID);

export const CATEGORY_TYPE = {
    UNDEFINED: 'UNDEFINED',
    SPRITE: 'SPRITE',
    OBJECT: 'OBJECT',
    LOGIC: 'LOGIC',
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
    EXIT: curEnum++,
    CAMERA: curEnum++,
    ROOM_PROPERTIES: curEnum++,
    TOGGLE_GRID: curEnum++,
}
Object.freeze(ROOM_TOOL_TYPE);

export const ROOM_ACTION = {
    MOVE: curEnum++,
    ADD: curEnum++,
    DELETE: curEnum++,
    INSTANCE_CHANGE: curEnum++,
    INSTANCE_GROUP_CHANGE: curEnum++,
    INSTANCE_VAR_CHANGE: curEnum++,
    EXIT_ADD: curEnum++,
    EXIT_CHANGE: curEnum++,
    EXIT_DELETE: curEnum++,
    CAMERA_CHANGE: curEnum++,
    ROOM_PROP_CHANGE: curEnum++,
    ROOM_VAR_CHANGE: curEnum++
}
Object.freeze(ROOM_ACTION);

export const MOUSE_EVENT = {
    CLICK: curEnum++,
    DOWN: curEnum++,
    UP: curEnum++,
    MOVE: curEnum++,
    LEAVE: curEnum++,
    ENTER: curEnum++
}
Object.freeze(MOUSE_EVENT);

export const ENTITY_TYPE = {
    INSTANCE: curEnum++,
    EXIT: curEnum++
}
Object.freeze(ENTITY_TYPE);