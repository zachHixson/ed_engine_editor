function createEnum(list){
    const outObj = {};
    list.forEach(e => outObj[e] = Symbol(e));
    Object.freeze(outObj);
    return outObj;
};

Shared.CATEGORY_ID = createEnum([
    'UNDEFINED',
    'SPRITE',
    'OBJECT',
    'LOGIC',
    'ROOM',
]);

Shared.EDITOR_ID = createEnum([
    'ROOM',
    'ART',
    'OBJECT',
    'LOGIC',
]);

Shared.ART_TOOL_SIZE = createEnum([
    'SMALL',
    'MEDIUM',
    'LARGE',
]);

Shared.ART_TOOL_TYPE = createEnum([
    'BRUSH',
    'BUCKET',
    'LINE',
    'BOX',
    'BOX_FILL',
    'ELLIPSE',
    'ELLIPSE_FILL',
    'ERASER',
    'EYE_DROPPER',
]);

Shared.ROOM_TOOL_TYPE = createEnum([
    'SELECT_MOVE',
    'ADD_BRUSH',
    'ERASER',
    'EXIT',
    'CAMERA',
    'ROOM_PROPERTIES',
    'TOGGLE_GRID',
]);

Shared.ROOM_ACTION = createEnum([
    'MOVE',
    'ADD',
    'DELETE',
    'INSTANCE_CHANGE',
    'INSTANCE_GROUP_CHANGE',
    'INSTANCE_VAR_CHANGE',
    'EXIT_ADD',
    'EXIT_CHANGE',
    'EXIT_DELETE',
    'CAMERA_CHANGE',
    'ROOM_PROP_CHANGE',
    'ROOM_VAR_CHANGE',
]);

Shared.MOUSE_EVENT = createEnum([
    'CLICK',
    'DOWN',
    'UP',
    'MOVE',
    'LEAVE',
    'ENTER',
]);

Shared.ENTITY_TYPE = createEnum([
    'INSTANCE',
    'EXIT',
]);

Shared.LOGIC_ACTION = createEnum([
    'ADD_NODE',
    'DELETE_NODES',
    'MOVE',
    'CONNECT',
    'DISCONNECT',
    'CHANGE_INPUT',
]);