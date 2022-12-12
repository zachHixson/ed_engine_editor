export const SOCKET_TYPE = {
    ANY: Symbol.for('ANY'),
    NUMBER: Symbol.for('NUMBER'),
    STRING: Symbol.for('STRING'),
    OBJECT: Symbol.for('OBJECT'),
    BOOL: Symbol.for('BOOL'),
};

export const SOCKET_DEFAULT = new Map([
    [SOCKET_TYPE.ANY, null],
    [SOCKET_TYPE.NUMBER, 0],
    [SOCKET_TYPE.STRING, ''],
    [SOCKET_TYPE.OBJECT, null],
    [SOCKET_TYPE.BOOL, false],
]);

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