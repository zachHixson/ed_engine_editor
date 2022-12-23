export enum SOCKET_TYPE {
    ANY = 1,
    NUMBER,
    STRING,
    OBJECT,
    BOOL,
    INFO,
    BUTTON,
};

export const SOCKET_DEFAULT = new Map<SOCKET_TYPE, any>([
    [SOCKET_TYPE.ANY, null],
    [SOCKET_TYPE.NUMBER, 0],
    [SOCKET_TYPE.STRING, ''],
    [SOCKET_TYPE.OBJECT, null],
    [SOCKET_TYPE.BOOL, false],
]);

export enum WIDGET {
    ENUM = 1,
    KEY,
    MOUSE_BTN,
    TEXT_AREA,
}

export enum COLLISION_EVENT {
    START = 1,
    REPEAT,
    STOP,
}