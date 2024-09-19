import {SOCKET_TYPE, WIDGET, COLLISION_EVENT} from './Node_Enums';
import { iNodeTemplate } from './iNodeTemplate';
import { iEngineNode, iEventContext } from '../LogicInterfaces';
import { MOUSE_EVENT } from '../Enums';
import { Vector } from '../Vector';
import { isEngineNode } from './Node_Library';
import { type GenericNode } from './Node_Library';
import { Instance_Base, InstanceAnimEvent } from '../core';

const catEvents: iNodeTemplate[] = [];
export default catEvents;

{// Create
    const create = {
        id: 'e_create',
        isEvent: true,
        category: 'events',
        outTriggers: ['_o'],
    };
    catEvents.push(create);
}

{// Update
    function getDelta(this: iEngineNode): number {
        return this.engine.deltaTime;
    }

    const update = {
        id: 'e_update',
        isEvent: true,
        category: 'events',
        outTriggers: ['_o'],
        outputs: [
            {id: 'delta_time', type: SOCKET_TYPE.NUMBER, execute: getDelta},
        ],
    };
    catEvents.push(update);
}

{// Mouse Button
    type NodeData = {
        lastData: {
            type: MOUSE_EVENT.DOWN | MOUSE_EVENT.UP,
            buttons: number,
            pos: Vector,
            instances: Instance_Base[],
        } | undefined,
        downPos: Vector | undefined,
    };

    function which(this: iEngineNode): number {
        const eventData = this.getNodeData<NodeData>().lastData;
        return eventData?.buttons ?? 0;
    }

    function x(this: iEngineNode): number {
        const eventData = this.getNodeData<NodeData>().lastData;
        return eventData?.pos.x ?? 0;
    }

    function y(this: iEngineNode): number {
        const eventData = this.getNodeData<NodeData>().lastData;
        return eventData?.pos.y ?? 0;
    }

    function object(this: iEngineNode): Instance_Base | null {
        const eventData = this.getNodeData<NodeData>().lastData;
        return eventData?.instances[0] ?? null;
    }

    const mouseBtn = {
        id: 'e_mouse_button',
        isEvent: true,
        category: 'events',
        outTriggers: ['button_down', 'button_up', 'button_click'],
        outputs: [
            {id: 'which_button', type: SOCKET_TYPE.NUMBER, execute: which},
            {id: 'x_pos', type: SOCKET_TYPE.NUMBER, execute: x},
            {id: 'y_pos', type: SOCKET_TYPE.NUMBER, execute: y},
            {id: 'object', type: SOCKET_TYPE.INSTANCE, execute: object},
        ],
        init(this: GenericNode){
            if (!isEngineNode(this)) return;
            this.setNodeData<NodeData>({
                lastData: undefined,
                downPos: undefined,
            });
        },
        execute(this: iEngineNode, eventContext: iEventContext, data: any){
            const lBtn = !!(data.buttons & 0b001);
            const mBtn = !!(data.buttons & 0b010);
            const rBtn = !!(data.buttons & 0b100);

            if (lBtn) data.button = 1;
            if (mBtn) data.button = 2;
            if (rBtn) data.button = 3;

            this.getNodeData<NodeData>().lastData = data;

            if (data.type == MOUSE_EVENT.DOWN){
                this.getNodeData<NodeData>().downPos = data.pos.clone();
                this.triggerOutput('button_down', eventContext);
            }
            else if (data.type == MOUSE_EVENT.UP){
                const downPos = this.getNodeData<NodeData>().downPos;

                if (downPos && downPos.equalTo(data.pos)){
                    this.triggerOutput('button_click', eventContext);
                }
                else{
                    this.triggerOutput('button_up', eventContext);
                }
            }
        },
    };
    catEvents.push(mouseBtn);
}

{// Mouse Move
    function x(this: iEngineNode): number {
        return this.engine.mouse.pos.x;
    }

    function y(this: iEngineNode): number {
        return this.engine.mouse.pos.y;
    }

    const mouseMove = {
        id: 'e_mouse_move',
        isEvent: true,
        category: 'events',
        outTriggers: ['_o'],
        outputs: [
            {id: 'x_pos', type: SOCKET_TYPE.NUMBER, execute: x},
            {id: 'y_pos', type: SOCKET_TYPE.NUMBER, execute: y},
        ],
    };
    catEvents.push(mouseMove);
}

{// Keyboard
    const keyboard = {
        id: 'e_keyboard',
        isEvent: true,
        category: 'events',
        widget: {
            id: 'key_selector',
            type: WIDGET.KEY,
        },
        outTriggers: ['key_down', 'key_pressed', 'key_up'],
        execute(this: iEngineNode, eventContext: iEventContext, data: KeyboardEvent){
            const {code} = this.getWidgetData();

            if (data.code == code){
                switch (data.type){
                    case 'down':
                        this.triggerOutput('key_down', eventContext);
                        break;
                    case 'pressed':
                        this.triggerOutput('key_pressed', eventContext);
                        break;
                    case 'up':
                        this.triggerOutput('key_up', eventContext);
                        break;
                }
            }
        },
    };
    catEvents.push(keyboard);
}

{// Collision
    type NodeData = Map<number, any>;

    function getObject(this: iEngineNode, eventContext: iEventContext): Instance_Base | null {
        const nodeData = this.getNodeData<NodeData>().get(eventContext.eventKey);
        return nodeData?.instance ?? null;
    }

    const collision = {
        id: 'e_collision',
        isEvent: true,
        category: 'events',
        outTriggers: ['start', 'repeat', 'stop'],
        outputs: [
            {id: 'object', type: SOCKET_TYPE.INSTANCE, execute: getObject},
        ],
        init(this: GenericNode){
            if (isEngineNode(this)) {
                this.setNodeData<NodeData>(new Map());
                return;
            }
            
            this.stackDataIO = true;
        },
        execute(this: iEngineNode, eventContext: iEventContext, data: any){
            //Dispatch collision event
            this.getNodeData<NodeData>().set(eventContext.eventKey, data);

            switch (data.type){
                case COLLISION_EVENT.START:
                    this.triggerOutput('start', eventContext);
                    break;
                case COLLISION_EVENT.REPEAT:
                    this.triggerOutput('repeat', eventContext);
                    break;
                case COLLISION_EVENT.STOP:
                    this.triggerOutput('stop', eventContext);
                    break;
            }

            this.getNodeData<NodeData>().delete(eventContext.eventKey);
        },
    };
    catEvents.push(collision);
}

{// Animation
    function getPlaying(this: iEngineNode, eventContext: iEventContext): boolean {
        return eventContext.instance.animPlaying;
    }

    function getFrame(this: iEngineNode, eventContext: iEventContext): number {
        return eventContext.instance.animFrame;
    }

    function getFPS(this: iEngineNode, eventContext: iEventContext): number {
        return eventContext.instance.fps;
    }

    const animation = {
        id: 'e_animation',
        isEvent: true,
        category: 'events',
        outputs: [
            {id: 'is_playing', type: SOCKET_TYPE.BOOL, execute: getPlaying},
            {id: 'frame', type: SOCKET_TYPE.NUMBER, execute: getFrame},
            {id: 'fps', type: SOCKET_TYPE.NUMBER, execute: getFPS},
        ],
        outTriggers: ['start', 'stop', 'tick', 'finished'],
        execute(this: iEngineNode, eventContext: iEventContext, data: InstanceAnimEvent){
            switch(data){
                case InstanceAnimEvent.START:
                    this.triggerOutput('start', eventContext);
                    break;
                case InstanceAnimEvent.STOP:
                    this.triggerOutput('stop', eventContext);
                    break;
                case InstanceAnimEvent.TICK:
                    this.triggerOutput('tick', eventContext);
                    break;
                case InstanceAnimEvent.FINISHED:
                    this.triggerOutput('finished', eventContext);
                    break;
            }
        },
    };
    catEvents.push(animation);
}

{// Message
    const message = {
        id: 'e_message',
        isEvent: true,
        category: 'events',
        outTriggers: ['_o'],
        inputs: [
            {id: 'name', type: SOCKET_TYPE.STRING, flipInput: true, hideSocket: true},
        ],
        init(this: GenericNode){
            if (!isEngineNode(this)){
                this.inputBoxWidth = 6;
            }
        },
        execute(this: iEngineNode, eventContext: iEventContext, data: any){
            const name = this.getInput<string>('name', eventContext);

            if (name.trim().length < 0) return;
            
            if (data.name == name){
                this.triggerOutput('_o', eventContext);
            }
        },
    };
    catEvents.push(message);
}
