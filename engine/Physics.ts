import { Instance_Base, Vector, Util, Sprite } from './core/core';

export type MoveResult = {
    point: Vector,
    normal: Vector,
    collisions: RaycastResult[],
}

export type RaycastResult = {
    point: Vector,
    normal: Vector,
    instance: Instance_Base,
}

const INV_SPR_DIM = 1 / Sprite.DIMENSIONS;

export function raycast(pos: Readonly<Vector>, instanceList: Instance_Base[], velocity: Readonly<Vector>): RaycastResult[] {
    const collisionDim = new Vector(Sprite.DIMENSIONS, Sprite.DIMENSIONS);
    const normVel = velocity.clone().normalize();
    const results: RaycastResult[] = [];

    if (velocity.lengthNoSqrt() <= 0) return [];

    for (let i = 0; i < instanceList.length; i++){
        const result = Util.projectSVF(pos, velocity, instanceList[i].pos, collisionDim);

        if (!result) continue;

        const { point, normal } = result;
        const normCheck = normVel.dot(normal);

        if (normCheck >= 0) continue;

        results.push({point, normal, instance: instanceList[i]});
    }

    return results;
}

export function move(startPoint: Readonly<Vector>, worldInstances: Instance_Base[], velocity: Readonly<Vector>): MoveResult {
    const velOffset = velocity.clone().normalize().scale(0.001);
    const instCenter = startPoint.clone().add(velOffset);
    const rayHits = raycast(instCenter, worldInstances, velocity);
    const collisions: RaycastResult[] = [];
    let closestHit: RaycastResult = rayHits[0];

    if (rayHits.length <= 0){
        return {
            point: startPoint.clone().add(velocity),
            normal: new Vector(0, 0),
            collisions: [],
        };
    }

    //find nearest hit point
    {
        let closestDist = rayHits[0].point.distanceNoSqrt(instCenter);

        for (let i = 0; i < rayHits.length; i++){
            const checkDist = rayHits[i].point.distanceNoSqrt(instCenter);

            if (checkDist < closestDist){
                closestDist = checkDist;
                closestHit = rayHits[i];
            }
            else if (checkDist == closestDist){
                const curInstDist = closestHit.instance.pos.distanceNoSqrt(startPoint);
                const hitDist = rayHits[i].instance.pos.distanceNoSqrt(startPoint);
                const instCheck = hitDist < curInstDist;

                if (instCheck){
                    closestHit = rayHits[i];
                }
            }
        }
    }

    //find all collisions
    for (let i = 0; i < rayHits.length; i++){
        if (rayHits[i].point.equalTo(closestHit.point)){
            collisions.push(rayHits[i]);
        }
    }

    //normals with a length of 0 are useless, but sometimes occur and cause errors, so we correct for that
    if (closestHit.normal.lengthNoSqrt() <= 0){
        closestHit.normal.set(0, 1);
    }

    return {
        point: closestHit.point,
        normal: closestHit.normal,
        collisions,
    };
}

function holeCheck(point: Readonly<Vector>, worldInstances: Instance_Base[], velocity: Readonly<Vector>): {start: Vector, direction: Vector} | null {
    /*
        General Idea:
            - If the player is aligned to one axis (i.e. they are butting up against a wall, floor, or ceiling)
            - Round the position to the nearest tile grid point, and cast 3 rays in the direction perpendicular with the axis
              they're aligned with
            - If the center ray (ctr) hits, but one of the adjacent rays (ra, rb) are blocked, then there must be a hole
            - If there is a hole, then return the direction and rounded position so we can do a second move at a new starting point
    */
    const xAligned = point.x % 16 == 0;
    const yAligned = point.y % 16 == 0;

    //Only continue if we are aligned to an axis
    if (!(xAligned || yAligned)) return null;

    const ctr = point.clone().scale(INV_SPR_DIM).round().scale(Sprite.DIMENSIONS);
    const deltaCheck = ctr.distanceNoSqrt(point) < 2;

    //Only check for holes if we're close enough to them
    if (!deltaCheck) return null;

    const ra = ctr.clone();
    const rb = ctr.clone();
    let ray: Vector;

    //Offset side rays
    if (xAligned){
        ray = new Vector(Math.sign(velocity.x), 0);
        ra.y += 16;
        rb.y -= 16;
    }
    else{
        ray = new Vector(0, Math.sign(velocity.y));
        ra.x += 16;
        rb.x -= 16;
    }

    //Cast all rays and check result
    const cRes = raycast(ctr, worldInstances, ray);
    const aRes = raycast(ra, worldInstances, ray);
    const bRes = raycast(rb, worldInstances, ray);
    
    if (!cRes.length && (aRes.length || bRes.length)){
        return {start: ctr, direction: ray};
    }

    return null;
}

export function moveAndSlide(startPoint: Readonly<Vector>, worldInstances: Instance_Base[], velocity: Readonly<Vector>): MoveResult {
    const moveResult = move(startPoint, worldInstances, velocity);
    
    //Calculate adjusted velocity
    if (moveResult.collisions.length > 0 && velocity.x != 0 && velocity.y != 0){
        //Detect and adjust for holes
        const holeRes = holeCheck(moveResult.point, worldInstances, velocity);

        if (holeRes){
            const correctedRes = move(holeRes.start, worldInstances, velocity.clone().multiply(holeRes.direction));
            moveResult.point = correctedRes.point;
            moveResult.normal = new Vector(holeRes.direction.y, holeRes.direction.x);
        }

        //slide
        const oldDesiredDest = startPoint.clone().add(velocity);
        const newDesiredDest = Util.projectPointOnLine(oldDesiredDest, moveResult.point, moveResult.normal);
        const newDesiredVelocity = newDesiredDest.subtract(moveResult.point);
        const newResult = move(moveResult.point, worldInstances, newDesiredVelocity);

        moveResult.point = newResult.point;
        moveResult.normal = newResult.normal;
        moveResult.collisions.push(...newResult.collisions);
    }

    return moveResult;
}