import { Vector } from "./Vector";

export interface iBoxCollision {
    point: Vector;
    normal: Vector;
    lineSegment: [Vector, Vector];
}

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

//the following function based on this example: https://www.jeffreythompson.org/collision-detection/line-line.php
export function lineSegmentIntersection(a1: Vector, a2: Vector, b1: Vector, b2: Vector): Vector | null {
    const a = b2.x - b1.x;
    const b = a1.y - b1.y;
    const c = b2.y - b1.y;
    const d = a1.x - b1.x;
    const e = a2.x - a1.x;
    const f = a2.y - a1.y;
    const g = c * e - a * f;
    const cA = (a * b - c * d) / g;
    const cB = (e * b - f * d) / g;

    if (!(cA >= 0 && cA <= 1 && cB >= 0 && cB <= 1)) {
        return null;
    }

    return new Vector(
        a1.x + (cA * e),
        a1.y + (cA * f)
    );
}

export function lineBoxIntersection(l1: Vector, l2: Vector, ul: Vector, br: Vector): iBoxCollision[] {
    //line segments
    const l: [Vector, Vector] = [ul, new Vector(ul.x, br.y)];
    const r: [Vector, Vector] = [br, new Vector(br.x, ul.y)];
    const t: [Vector, Vector] = [ul, new Vector(br.x, ul.y)];
    const b: [Vector, Vector] = [br, new Vector(ul.x, br.y)];

    //setgment intersections
    const pl = lineSegmentIntersection(l1, l2, l[0], l[1]);
    const pr = lineSegmentIntersection(l1, l2, r[0], r[1]);
    const pt = lineSegmentIntersection(l1, l2, t[0], t[1]);
    const pb = lineSegmentIntersection(l1, l2, b[0], b[1]);
    
    const intersections: iBoxCollision[] = [];

    //add results to returned list
    pl && intersections.push({ point: pl, normal: new Vector(-1, 0), lineSegment: l });
    pr && intersections.push({ point: pr, normal: new Vector(+1, 0), lineSegment: r });
    pt && intersections.push({ point: pt, normal: new Vector(0, +1), lineSegment: t });
    pb && intersections.push({ point: pb, normal: new Vector(0, -1), lineSegment: b });

    return intersections;
}

export function projectPointOnLine(p: Vector, lp: Vector, normal: Vector): Vector {
    const point = p.clone().subtract(lp);
    const dest = new Vector(normal.y, normal.x);
    const magnitude = point.dot(dest) / dest.magnitude();
    const projectedPoint = dest.multiplyScalar(magnitude);
    return projectedPoint.add(lp);
}