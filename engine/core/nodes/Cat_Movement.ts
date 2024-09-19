import { iNodeTemplate } from "./iNodeTemplate";
import {SOCKET_TYPE, WIDGET} from './Node_Enums';
import { ConstVector, Vector } from '../Vector';
import { iEditorNode, iEngineNode, iEventContext } from '../LogicInterfaces';
import { Instance_Base, Sprite, Util, Node_Enums } from '../core';

const catMovement: iNodeTemplate[] = [];
export default catMovement;

{// Set Position
    function setPosition(this: iEngineNode, eventContext: iEventContext): void {
        const instance = this.throwOnNullInput<Instance_Base | null>('instance', eventContext, 'null_instance', false) ?? eventContext.instance;
        const xInp = this.getInput<number & string>('x', eventContext);
        const yInp = this.getInput<number & string>('y', eventContext);
        const relative = this.getInput<boolean>('relative', eventContext);
        let newPos: Vector;

        if (instance == Node_Enums.THROWN){
            this.triggerOutput('_o', eventContext);
            return;
        }

        if (relative){
            const offset = new Vector(
                xInp === '' ? 0 : xInp,
                yInp === '' ? 0 : yInp
            );
            newPos = offset.add(instance.pos);
        }
        else{
            newPos = new Vector(
                xInp === '' ? instance.pos.x : xInp,
                yInp === '' ? instance.pos.y : yInp
            );
        }

        this.engine.setInstancePosition(eventContext.instance, newPos);
        
        this.triggerOutput('_o', eventContext);
    }

    const setPostionNode = {
        id: 'set_position',
        category: 'movement',
        inTriggers: [
            {id: '_i', execute: setPosition},
        ],
        outTriggers: ['_o'],
        inputs: [
            {id: 'instance', type: SOCKET_TYPE.INSTANCE, default: null, required: true},
            {id: 'x', type: SOCKET_TYPE.NUMBER, default: '', required: false},
            {id: 'y', type: SOCKET_TYPE.NUMBER, default: '', required: false},
            {id: 'relative', type: SOCKET_TYPE.BOOL, default: false},
        ],
    };
    catMovement.push(setPostionNode);
}

{// Jump To
    function jumpTo(this: iEngineNode, eventContext: iEventContext): void {
        const halfDim = Sprite.DIMENSIONS / 2;
        const instance = this.throwOnNullInput<Instance_Base | null>('instance', eventContext, 'null_instance', false) ?? eventContext.instance;
        const x = Math.round(this.getInput<number>('x', eventContext));
        const y = Math.round(this.getInput<number>('y', eventContext));
        const relative = this.getInput<boolean>('relative', eventContext);

        if (instance == Node_Enums.THROWN){
            this.triggerOutput('_o', eventContext);
            return;
        }

        const desiredDest = relative ? new Vector(x, y).add(instance.pos) : new Vector(x, y).subtractScalar(halfDim);

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
        const checkDim = new Vector(Sprite.DIMENSIONS, Sprite.DIMENSIONS).subtractScalar(NORM_OFFSET); //boxes are made slightly smaller to allow for 1 tile wide paths
        const velocity = desiredDest.clone().subtract(instance.pos);
        const nearBodies = this.engine.room.getInstancesInRadius(instance.pos, velocity.length())
            .filter(i => {
                const selfCheck = i.id != instance.id;
                return selfCheck && i.isSolid;
            });
        
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

            if (checkDist < nearestDist){
                nearestDist = checkDist;
                nearestDest = raycastResult.point;
                nearestCastResult = raycastResult;
            }
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

    function checkExitBacktrack(this: iEngineNode, eventContext: iEventContext, newPos: ConstVector): boolean {
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
        category: 'movement',
        inTriggers: [
            {id: '_i', execute: jumpTo},
        ],
        outTriggers: ['_o'],
        inputs: [
            {id: 'instance', type: SOCKET_TYPE.INSTANCE, default: null, required: true},
            {id: 'x', type: SOCKET_TYPE.NUMBER, default: 0, required: true},
            {id: 'y', type: SOCKET_TYPE.NUMBER, default: 0, required: true},
            {id: 'relative', type: SOCKET_TYPE.BOOL, default: false},
        ],
    };
    catMovement.push(jumpToNode);
}

{// Set Velocity
    function setVelocity(this: iEngineNode, eventContext: iEventContext): void {
        const instance = this.throwOnNullInput<Instance_Base | null>('instance', eventContext, 'null_instance', false) ?? eventContext.instance;
        const speed = this.getInput<number>('speed', eventContext);
        const direction = Vector.fromArray(this.widgetData);

        if (instance != Node_Enums.THROWN){
            instance.velocity.copy(direction.multiplyScalar(speed));
        }

        this.triggerOutput('_o', eventContext);
    }

    const setVelocityNode = {
        id: 'set_velocity',
        category: 'movement',
        widget: {
            id: 'direction',
            type: WIDGET.DIRECTION,
            options: {
                startDir: [1, 0],
            },
        },
        inTriggers: [
            {id: '_i', execute: setVelocity}
        ],
        outTriggers: ['_o'],
        inputs: [
            {id: 'instance', type: SOCKET_TYPE.INSTANCE, default: null, required: true},
            {id: 'speed', type: SOCKET_TYPE.NUMBER, default: 10, required: true},
        ],
    };
    catMovement.push(setVelocityNode);
}

{// Move Direction
    function moveDirection(this: iEngineNode, eventContext: iEventContext): void {
        const instance = this.throwOnNullInput<Instance_Base | null>('instance', eventContext, 'null_instance', false) ?? eventContext.instance;
        const speed = this.getInput<number>('speed', eventContext);
        const direction = Vector.fromArray(this.widgetData);
        const velocity = direction.scale(speed);

        if (instance != Node_Enums.THROWN){
            instance.moveVector.add(velocity);
        }

        this.triggerOutput('_o', eventContext);
    }

    const moveDirectionNode = {
        id: 'move_direction',
        category: 'movement',
        widget: {
            id: 'direction',
            type: WIDGET.DIRECTION,
            options: {
                startDir: [1, 0],
            },
        },
        inTriggers: [
            {id: '_i', execute: moveDirection},
        ],
        outTriggers: ['_o'],
        inputs: [
            {id: 'instance', type: SOCKET_TYPE.INSTANCE, default: null, required: true},
            {id: 'speed', type: SOCKET_TYPE.NUMBER, default: 1, required: true},
        ],
    };
    catMovement.push(moveDirectionNode);
}

{// Push Direction
    function push(this: iEngineNode, eventContext: iEventContext): void {
        const instance = this.throwOnNullInput<Instance_Base | null>('instance', eventContext, 'null_instance', false) ?? eventContext.instance;
        const strength = this.getInput<number>('strength', eventContext);
        const force = Vector.fromArray(this.widgetData).scale(strength);

        if (instance != Node_Enums.THROWN){
            instance.applyForce(force);
        }

        this.triggerOutput('_o', eventContext);
    }

    const pushDirection = {
        id: 'push_direction',
        category: 'movement',
        widget: {
            id: 'direction',
            type: WIDGET.DIRECTION,
            options: {
                startDir: [1, 0],
            },
        },
        inTriggers: [
            {id: '_i', execute: push},
        ],
        outTriggers: ['_o'],
        inputs: [
            {id: 'instance', type: SOCKET_TYPE.INSTANCE, default: null, required: true},
            {id: 'strength', type: SOCKET_TYPE.NUMBER, default: 1, required: true},
        ],
    };
    catMovement.push(pushDirection);
}

{// Is On Ground
    function onGround(this: iEngineNode, eventContext: iEventContext): boolean {
        return eventContext.instance.onGround;
    }

    const isOnGround = {
        id: 'is_on_ground',
        category: 'movement',
        outputs: [
            {id: '_o', type: SOCKET_TYPE.BOOL, execute: onGround},
        ],
    };
    catMovement.push(isOnGround);
}

{// Get Position
    function getX(this: iEngineNode, eventContext: iEventContext): number {
        const instance = this.throwOnNullInput<Instance_Base | null>('instance', eventContext, 'null_instance', true) ?? eventContext.instance;
        return instance.pos.x;
    }

    function getY(this: iEngineNode, eventContext: iEventContext): number {
        const instance = this.throwOnNullInput<Instance_Base | null>('instance', eventContext, 'null_instance', true) ?? eventContext.instance;
        return instance.pos.y;
    }

    const getPosition = {
        id: 'get_position',
        category: 'movement',
        onBeforeMount(this: iEditorNode){
            this.stackDataIO = true;
        },
        inputs: [
            {id: 'instance', type: SOCKET_TYPE.INSTANCE, default: null, required: true},
        ],
        outputs: [
            {id: 'x', type: SOCKET_TYPE.NUMBER, execute: getX},
            {id: 'y', type: SOCKET_TYPE.NUMBER, execute: getY},
        ],
    };
    catMovement.push(getPosition);
}

{// Get Velocity
    function getX(this: iEngineNode, eventContext: iEventContext): number {
        const instance = this.throwOnNullInput<Instance_Base | null>('instance', eventContext, 'null_instance', true) ?? eventContext.instance;
        return instance.totalVelocity.x;
    }

    function getY(this: iEngineNode, eventContext: iEventContext): number {
        const instance = this.throwOnNullInput<Instance_Base | null>('instance', eventContext, 'null_instance', true) ?? eventContext.instance;
        return instance.totalVelocity.y;
    }

    const getVelocity = {
        id: 'get_velocity',
        category: 'movement',
        onBeforeMount(this: iEditorNode){
            this.stackDataIO = true;
        },
        inputs: [
            {id: 'instance', type: SOCKET_TYPE.INSTANCE, default: null, required: true},
        ],
        outputs: [
            {id: 'x', type: SOCKET_TYPE.NUMBER, execute: getX},
            {id: 'y', type: SOCKET_TYPE.NUMBER, execute: getY},
        ],
    };
    catMovement.push(getVelocity);
}

{// Get Distance
    function getDistance(this: iEngineNode, eventContext: iEventContext): number {
        const x1 = this.getInput<number>('x1', eventContext);
        const y1 = this.getInput<number>('y1', eventContext);
        const x2 = this.getInput<number>('x2', eventContext);
        const y2 = this.getInput<number>('y2', eventContext);
        const dx = x1 - x2;
        const dy = y1 - y2;

        return Math.sqrt(dx * dx + dy * dy);
    }

    const getDistanceNode = {
        id: 'get_distance',
        category: 'movement',
        inputs: [
            {id: 'x1', type: SOCKET_TYPE.NUMBER, default: 0},
            {id: 'y1', type: SOCKET_TYPE.NUMBER, default: 0},
            {id: 'x2', type: SOCKET_TYPE.NUMBER, default: 0},
            {id: 'y2', type: SOCKET_TYPE.NUMBER, default: 0},
        ],
        outputs: [
            {id: 'distance', type: SOCKET_TYPE.NUMBER, execute: getDistance},
        ],
    };
    catMovement.push(getDistanceNode);
}

{// Set Physics
    function setPhysics(this: iEngineNode, eventContext: iEventContext): void {
        const instance = this.throwOnNullInput<Instance_Base | null>('instance', eventContext, 'null_instance', false) ?? (eventContext.instance as Instance_Base);
        const solid = this.getInput<boolean | null>('solid', eventContext);
        const gravity = this.getInput<boolean | null>('gravity', eventContext);

        if (instance == Node_Enums.THROWN){
            this.triggerOutput('_o', eventContext);
            return;
        }

        if (solid != null){
            instance.isSolid = solid;
        }

        if (gravity != null){
            instance.applyGravity = gravity;
        }

        this.triggerOutput('_o', eventContext);
    }

    const setPhysicsNode = {
        id: 'set_physics',
        category: 'movement',
        inTriggers: [
            {id: '_i', execute: setPhysics},
        ],
        outTriggers: ['_o'],
        inputs: [
            {id: 'instance', type: SOCKET_TYPE.INSTANCE, default: null, required: true},
            {id: 'solid', type: SOCKET_TYPE.BOOL, triple: true, default: null},
            {id: 'gravity', type: SOCKET_TYPE.BOOL, triple: true, default: null},
        ],
    };
    catMovement.push(setPhysicsNode);
}