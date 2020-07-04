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
}

export default Util_2D;