class Util_2D{
    static get2DIdx(x, y, width){
        return (y * width) + x;
    }

    static isInBounds(x, y, lowX, lowY, highX, highY){
        return (
            x >= lowX &&
            y >= lowY &&
            x <= highX &&
            y <= highY
        );
    }

    static clamp(val, min, max){
        return Math.min(Math.max(val, min), max);
    }

    static getSpriteDimensions(spriteArr){
        return Math.round(Math.sqrt(spriteArr.length));
    }

    static compareVector(vec1, vec2){
        return (
            vec1.x == vec2.x &&
            vec1.y == vec2.y
        );
    }
}

export default Util_2D;