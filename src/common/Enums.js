let curEnum = 0;

const CATEGORY_ID = {
    UNDEFINED: -1,
    SPRITE: curEnum++,
    OBJECT: curEnum++,
    TILE: curEnum++,
    ROOM: curEnum++
}
Object.freeze(CATEGORY_ID);

const CATEGORY_TYPE = {
    UNDEFINED: 'UNDEFINED',
    SPRITE: 'SPRITE',
    OBJECT: 'OBJECT',
    TILE: 'TILE',
    ROOM: 'ROOM'
}
Object.freeze(CATEGORY_TYPE);

const EDITOR_ID = {
    ROOM: curEnum++,
    ART: curEnum++,
    OBJECT: curEnum++,
    LOGIC: curEnum++
}
Object.freeze(EDITOR_ID);

const EDITOR_TYPE = {
    ROOM: 'ROOM',
    ART: 'ART',
    OBJECT: 'OBJECT',
    LOGIC: 'LOGIC'
}

export {
    CATEGORY_ID,
    CATEGORY_TYPE,
    EDITOR_ID,
    EDITOR_TYPE
};