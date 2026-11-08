import type { Asset_Base, Instance_Base } from "@engine/core/core";

export enum SOCKET_TYPE {
    ANY = 1,
    NUMBER,
    STRING,
    ASSET,
    INSTANCE,
    BOOL,
    TRIPLE,
};

export type SocketTypeLookup = {
    [SOCKET_TYPE.ANY]: unknown;
    [SOCKET_TYPE.NUMBER]: number;
    [SOCKET_TYPE.STRING]: string;
    [SOCKET_TYPE.ASSET]: Asset_Base;
    [SOCKET_TYPE.INSTANCE]: Instance_Base;
    [SOCKET_TYPE.BOOL]: boolean;
    [SOCKET_TYPE.TRIPLE]: boolean | null;
};

export const SOCKET_DEFAULT = new Map<SOCKET_TYPE, 0 | '' | false | null>([
    [SOCKET_TYPE.ANY, null],
    [SOCKET_TYPE.NUMBER, 0],
    [SOCKET_TYPE.STRING, ''],
    [SOCKET_TYPE.ASSET, null],
    [SOCKET_TYPE.INSTANCE, null],
    [SOCKET_TYPE.BOOL, false],
    [SOCKET_TYPE.TRIPLE, null],
]);

export enum COLLISION_EVENT {
    START = 1,
    REPEAT,
    STOP,
}

export const THROWN = Symbol();
