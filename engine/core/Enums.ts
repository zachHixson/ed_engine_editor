export enum CATEGORY_ID {
    UNDEFINED = 1,
    SPRITE,
    OBJECT,
    LOGIC,
    ROOM,
}

export enum EDITOR_ID {
    ROOM = 1,
    ART,
    OBJECT,
    LOGIC,
}

export enum NAV_TOOL_TYPE {
    PAN = 1,
    ZOOM,
    CENTER,
};

export enum ART_TOOL_SIZE {
    SMALL = 1,
    MEDIUM,
    LARGE,
};

export enum ART_TOOL_TYPE {
    BRUSH = 1,
    BUCKET,
    LINE,
    BOX,
    BOX_FILL,
    ELLIPSE,
    ELLIPSE_FILL,
    ERASER,
    EYE_DROPPER,
};

export enum ROOM_TOOL_TYPE {
    SELECT_MOVE = 1,
    ADD_BRUSH,
    ERASER,
    EXIT,
    CAMERA,
    ROOM_PROPERTIES,
    TOGGLE_GRID,
};

export enum ROOM_ACTION {
    MOVE = 1,
    ADD,
    DELETE,
    INSTANCE_CHANGE,
    INSTANCE_GROUP_CHANGE,
    INSTANCE_VAR_CHANGE,
    EXIT_ADD,
    EXIT_CHANGE,
    EXIT_DELETE,
    CAMERA_CHANGE,
    ROOM_PROP_CHANGE,
};

export enum MOUSE_EVENT {
    CLICK = 1,
    DOWN,
    UP,
    MOVE,
    LEAVE,
    ENTER,
};

export enum INSTANCE_TYPE {
    INSTANCE = 1,
    EXIT,
};

export enum LOGIC_ACTION {
    ADD_NODE = 1,
    DELETE_NODES,
    MOVE,
    CONNECT,
    DISCONNECT,
    CHANGE_INPUT,
};