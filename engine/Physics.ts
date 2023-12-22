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

export function raycast(pos: Vector, instanceList: Instance_Base[], velocity: Vector): RaycastResult[] {
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

export function move(startPoint: Vector, worldInstances: Instance_Base[], velocity: Vector): MoveResult {
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

export function moveAndSlide(startPoint: Vector, worldInstances: Instance_Base[], velocity: Vector): MoveResult {
    const moveResult = move(startPoint, worldInstances, velocity);
    
    //Calculate adjusted velocity
    if (moveResult.collisions.length > 0 && velocity.x != 0 && velocity.y != 0){
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