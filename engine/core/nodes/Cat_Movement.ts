import { Vec2 } from "linearz";
import { iInput, iNodeTemplate } from "./iNodeTemplate";
import { SOCKET_TYPE } from './Node_Enums';
import { iEditorNode, iEngineNode, iEventContext } from '@engine/core/LogicInterfaces';
import { Instance_Base, Sprite, Util, Node_Enums, WidgetDirection, Instance_Object } from '@engine/core/core';
import { WIDGET_TYPE } from "@engine/core/core";

const catMovement: iNodeTemplate[] = [];
const category = 'movement';

export default catMovement;

{// Set Position
    const instInp = {id: 'instance', type: SOCKET_TYPE.INSTANCE, default: null} as const satisfies iInput;
    const xInp = {id: 'x', type: SOCKET_TYPE.NUMBER, default: null, optional: true} as const satisfies iInput;
    const yInp = {id: 'y', type: SOCKET_TYPE.NUMBER, default: null, optional: true} as const satisfies iInput;
    const relInp = {id: 'relative', type: SOCKET_TYPE.BOOL, default: false} as const satisfies iInput;

    function setPosition(this: iEngineNode, eventContext: iEventContext): void {
        const instanceVal = this.throwOnNullInput(instInp, eventContext, 'null_instance') ?? eventContext.instance;
        const xInpVal = this.getOptionalInput(xInp, eventContext);
        const yInpVal = this.getOptionalInput(yInp, eventContext);
        const relativeVal = this.getInput(relInp, eventContext);
        let newPos: Vec2;

        if (instanceVal == Node_Enums.THROWN){
            this.triggerOutput('_o', eventContext);
            return;
        }

        if (relativeVal){
            const offset = new Vec2(
                xInpVal ?? 0,
                yInpVal ?? 0
            );
            newPos = offset.add(instanceVal.pos);
        }
        else{
            newPos = new Vec2(
                xInpVal ?? instanceVal.pos.x,
                yInpVal ?? instanceVal.pos.y
            );
        }

        this.engine.setInstancePosition(eventContext.instance, newPos);

        this.triggerOutput('_o', eventContext);
    }

    const setPositionNode = {
        id: 'set_position',
        category,
        inTriggers: [
            {id: '_i', execute: setPosition},
        ],
        outTriggers: ['_o'],
        inputs: [
            instInp,
            xInp,
            yInp,
            relInp,
        ],
    } as const satisfies iNodeTemplate;
    catMovement.push(setPositionNode);
}

{// Jump To
    const instInp = {id: 'instance', type: SOCKET_TYPE.INSTANCE, default: null} as const satisfies iInput;
    const xInp = {id: 'x', type: SOCKET_TYPE.NUMBER, default: 0} as const satisfies iInput;
    const yInp = {id: 'y', type: SOCKET_TYPE.NUMBER, default: 0} as const satisfies iInput;
    const relativeInp = {id: 'relative', type: SOCKET_TYPE.BOOL, default: false} as const satisfies iInput;

    function jumpTo(this: iEngineNode, eventContext: iEventContext): void {
        const halfDim = Sprite.DIMENSIONS / 2;
        const instance = this.throwOnNullInput(instInp, eventContext, 'null_instance', false) ?? eventContext.instance;
        const x = Math.round(this.getInput(xInp, eventContext));
        const y = Math.round(this.getInput(yInp, eventContext));
        const relative = this.getInput(relativeInp, eventContext);

        if (instance == Node_Enums.THROWN){
            this.triggerOutput('_o', eventContext);
            return;
        }

        const desiredDest = relative ? new Vec2(x, y).add(instance.pos) : new Vec2(x, y).subtractScalar(halfDim);

        //jump if no collision on instance
        if (!instance.isSolid){
            this.engine.setInstancePosition(instance, desiredDest);
            this.triggerOutput('_o', eventContext);
            return;
        }

        //round starting position to nearest integer
        instance.pos.round();

        //setup raycast check
        const NORM_OFFSET = 0.0001;
        const instCenter = instance.pos.clone().addScalar(halfDim);
        const checkDim = new Vec2(Sprite.DIMENSIONS, Sprite.DIMENSIONS).subtractScalar(NORM_OFFSET); //boxes are made slightly smaller to allow for 1 tile wide paths
        const velocity = desiredDest.clone().subtract(instance.pos);
        const nearBodies = this.engine.room.getInstancesInRadius(instance.pos, velocity.length())
            .filter(i => {
                const selfCheck = i.id != instance.id;
                return selfCheck && i.isSolid;
            });
        const raycastBodies: {body: Instance_Base, checkDist: number}[] = [];

        let nearestDist = instance.pos.distanceNoSqrt(desiredDest);
        let nearestDest = desiredDest.addScalar(halfDim);
        let nearestCastResult: ReturnType<typeof Util.projectSVF> | null = null;

        //raycast against all instances in vacinity using minkowski addition
        for (let i = 0; i < nearBodies.length; i++){
            const curBody = nearBodies[i];
            const curCenter = curBody.pos.clone().addScalar(halfDim);
            const raycastResult = Util.projectSVF(instCenter, velocity, curCenter, checkDim);

            if (!raycastResult) continue;

            const checkDist = instCenter.distanceNoSqrt(raycastResult.point);

            //keep track of which objects might possibly be overlapping
            if (checkDist <= nearestDist){
                raycastBodies.push({
                    body: curBody,
                    checkDist,
                });
            }

            if (checkDist < nearestDist){
                nearestDist = checkDist;
                nearestDest = raycastResult.point;
                nearestCastResult = raycastResult;
            }
        }

        //register collisions
        for (let i = 0; i < raycastBodies.length; i++){
            const {body, checkDist} = raycastBodies[i];

            if (checkDist > nearestDist) continue;

            const normal = velocity.clone().normalize();
            this.engine.registerCollision(instance, body, normal);
            this.engine.registerCollision(body, instance, normal.clone().scale(-1));
        }

        //Check for backtrack through exit
        if (checkExitBacktrack.call(this, eventContext, nearestDest.clone().subtractScalar(halfDim))){
            this.triggerOutput('_o', eventContext);
            return;
        }

        //jump if no ray collisions
        if (!nearestCastResult){
            this.engine.setInstancePosition(instance, nearestDest.subtractScalar(halfDim));
            this.triggerOutput('_o', eventContext);
            return;
        }

        //final collision point is offset
        const normalOffset = nearestCastResult.normal.clone().scale(NORM_OFFSET);
        const finalDest = nearestDest
            .subtractScalar(halfDim)
            .add(normalOffset);

        //round single axis based on direction of collision normal
        finalDest.x = nearestCastResult.normal.x ? Math.round(finalDest.x) : finalDest.x;
        finalDest.y = nearestCastResult.normal.y ? Math.round(finalDest.y) : finalDest.y;

        //set instance position and continue to next node
        this.engine.setInstancePosition(instance, finalDest);
        this.triggerOutput('_o', eventContext);
    }

    function checkExitBacktrack(this: iEngineNode, eventContext: iEventContext, newPos: Readonly<Vec2>): boolean {
        if (!(eventContext.instance.prevExit && eventContext.instance.prevExit?.exit.detectBacktracking)) return false;

        const direction = newPos.clone().subtract(eventContext.instance.pos).normalize();
        const dot = direction.dot(eventContext.instance.prevExit.direction.clone().multiplyScalar(-1));

        if (dot > 0.75) {
            eventContext.instance.prevExit.exit.triggerExit(eventContext.instance, direction);
            return true;
        }

        return false;
    }

    const jumpToNode = {
        id: 'jump_to',
        category,
        inTriggers: [
            {id: '_i', execute: jumpTo},
        ],
        outTriggers: ['_o'],
        inputs: [
            instInp,
            xInp,
            yInp,
            relativeInp,
        ],
    } as const satisfies iNodeTemplate;
    catMovement.push(jumpToNode);
}

{// Set Velocity
    const instInp = {id: 'instance', type: SOCKET_TYPE.INSTANCE, default: null} as const satisfies iInput;
    const speedInp = {id: 'speed', type: SOCKET_TYPE.NUMBER, default: 10} as const satisfies iInput;

    function setVelocity(this: iEngineNode, eventContext: iEventContext): void {
        const instance = this.throwOnNullInput(instInp, eventContext, 'null_instance', false) ?? eventContext.instance;
        const speed = this.getInput(speedInp, eventContext);
        const direction = Vec2.fromArray(<WidgetDirection['widget']['data']>this.widgetData);

        if (instance != Node_Enums.THROWN){
            instance.velocity.copy(direction.multiplyScalar(speed));
        }

        this.triggerOutput('_o', eventContext);
    }

    const setVelocityNode = {
        id: 'set_velocity',
        category,
        widget: {
            type: WIDGET_TYPE.DIRECTION,
            options: {
                startDir: [1, 0],
            },
        },
        inTriggers: [
            {id: '_i', execute: setVelocity}
        ],
        outTriggers: ['_o'],
        inputs: [
            instInp,
            speedInp,
        ],
    } as const satisfies iNodeTemplate;
    catMovement.push(setVelocityNode);
}

{// Move Direction
    const instInp = {id: 'instance', type: SOCKET_TYPE.INSTANCE, default: null} as const satisfies iInput;
    const speedInp = {id: 'speed', type: SOCKET_TYPE.NUMBER, default: 1} as const satisfies iInput;

    function moveDirection(this: iEngineNode, eventContext: iEventContext): void {
        const instance = this.throwOnNullInput(instInp, eventContext, 'null_instance', false) ?? eventContext.instance;
        const speed = this.getInput(speedInp, eventContext);
        const direction = Vec2.fromArray(<WidgetDirection['widget']['data']>this.widgetData);
        const velocity = direction.scale(speed);

        if (instance != Node_Enums.THROWN){
            instance.moveVector.add(velocity);
        }

        this.triggerOutput('_o', eventContext);
    }

    const moveDirectionNode = {
        id: 'move_direction',
        category,
        widget: {
            type: WIDGET_TYPE.DIRECTION,
            options: {
                startDir: [1, 0],
            },
        },
        inTriggers: [
            {id: '_i', execute: moveDirection},
        ],
        outTriggers: ['_o'],
        inputs: [
            instInp,
            speedInp,
        ],
    } as const satisfies iNodeTemplate;
    catMovement.push(moveDirectionNode);
}

{// Push Direction
    const instInp = {id: 'instance', type: SOCKET_TYPE.INSTANCE, default: null} as const satisfies iInput;
    const strengthInp = {id: 'strength', type: SOCKET_TYPE.NUMBER, default: 1} as const satisfies iInput;

    function push(this: iEngineNode, eventContext: iEventContext): void {
        const instance = this.throwOnNullInput(instInp, eventContext, 'null_instance', false) ?? eventContext.instance;
        const strength = this.getInput(strengthInp, eventContext);
        const force = Vec2.fromArray(<WidgetDirection['widget']['data']>this.widgetData).scale(strength);

        if (instance != Node_Enums.THROWN){
            instance.applyForce(force);
        }

        this.triggerOutput('_o', eventContext);
    }

    const pushDirection = {
        id: 'push_direction',
        category,
        widget: {
            type: WIDGET_TYPE.DIRECTION,
            options: {
                startDir: [1, 0],
            },
        },
        inTriggers: [
            {id: '_i', execute: push},
        ],
        outTriggers: ['_o'],
        inputs: [
            instInp,
            strengthInp,
        ],
    } as const satisfies iNodeTemplate;
    catMovement.push(pushDirection);
}

{// Is On Ground
    function onGround(this: iEngineNode, eventContext: iEventContext): boolean {
        return eventContext.instance.onGround;
    }

    const isOnGround = {
        id: 'is_on_ground',
        category,
        outputs: [
            {id: '_o', type: SOCKET_TYPE.BOOL, execute: onGround},
        ],
    } as const satisfies iNodeTemplate;
    catMovement.push(isOnGround);
}

{// Get Position
    const instInp = {id: 'instance', type: SOCKET_TYPE.INSTANCE, default: null} as const satisfies iInput;

    function getX(this: iEngineNode, eventContext: iEventContext): number {
        const instance = this.throwOnNullInput(instInp, eventContext, 'null_instance', true) ?? eventContext.instance;
        return instance.pos.x;
    }

    function getY(this: iEngineNode, eventContext: iEventContext): number {
        const instance = this.throwOnNullInput(instInp, eventContext, 'null_instance', true) ?? eventContext.instance;
        return instance.pos.y;
    }

    const getPosition = {
        id: 'get_position',
        category,
        onBeforeMount(this: iEditorNode){
            this.stackDataIO = true;
        },
        inputs: [
            instInp,
        ],
        outputs: [
            {id: 'x', type: SOCKET_TYPE.NUMBER, execute: getX},
            {id: 'y', type: SOCKET_TYPE.NUMBER, execute: getY},
        ],
    } as const satisfies iNodeTemplate;
    catMovement.push(getPosition);
}

{// Get Velocity
    const insInp = {id: 'instance', type: SOCKET_TYPE.INSTANCE, default: null} as const satisfies iInput;

    function getX(this: iEngineNode, eventContext: iEventContext): number {
        const instance = (this.throwOnNullInput(insInp, eventContext, 'null_instance', true) ?? eventContext.instance);
        return instance.totalVelocity.x;
    }

    function getY(this: iEngineNode, eventContext: iEventContext): number {
        const instance = (this.throwOnNullInput(insInp, eventContext, 'null_instance', true) ?? eventContext.instance);
        return instance.totalVelocity.y;
    }

    const getVelocity = {
        id: 'get_velocity',
        category,
        onBeforeMount(this: iEditorNode){
            this.stackDataIO = true;
        },
        inputs: [
            insInp,
        ],
        outputs: [
            {id: 'x', type: SOCKET_TYPE.NUMBER, execute: getX},
            {id: 'y', type: SOCKET_TYPE.NUMBER, execute: getY},
        ],
    } as const satisfies iNodeTemplate;
    catMovement.push(getVelocity);
}

{// Get Distance
    const x1Inp = {id: 'x1', type: SOCKET_TYPE.NUMBER, default: 0} as const satisfies iInput;
    const y1Inp = {id: 'y1', type: SOCKET_TYPE.NUMBER, default: 0} as const satisfies iInput;
    const x2Inp = {id: 'x2', type: SOCKET_TYPE.NUMBER, default: 0} as const satisfies iInput;
    const y2Inp = {id: 'y2', type: SOCKET_TYPE.NUMBER, default: 0} as const satisfies iInput;

    function getDistance(this: iEngineNode, eventContext: iEventContext): number {
        const x1 = this.getInput(x1Inp, eventContext);
        const y1 = this.getInput(y1Inp, eventContext);
        const x2 = this.getInput(x2Inp, eventContext);
        const y2 = this.getInput(y2Inp, eventContext);
        const dx = x1 - x2;
        const dy = y1 - y2;

        return Math.sqrt(dx * dx + dy * dy);
    }

    const getDistanceNode = {
        id: 'get_distance',
        category,
        inputs: [
            x1Inp,
            y1Inp,
            x2Inp,
            y2Inp,
        ],
        outputs: [
            {id: 'distance', type: SOCKET_TYPE.NUMBER, execute: getDistance},
        ],
    } as const satisfies iNodeTemplate;
    catMovement.push(getDistanceNode);
}

{// Set Physics
    const instInp = {id: 'instance', type: SOCKET_TYPE.INSTANCE, default: null} as const satisfies iInput;
    const solidInp = {id: 'solid', type: SOCKET_TYPE.TRIPLE, default: null} as const satisfies iInput;
    const gravInp = {id: 'gravity', type: SOCKET_TYPE.TRIPLE, default: null} as const satisfies iInput;

    function setPhysics(this: iEngineNode, eventContext: iEventContext): void {
        const instance = this.throwOnNullInput(instInp, eventContext, 'null_instance', false) ?? eventContext.instance;
        const solid = this.getInput(solidInp, eventContext);
        const gravity = this.getInput(gravInp, eventContext);

        if (instance == Node_Enums.THROWN){
            this.triggerOutput('_o', eventContext);
            return;
        }

        const mutInstance = <Instance_Base>instance;

        if (solid != null){
            mutInstance.isSolid = solid;
        }

        if (gravity != null){
            mutInstance.applyGravity = gravity;
        }

        this.triggerOutput('_o', eventContext);
    }

    const setPhysicsNode = {
        id: 'set_physics',
        category,
        inTriggers: [
            {id: '_i', execute: setPhysics},
        ],
        outTriggers: ['_o'],
        inputs: [
            instInp,
            solidInp,
            gravInp,
        ],
    } as const satisfies iNodeTemplate;
    catMovement.push(setPhysicsNode);
}
