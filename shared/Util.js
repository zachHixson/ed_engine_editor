export function getHighestEndingNumber(list){
    let highest = -1;
    let pattern = /\\d+$/; //double backslashes are required since this library gets converted to a string

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