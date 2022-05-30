import {getSpriteDimensions, get2DIdx} from './Util_2D';
import {clamp} from './Util';

export function drawCheckerBG(canvas, checkerSize, lightCol = '#AAA', darkCol = '#CCC'){
    let ctx = canvas.getContext('2d');
    let xCount = Math.ceil(canvas.width / checkerSize);
    let yCount = Math.ceil(canvas.height / checkerSize);

    if (xCount % 2 == 0){
        xCount += 1;
    }

    for (let x = 0; x < xCount; x++){
        for (let y = 0; y < yCount; y++){
            let curIdx = get2DIdx(x, y, xCount);

            ctx.fillStyle = (curIdx % 2) ? lightCol : darkCol;
            ctx.fillRect(
                x * checkerSize,
                y * checkerSize,
                checkerSize,
                checkerSize
            );
        }
    }
};

export function drawPixelData(canvas, spriteArray){
    const SPRITE_DIM = getSpriteDimensions(spriteArray);

    let ctx = canvas.getContext('2d');
    let imgData = ctx.createImageData(SPRITE_DIM, SPRITE_DIM);
    
    for (let i = 0; i < spriteArray.length; i++){
        let curIdx = i * 4;
        let rgb = hexToRGBA(spriteArray[i]);

        switch (spriteArray[i].length){
            case 0:
                rgb.a = 0;
                break;
            case 6:
            case 7:
                rgb.a = 255;
                break;
        }

        imgData.data[curIdx + 0] = rgb.r;
        imgData.data[curIdx + 1] = rgb.g;
        imgData.data[curIdx + 2] = rgb.b;
        imgData.data[curIdx + 3] = rgb.a;
    }

    ctx.putImageData(imgData, 0, 0);
};

export function hexToRGBA(hexStr){
    let offset = 0;

    if (hexStr.charAt(0) == '#'){
        offset = 1;
    }

    return {
        r: parseInt(hexStr.substring(0 + offset, 2 + offset), 16),
        g: parseInt(hexStr.substring(2 + offset, 4 + offset), 16),
        b: parseInt(hexStr.substring(4 + offset, 6 + offset), 16),
        a: parseInt(hexStr.substring(6 + offset, 8 + offset), 16)
    }
};

export function RGBAToHex(r = 0, g = 0, b = 0, a = 255){
    r = clamp(r, 0, 255);
    g = clamp(g, 0, 255);
    b = clamp(b, 0, 255);
    a = clamp(a, 0, 255);
    
    let hexR = r.toString(16).padStart(2, '0');
    let hexG = g.toString(16).padStart(2, '0');
    let hexB = b.toString(16).padStart(2, '0');
    let hexA = a.toString(16).padStart(2, '0');

    return '#' + hexR + hexG + hexB + hexA;
};

export function HSVToRGB(h, s, v){
    let c = v * s;
    let x = c * (1 - Math.abs(((h / 60) % 2) - 1));
    let m = v - c;
    let out;

    if (0 <= h && h < 60){
        out = [c, x, 0];
    }
    else if (h < 120){
        out = [x, c, 0];
    }
    else if (h < 180){
        out = [0, c, x];
    }
    else if (h < 240){
        out = [0, x, c];
    }
    else if (h < 300){
        out = [x, 0, c];
    }
    else if (h <= 360){
        out = [c, 0, x];
    }
    else{
        console.trace("Error: Hue is not 0-360 [" + h + "]");
    }

    for (let i = 0; i < out.length; i++){
        out[i] = Math.floor((out[i] + m) * 255);
    }

    return {
        r: out[0],
        g: out[1],
        b: out[2]
    }
};

export function RGBToHSV(r, g, b){
    let rp = r / 255;
    let gp = g / 255;
    let bp = b / 255;
    let cmax = Math.max(rp, gp, bp);
    let cmin = Math.min(rp, gp, bp);
    let delta = cmax - cmin;
    let hue;
    let sat;
    let val;

    if (delta == 0){
        hue = 0;
    }
    else if (cmax == rp){
        hue = ((gp - bp) / delta) % 6;
    }
    else if (cmax == gp){
        hue = (bp - rp) / delta + 2;
    }
    else if (cmax == bp){
        hue = (rp - gp) / delta + 4;
    }

    hue *= 60;
    sat = (cmax == 0) ? 0 : delta / cmax;
    val = cmax;

    return {hue, sat, val};
};

export function createCanvas(width, height){
    const canvas = document.createElement('canvas');
    resizeCanvas(canvas, width, height);
    return canvas;
}

export function resizeCanvas(canvas, width, height){
    canvas.width = width;
    canvas.height = height;
}