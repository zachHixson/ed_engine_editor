export enum CATEGORY_ID {
    UNDEFINED = 1,
    SPRITE,
    OBJECT,
    LOGIC,
    ROOM,
}

export enum MOUSE_EVENT {
    CLICK = 1,
    DOWN,
    UP,
    DOUBLE_CLICK,
    MOVE,
    LEAVE,
    ENTER,
};

export enum KEY_STATE {
    DOWN = 'down',
    PRESSED = 'pressed',
    UP = 'up',
    NONE = 'NONE',
}

export enum INSTANCE_TYPE {
    SPRITE = 'S',
    OBJECT = 'O',
    EXIT = 'E',
    LOGIC = 'L',
};

export enum TRANSITION_TYPE {
    NONE = 'N',
    FADE = 'F',
};
