export const SOCKET_TYPE = {
    ANY: Symbol('ANY'),
    NUMBER: Symbol('NUMBER'),
    STRING: Symbol('STRING'),
    OBJECT: Symbol('OBJECT'),
    BOOL: Symbol('BOOL'),
};

export const WIDGET = {
    ENUM: Symbol('ENUM'),
    KEY: Symbol('KEY'),
    MOUSE_BTN: Symbol('MOUSE_BTN'),
}

export const COLLISION_EVENT = {
    START: Symbol('START'),
    REPEAT: Symbol('REPEAT'),
    STOP: Symbol('STOP'),
}