import { Instance_Base, Vector, Util, Sprite } from './core/core';

export type MoveResult = {
    point: Vector,
    normal: Vector,
    collisions: Instance_Base[],
}

export type RaycastResult = {
    point: Vector,
    normal: Vector,
    instance: Instance_Base,
}

export function raycast(pos: Vector, instanceList: Instance_Base[], velocity: Vector): RaycastResult[] {
    const collisionPos = new Vector(0, 0);
    const collisionDim = new Vector(Sprite.DIMENSIONS, Sprite.DIMENSIONS);
    const results: RaycastResult[] = [];

    if (velocity.lengthNoSqrt() <= 0) return [];

    for (let i = 0; i < instanceList.length; i++){
        collisionPos.copy(instanceList[i].pos);
        collisionPos.addScalar(8);
        const result = Util.projectSVF(pos, velocity, collisionPos, collisionDim);

        if (!result) continue;

        const { point, normal } = result;
        const normCheck = velocity.clone().normalize().dot(result?.normal);

        if (normCheck >= 0) continue;

        results.push({point, normal, instance: instanceList[i]});
    }

    return results;
}

export function move(startPoint: Vector, worldInstances: Instance_Base[], velocity: Vector): MoveResult {
    const velOffset = velocity.clone().normalize().scale(0.001);
    const instCenter = startPoint.clone().addScalar(8).add(velOffset);
    const rayHits = raycast(instCenter, worldInstances, velocity);

    if (rayHits.length <= 0){
        return {
            point: startPoint.clone().add(velocity),
            normal: new Vector(0, 0),
            collisions: [],
        };
    }

    //find nearest point
    let closest: RaycastResult = rayHits[0];

    {
        let closestDist = rayHits[0].point.distanceNoSqrt(instCenter);

        for (let i = 0; i < rayHits.length; i++){
            const checkDist = rayHits[i].point.distanceNoSqrt(instCenter);

            if (checkDist < closestDist){
                closestDist = checkDist;
                closest = rayHits[i];
            }
        }
    }

    if (closest.normal.lengthNoSqrt() <= 0){
        closest.normal.set(0, 1);
    }

    return {
        point: closest.point.subtractScalar(8),
        normal: closest.normal,
        collisions: rayHits.map(h => h.instance),
    };
}

export function moveAndSlide(startPoint: Vector, worldInstances: Instance_Base[], velocity: Vector): MoveResult {
    const moveResult = move(startPoint, worldInstances, velocity);

    //Calculate adjusted velocity
    if (moveResult.collisions.length > 0){
        const oldDesiredDest = startPoint.clone().add(velocity);
        const newDesiredDest = Util.projectPointOnLine(oldDesiredDest, moveResult.point, moveResult.normal);
        const newDesiredVelocity = newDesiredDest.subtract(moveResult.point);
        const newDest = move(moveResult.point, worldInstances, newDesiredVelocity);

        if (isNaN(newDest.point.x) || isNaN(newDest.point.y)){
            debugger;
        }

        moveResult.point.copy(newDest.point);
        moveResult.normal.copy(newDest.normal);
        moveResult.collisions.push(...newDest.collisions);
    }

    return moveResult;
}