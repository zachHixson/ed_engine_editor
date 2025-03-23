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

export function projectSVF(sp: Readonly<Vector>, sv: Readonly<Vector>, bp: Readonly<Vector>, bd: Readonly<Vector>){
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
        
        NOTE: Vector objects are not used during the calculations because cloning them is very slow
    */
    const bSVFX = Math.abs(sp.x - bp.x) - bd.x;
    const bSVFY = Math.abs(sp.y - bp.y) - bd.y;
    const bSVFScaledX = bSVFX * Math.abs(sv.y);
    const bSVFScaledY = bSVFY * Math.abs(sv.x);
    const bSDF = Math.max(bSVFScaledX, bSVFScaledY);
    const exclusiveNorSign = Math.sign((sv.y || 1) * (sv.x || 1));
    const projectSVFX = (sv.y != 0 ? (bSDF / sv.y) * +(sv.x != 0) : bSVFX * +(bSVFY < 0)) * exclusiveNorSign;
    const projectSVFY = (sv.x != 0 ? (bSDF / sv.x) * +(sv.y != 0) : bSVFY * +(bSVFX < 0)) * exclusiveNorSign;
    const projectedPointX = sp.x + projectSVFX;
    const projectedPointY = sp.y + projectSVFY;
    const offsetSVFX = Math.abs(projectedPointX - bp.x) - bd.x;
    const offsetSVFY = Math.abs(projectedPointY - bp.y) - bd.y;

    //calculate masks
    const boxMask = +(offsetSVFX <= 0 && offsetSVFY <= 0);
    const distanceMask = +((projectSVFX * projectSVFX + projectSVFY * projectSVFY) <= sv.dot(sv));

    //calculate normal
    const velAspect = Math.abs(sv.y / sv.x);
    const invAspect = 1 / velAspect;
    const normalX = +(bSVFX * velAspect >= bSVFY) * (+(sp.x > bp.x) * 2 - 1) * +(offsetSVFY != 0);
    const normalY = +(bSVFY * invAspect >= bSVFX) * (+(sp.y > bp.y) * 2 - 1) * +(offsetSVFX != 0);

    return (boxMask * distanceMask) > 0 ? {
        point: new Vector(projectedPointX, projectedPointY),
        offset: new Vector(projectSVFX, projectSVFY),
        normal: new Vector(normalX, normalY),
    } : null;
}

export function projectPointOnLine(p: Readonly<Vector>, lp: Readonly<Vector>, normal: Readonly<Vector>): Vector {
    const point = p.clone().subtract(lp);
    const dest = new Vector(normal.y, normal.x);
    const magnitude = point.dot(dest) / dest.magnitude();
    const projectedPoint = dest.multiplyScalar(magnitude);
    return projectedPoint.add(lp);
}