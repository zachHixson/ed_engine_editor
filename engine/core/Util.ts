import { Sprite, Vector } from "./core_filemap";

export function getHighestEndingNumber(list: string[]): number {
    let highest = -1;
    let pattern = /\d+$/;

    for (let i = 0; i < list.length; i++){
        const number = parseInt(list[i].match(pattern)![0] ?? '') as number;

        if (isNaN(number) && number > highest){
            highest = number;
        }
    }

    return highest;
}

export function mod(n: number, m: number): number{
    return ((n%m)+m)%m;
}

export function clamp(x: number, min: number, max: number): number{
    return Math.max(Math.min(x, max), min);
}

export function lerp(a: number, b: number, t: number): number {
    return t * (b - a) + a;
}

export function get2DIdx(x: number, y: number, width: number): number {
    return (y * width) + x;
};

export function isInBounds(x: number, y: number, lowX: number, lowY: number, highX: number, highY: number): boolean {
    return (
        x >= lowX &&
        y >= lowY &&
        x <= highX &&
        y <= highY
    );
};

export function getSpriteDimensions(spriteFrame: ImageData): number {
    return spriteFrame.width;
};