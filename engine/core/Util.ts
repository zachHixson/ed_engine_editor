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

export function projectSVF(sp: Vector, sv: Vector, bp: Vector, bd: Vector){
    /*
        Algorithm:
        - get SVF (signed vector field) of the box
        - scale box's SVF based on the direction
        - Calculate projection SVF, and shift the values based on direction
            - The projection SVF will be used as an offset to project the sample point to the box
        - Mask out values that won't collide
            - Values that are greater than the length of the distance will not collide
            - Values that are not in an "extrusion" of the box will not collide either
                - In order to calculate the extrusion, offset the sample by the
                    calculated projection SVF and see if the result lands in the box
                    (i.e. both X and Y are negative)
        - Calculate normals based on simplified box SVF
        - Calculate if the point lies on a corner by checking if the box SVF X and Y are equal
    */
    const bSVF = sp.clone().subtract(bp).absolute().subtract(bd);
    const bSVFScaled = new Vector(
        bSVF.x * Math.abs(sv.y),
        bSVF.y * Math.abs(sv.x)
    );
    const bSDF = Math.max(bSVFScaled.x, bSVFScaled.y);
    const projectSVF = new Vector(
        sv.y != 0 ? (bSDF / sv.y) * +(sv.x != 0) : bSVF.x * +(bSVF.y < 0),
        sv.x != 0 ? (bSDF / sv.x) * +(sv.y != 0) : bSVF.y * +(bSVF.x < 0)
    ).multiplyScalar(Math.sign(
        (sv.y || 1) * (sv.x || 1)
    ));
    const projectedPoint = sp.clone().add(projectSVF);
    const offsetSVF = projectedPoint.clone().subtract(bp).absolute().subtract(bd);
    const boxMask = +(offsetSVF.x <= 0 && offsetSVF.y <= 0);
    const distanceMask = +(projectSVF.dot(projectSVF) <= sv.dot(sv));
    const normal = new Vector(
        Math.max(Math.min(+(offsetSVF.y != 0) * -Math.sign(sv.x), 1), -1),
        Math.max(Math.min(+(offsetSVF.x != 0) * -Math.sign(sv.y), 1), -1)
    );

    return (boxMask * distanceMask) > 0 ? { point: projectedPoint, offset: projectSVF, normal: normal } : null;
}

export function projectPointOnLine(p: Vector, lp: Vector, normal: Vector): Vector {
    const point = p.clone().subtract(lp);
    const dest = new Vector(normal.y, normal.x);
    const magnitude = point.dot(dest) / dest.magnitude();
    const projectedPoint = dest.multiplyScalar(magnitude);
    return projectedPoint.add(lp);
}