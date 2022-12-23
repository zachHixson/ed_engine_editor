import {getSpriteDimensions, get2DIdx} from './Util';
import {clamp} from './Util';

export function drawCheckerBG(canvas: HTMLCanvasElement, checkerSize: number, lightCol: string = '#AAA', darkCol: string = '#CCC'): void {
    const ctx = canvas.getContext('2d')!;
    let xCount = Math.ceil(canvas.width / checkerSize);
    let yCount = Math.ceil(canvas.height / checkerSize);

    if (xCount % 2 == 0){
        xCount += 1;
    }

    ctx.scale(devicePixelRatio, devicePixelRatio);

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

    ctx.resetTransform();
};

export function hexToRGBA(hexStr: string): {r: number, g: number, b: number, a: number} {
    let offset = 0;

    if (hexStr.charAt(0) == '#'){
        offset = 1;
    }

    if (hexStr.length < 8){
        hexStr += 'ff';
    }

    return {
        r: parseInt(hexStr.substring(0 + offset, 2 + offset), 16),
        g: parseInt(hexStr.substring(2 + offset, 4 + offset), 16),
        b: parseInt(hexStr.substring(4 + offset, 6 + offset), 16),
        a: parseInt(hexStr.substring(6 + offset, 8 + offset), 16)
    }
};

export function RGBAToHex(r: number = 0, g: number = 0, b: number = 0, a: number = 255): string {
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

export function HSVToRGB(h: number, s: number, v: number): {r: number, g: number, b: number} {
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
        out = [0, 0, 0];
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

export function RGBToHSV(r: number, g: number, b: number): {hue: number, sat: number, val: number} {
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
    else{
        hue = 0;
    }

    hue *= 60;
    sat = (cmax == 0) ? 0 : delta / cmax;
    val = cmax;

    return {hue, sat, val};
};

export function createCanvas(width: number, height: number): HTMLCanvasElement {
    const canvas = document.createElement('canvas');
    resizeCanvas(canvas, width, height);
    return canvas;
}

export function resizeCanvas(canvas: HTMLCanvasElement, width: number, height: number): void {
    Object.assign(canvas, {width, height});
}

export function createHDPICanvas(width: number, height: number): HTMLCanvasElement {
    const canvas = document.createElement('canvas');
    resizeHDPICanvas(canvas, width, height);
    return canvas;
}

export function resizeHDPICanvas(canvas: HTMLCanvasElement, width: number, height: number): void {
    canvas.width = width * devicePixelRatio;
    canvas.height = height * devicePixelRatio;
    canvas.style.width = width + 'px';
    canvas.style.height = height + 'px';
}

export class Color{
    private _r: number;
    private _g: number;
    private _b: number;
    private _a: number;
    private _needsUpdate: boolean = true;
    private _hexCache: string | null = null;

    constructor(r = 0, g = 0, b = 0, a = 255){
        this._r = r;
        this._g = g;
        this._b = b;
        this._a = a;
    }

    get r(){return this._r};
    get g(){return this._g};
    get b(){return this._b};
    get a(){return this._a};

    set r(val){this._r = val; this._needsUpdate = true};
    set g(val){this._g = val; this._needsUpdate = true};
    set b(val){this._b = val; this._needsUpdate = true};
    set a(val){this._a = val; this._needsUpdate = true};

    set(r = 0, g = 0, b = 0, a = 255): void {
        Object.assign(this, {r, g, b, a});
    }

    toCSS(): string {
        return `rgba(${this._r}, ${this._g}, ${this._b}, ${this._a})`;
    }

    toHex(): string {
        if (this._needsUpdate){
            const {r, g, b, a} = this;
            this._hexCache = RGBAToHex(r, g, b, a);
            this._needsUpdate = false;
        }

        return this._hexCache!;
    }

    fromHex(hexStr: string): Color {
        const RGBA = hexToRGBA(hexStr);
        Object.assign(this, RGBA);
        return this;
    }

    fromArray(arr: number[]): Color {
        const [r, g, b, a] = arr;
        Object.assign(this, {r, g, b, a});
        return this;
    }
    
    compare(col: Color): boolean {
        return (
            this.r == col.r &&
            this.g == col.g &&
            this.b == col.b &&
            this.a == col.a
        )
    }
}