import {
    Vector,
    Sprite,
    Instance_Base,
    Util,
} from './core/core';

interface iLineIntersection {
    point: Vector;
    normal: Vector;
    instance: Instance_Base;
}

function findInstancePathIntersections(
    instance: Instance_Base,
    instanceList: Instance_Base[],
    instanceCenter: Vector,
    normalizedVelocity: Vector,
    destination: Vector,
) {
    const intersections: iLineIntersection[] = [];
    let hitSolid = false;
    
    for (let i = 0; i < instanceList.length; i++){
        const curInstance = instanceList[i];

        if (curInstance.id == instance.id) continue;
        
        const center = curInstance.pos.clone().addScalar(Sprite.DIMENSIONS / 2);
        const ul = new Vector(-Sprite.DIMENSIONS, Sprite.DIMENSIONS).add(center);
        const br = new Vector(Sprite.DIMENSIONS, -Sprite.DIMENSIONS).add(center);
        const boundsIntersections = Util.lineBoxIntersection(instanceCenter, destination, ul, br);

        boundsIntersections.forEach(i => {
            const similarDirection = i.normal.dot(normalizedVelocity) >= 0;
            const cornerSnag = +i.point.equalTo(i.lineSegment[0]) ^ +i.point.equalTo(i.lineSegment[1]);
            if (similarDirection || cornerSnag) return;

            intersections.push({point: i.point, normal: i.normal, instance: curInstance});
        });

        hitSolid ||= intersections.length > 0 && curInstance.isSolid;
    }

    return {intersections, hitSolid};
}

function getPathCollisions(
    instance: Instance_Base,
    instanceList: Instance_Base[],
    instanceCenter: Vector,
    normalizedVelocity: Vector,
    destination: Vector
){
    const { intersections, hitSolid } = findInstancePathIntersections(instance, instanceList, instanceCenter, normalizedVelocity, destination);
    const collisions = new Map<number, typeof intersections[number]>();
    let closestIntersect: (typeof intersections[number]) | null = null;
    let closestDist: number = Infinity;
    
    for (let i = 0; i < intersections.length; i++){
        const curIntersect = intersections[i];
        const curDist = curIntersect.point.distanceNoSqrt(instanceCenter);

        if (curDist < closestDist){
            closestIntersect = curIntersect;
            closestDist = curDist;
        }
    }

    //find all collisions that also occur at the closest point
    for (let i = 0; closestIntersect && i < intersections.length; i++){
        const curIntersect = intersections[i];

        if (curIntersect.point.equalTo(closestIntersect.point)){
            collisions.set(curIntersect.instance.id, curIntersect);
        }
    }

    return {collisionIntersect: closestIntersect, collisions: collisions, hitSolid };
}

export function sweepInstanceInDirection(
    instance: Instance_Base,
    instanceCenter: Vector,
    instanceList: Instance_Base[],
    velocity: Vector,
    slide: boolean
): { newPosition: Vector, collisions: Map<number, iLineIntersection> } {
    const normalizedVelocity = velocity.clone().normalize();
    const destination = instanceCenter.clone().add(velocity);
    const { collisionIntersect, collisions, hitSolid } = getPathCollisions(instance, instanceList, instanceCenter, normalizedVelocity, destination);

    if (!(collisionIntersect && hitSolid && instance.isSolid)){
        return {
            newPosition: instance.pos.clone().add(velocity),
            collisions: collisions
        };
    }

    if (slide){
        //flatten velocity along the surface and do second collision pass
        const clippedDest = Util.projectPointOnLine(destination, collisionIntersect.point, collisionIntersect.normal);
        const newVel = clippedDest.subtract(instanceCenter);
        const {
            newPosition,
            collisions: newCollisions,
        } = sweepInstanceInDirection(instance, instanceCenter, instanceList, newVel, false);

        newCollisions.forEach((c, id) => collisions.set(id, c));

        return { newPosition, collisions };
    }
    else{
        const clipVel = normalizedVelocity.multiplyScalar(instanceCenter.distanceTo(collisionIntersect.point));
        return {
            newPosition: clipVel.add(instance.pos),
            collisions,
        };
    }
}