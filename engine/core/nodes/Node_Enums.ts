export enum SOCKET_TYPE {
    ANY = 1,
    NUMBER,
    STRING,
    ASSET,
    INSTANCE,
    BOOL,
    INFO,
    BUTTON,
};

export const SOCKET_DEFAULT = new Map<SOCKET_TYPE, any>([
    [SOCKET_TYPE.ANY, null],
    [SOCKET_TYPE.NUMBER, 0],
    [SOCKET_TYPE.STRING, ''],
    [SOCKET_TYPE.ASSET, null],
    [SOCKET_TYPE.INSTANCE, null],
    [SOCKET_TYPE.BOOL, false],
]);

export enum WIDGET {
    ENUM = 1,
    KEY,
    MOUSE_BTN,
    TEXT_AREA,
    DIRECTION,
}

export enum COLLISION_EVENT {
    START = 1,
    REPEAT,
    STOP,
}

export const THROWN = Symbol();