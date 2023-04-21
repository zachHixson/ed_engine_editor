export function getHighestEndingNumber(list: string[]): number {
    const pattern = /\d+$/;
    let highest = -1;

    for (let i = 0; i < list.length; i++){
        const match = list[i].match(pattern) ?? [];
        const str = match[0] ?? '';
        const number = parseInt(str) as number;

        if (!isNaN(number) && number > highest){
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

export function easeOutBack(x: number): number {
    const c1 = 1.70158;
    const c3 = c1 + 1;
    const xm1 = x - 1;

    return 1 + c3 * xm1 * xm1 * xm1 + c1 * xm1 * xm1;
}