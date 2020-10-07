const CATEGORY_ID = {
    UNDEFINED: -1,
    SPRITE: 0,
    OBJECT: 1,
    TILE: 2,
    ROOM: 3
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
    LEVEL: 0,
    ART: 1,
    OBJECT: 2,
    LOGIC: 3
}
Object.freeze(EDITOR_ID);

const EDITOR_TYPE = {
    LEVEL: 'LEVEL',
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