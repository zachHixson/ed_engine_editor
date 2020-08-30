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
Object.freeze(CATEGORY_TYPE)

export {
    CATEGORY_ID,
    CATEGORY_TYPE
};