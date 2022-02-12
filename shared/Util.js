Shared.getHighestEndingNumber = (list) => {
    let highest = -1;
    let pattern = /\d+$/

    for (let i = 0; i < list.length; i++){
        let number = parseInt(list[i].match(pattern));

        if (number != NaN && number > highest){
            highest = number;
        }
    }

    return highest;
}

Shared.removeStroke = (svg) => {
    let paths = svg.childNodes;

    for (let i = 0; i < paths.length; i++){
        if (paths[i].style){
            paths[i].style.stroke = '';
        }
    }

    return svg;
}

Shared.mod = (n, m) => {
    return ((n%m)+m)%m;
}

Shared.clamp = (x, min, max) => {
    return Math.max(Math.min(x, max), min);
}

Shared.lerp = (a, b, t) => {
    return t * (b - a) + a;
}