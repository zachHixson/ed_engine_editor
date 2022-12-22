export function getHighestEndingNumber(list){
    let highest = -1;
    let pattern = /\d+$/;

    for (let i = 0; i < list.length; i++){
        let number = parseInt(list[i].match(pattern));

        if (number != NaN && number > highest){
            highest = number;
        }
    }

    return highest;
}

export function removeStroke(svg){
    let paths = svg.childNodes;

    for (let i = 0; i < paths.length; i++){
        if (paths[i].style){
            paths[i].style.stroke = '';
        }
    }

    return svg;
}

export function mod(n, m){
    return ((n%m)+m)%m;
}

export function clamp(x, min, max){
    return Math.max(Math.min(x, max), min);
}

export function lerp(a, b, t){
    return t * (b - a) + a;
}

export function get2DIdx(x, y, width){
    return (y * width) + x;
};

export function isInBounds(x, y, lowX, lowY, highX, highY){
    return (
        x >= lowX &&
        y >= lowY &&
        x <= highX &&
        y <= highY
    );
};

export function getSpriteDimensions(spriteArr){
    return Math.round(Math.sqrt(spriteArr.length));
};

export function compareVector(vec1, vec2){
    return (
        vec1.x == vec2.x &&
        vec1.y == vec2.y
    );
};