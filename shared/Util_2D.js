export function get2DIdx(x, y, width){
    return (y * width) + x;
}

export function isInBounds(x, y, lowX, lowY, highX, highY){
    return (
        x >= lowX &&
        y >= lowY &&
        x <= highX &&
        y <= highY
    );
}

export function getSpriteDimensions(spriteArr){
    return Math.round(Math.sqrt(spriteArr.length));
}

export function compareVector(vec1, vec2){
    return (
        vec1.x == vec2.x &&
        vec1.y == vec2.y
    );
}