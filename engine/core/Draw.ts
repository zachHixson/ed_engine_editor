import {get2DIdx} from './Util';
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
    
    const hexR = r.toString(16).padStart(2, '0');
    const hexG = g.toString(16).padStart(2, '0');
    const hexB = b.toString(16).padStart(2, '0');
    const hexA = a.toString(16).padStart(2, '0');

    return '#' + hexR + hexG + hexB + hexA;
};

export function FastHSVToRGB(h: number, s: number, v: number, rgbObj: any): void {
    const c = v * s;
    const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
    const m = v - c;
    let o1, o2, o3;

    if (0 <= h && h < 60){
        o1 = c;
        o2 = x;
        o3 = 0;
    }
    else if (h < 120){
        o1 = x;
        o2 = c;
        o3 = 0;
    }
    else if (h < 180){
        o1 = 0;
        o2 = c;
        o3 = x;
    }
    else if (h < 240){
        o1 = 0;
        o2 = x;
        o3 = c;
    }
    else if (h < 300){
        o1 = x;
        o2 = 0;
        o3 = c;
    }
    else if (h <= 360){
        o1 = c;
        o2 = 0;
        o3 = x;
    }
    else{
        console.trace("Error: Hue is not 0-360 [" + h + "]");
        o1 = 0;
        o2 = 0;
        o3 = 0;
    }

    rgbObj.r = (o1 + m) * 255,
    rgbObj.g = (o2 + m) * 255,
    rgbObj.b = (o3 + m) * 255
};

export function HSVToRGB(h: number, s: number, v: number): {r: number, g: number, b: number} {
    const rgb = {r: 0, g: 0, b: 0};
    FastHSVToRGB(h, s, v, rgb)
    return rgb;
}

export function FastRGBToHSV(r: number, g: number, b: number, outObj: {hue: number, sat: number, val: number}): void {
    const rp = r / 255;
    const gp = g / 255;
    const bp = b / 255;
    const cmax = Math.max(rp, gp, bp);
    const cmin = Math.min(rp, gp, bp);
    const delta = cmax - cmin;
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

    outObj.hue = hue;
    outObj.sat = sat;
    outObj.val = val;
};

export function RGBToHSV(r: number, g: number, b: number): {hue: number, sat: number, val: number} {
    const hsv = {hue: 0, sat: 0, val: 0};
    FastRGBToHSV(r, g, b, hsv);
    return hsv;
}

export function createCanvas(width: number, height: number): HTMLCanvasElement {
    const canvas = document.createElement('canvas');
    resizeCanvas(canvas, width, height);
    return canvas;
}

export function resizeCanvas(canvas: HTMLCanvasElement, width: number, height: number): void {
    canvas.width = width;
    canvas.height = height;
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

    copy(newColor: Color): void {
        Object.assign(this, newColor);
    }

    clone(): Color {
        return Object.assign(new Color(0, 0, 0, 0), this);
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