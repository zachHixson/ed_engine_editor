import { Vec2 } from 'linearz';
import { SOCKET_TYPE, COLLISION_EVENT } from './Node_Enums';
import { KEY_STATE } from '@engine/core/Enums';
import { iInput, iNodeTemplate } from './iNodeTemplate';
import { iEngineNode, iEventContext } from '@engine/core/LogicInterfaces';
import { MOUSE_EVENT } from '../Enums';
import { isEngineNode } from './Node_Library';
import { type GenericNode } from './Node_Library';
import { Instance_Base, InstanceAnimEvent } from '@engine/core/core';
import { WIDGET_TYPE, type WidgetKey } from './Widget';

const catEvents: iNodeTemplate[] = [];
const category = 'events';

export default catEvents;

{// Create
    const create = {
        id: 'e_create',
        isEvent: true,
        category,
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
        category,
        outTriggers: ['_o'],
        outputs: [
            {id: 'delta_time', type: SOCKET_TYPE.NUMBER, execute: getDelta},
        ],
    };
    catEvents.push(update);
}

const E_MOUSE_BUTTON_ID = 'e_mouse_button' as const;

export type E_MOUSE_BUTTON = {
    id: typeof E_MOUSE_BUTTON_ID;
    data: {
        type: MOUSE_EVENT.DOWN | MOUSE_EVENT.UP,
        buttons: number,
        pos: Vec2,
        instances: Instance_Base[],
    };
};

{// Mouse Button
    const enum OT {
        DOWN = 'button_down',
        UP = 'button_up',
        CLICK = 'button_click'
    };

    type NodeData = {
        lastData: E_MOUSE_BUTTON['data'] | null,
        downPos: Vec2 | null,
    };

    const btnMap: Record<number, number> = {
        2: 3,
        4: 2,
    };

    function which(this: iEngineNode): number {
        const eventData = this.getNodeData<NodeData>().lastData;
        const btn = eventData?.buttons ?? 0;
        const remap = btnMap[btn] ?? btn;
        return remap;
    }

    function x(this: iEngineNode): number {
        const eventData = this.getNodeData<NodeData>().lastData;
        return eventData?.pos.x ?? 0;
    }

    function y(this: iEngineNode): number {
        const eventData = this.getNodeData<NodeData>().lastData;
        return eventData?.pos.y ?? 0;
    }

    function instance(this: iEngineNode): Instance_Base | null {
        const eventData = this.getNodeData<NodeData>().lastData;
        return eventData?.instances[0] ?? null;
    }

    const mouseBtn = {
        id: E_MOUSE_BUTTON_ID,
        isEvent: true,
        category,
        outTriggers: [OT.DOWN, OT.UP, OT.CLICK],
        outputs: [
            {id: 'which_button', type: SOCKET_TYPE.NUMBER, execute: which},
            {id: 'x_pos', type: SOCKET_TYPE.NUMBER, execute: x},
            {id: 'y_pos', type: SOCKET_TYPE.NUMBER, execute: y},
            {id: 'instance', type: SOCKET_TYPE.INSTANCE, execute: instance},
        ],
        init(this: GenericNode){
            if (!isEngineNode(this)) return;
            this.setNodeData<NodeData>({
                lastData: null,
                downPos: null,
            });
        },
        execute(this: iEngineNode, eventContext: iEventContext, data: E_MOUSE_BUTTON['data']){
            this.getNodeData<NodeData>().lastData = data;

            if (data.type == MOUSE_EVENT.DOWN){
                this.getNodeData<NodeData>().downPos = data.pos.clone();
                this.triggerOutput(OT.DOWN, eventContext);
            }
            else if (data.type == MOUSE_EVENT.UP){
                const downPos = this.getNodeData<NodeData>().downPos;

                if (downPos && downPos.equalTo(data.pos)){
                    this.triggerOutput(OT.CLICK, eventContext);
                }
                else{
                    this.triggerOutput(OT.UP, eventContext);
                }
            }
        },
    };
    catEvents.push(mouseBtn);
}

const E_MOUSE_MOVE_ID = 'e_mouse_move' as const;

export type E_MOUSE_MOVE = {
    id: typeof E_MOUSE_MOVE_ID;
};

{// Mouse Move
    function x(this: iEngineNode): number {
        return this.engine.mouse.pos.x;
    }

    function y(this: iEngineNode): number {
        return this.engine.mouse.pos.y;
    }

    const mouseMove = {
        id: E_MOUSE_MOVE_ID,
        isEvent: true,
        category,
        outTriggers: ['_o'],
        outputs: [
            {id: 'x_pos', type: SOCKET_TYPE.NUMBER, execute: x},
            {id: 'y_pos', type: SOCKET_TYPE.NUMBER, execute: y},
        ],
    };
    catEvents.push(mouseMove);
}

const E_KEYBOARD_ID = 'e_keyboard' as const;

export type E_KEYBOARD = {
    id: typeof E_KEYBOARD_ID;
    data: {
        which_key: string;
        code: string;
        type: KEY_STATE;
    };
};

{// Keyboard
    const enum KEY {
        KEY_DOWN = 'key_down',
        KEY_PRESSED = 'key_pressed',
        KEY_UP = 'key_up',
    };

    const keyboard = {
        id: 'e_keyboard',
        isEvent: true,
        category,
        widget: {
            type: WIDGET_TYPE.KEY,
        },
        outTriggers: [KEY.KEY_DOWN, KEY.KEY_PRESSED, KEY.KEY_UP],
        execute(this: iEngineNode, eventContext: iEventContext, data: E_KEYBOARD['data']){
            const { code } = this.getWidgetData() as WidgetKey['widget']['data'];

            if (data.code == code){
                switch (data.type){
                    case 'down':
                        this.triggerOutput(KEY.KEY_DOWN, eventContext);
                        break;
                    case 'pressed':
                        this.triggerOutput(KEY.KEY_PRESSED, eventContext);
                        break;
                    case 'up':
                        this.triggerOutput(KEY.KEY_UP, eventContext);
                        break;
                }
            }
        },
    } as const satisfies iNodeTemplate;
    catEvents.push(keyboard);
}

const E_COLLISION_ID = 'e_collision' as const;

export type E_COLLISION = {
    id: typeof E_COLLISION_ID;
    data: {
        type: COLLISION_EVENT;
        instance: Instance_Base
    };
};

{// Collision
    type NodeData = Map<number, E_COLLISION['data']>;

    const enum OTRIG {
        START = 'start',
        REPEAT = 'repeat',
        STOP = 'stop',
    };

    function getInstance(this: iEngineNode, eventContext: iEventContext): Instance_Base | null {
        const nodeData = this.getNodeData<NodeData>().get(eventContext.eventKey);
        return nodeData?.instance ?? null;
    }

    const collision = {
        id: E_COLLISION_ID,
        isEvent: true,
        category,
        outTriggers: [OTRIG.START, OTRIG.REPEAT, OTRIG.STOP],
        outputs: [
            {id: 'instance', type: SOCKET_TYPE.INSTANCE, execute: getInstance},
        ],
        init(this: GenericNode){
            if (isEngineNode(this)) {
                this.setNodeData<NodeData>(new Map());
                return;
            }

            this.stackDataIO = true;
        },
        execute(this: iEngineNode, eventContext: iEventContext, data: E_COLLISION['data']){
            //Dispatch collision event
            this.getNodeData<NodeData>().set(eventContext.eventKey, data);

            switch (data.type){
                case COLLISION_EVENT.START:
                    this.triggerOutput(OTRIG.START, eventContext);
                    break;
                case COLLISION_EVENT.REPEAT:
                    this.triggerOutput(OTRIG.REPEAT, eventContext);
                    break;
                case COLLISION_EVENT.STOP:
                    this.triggerOutput(OTRIG.START, eventContext);
                    break;
            }

            this.getNodeData<NodeData>().delete(eventContext.eventKey);
        },
    };
    catEvents.push(collision);
}

{// Animation
    const enum OT {
        START = 'start',
        STOP = 'stop',
        TICK = 'tick',
        FINISHED = 'finished',
    };

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
        category,
        outTriggers: [OT.START, OT.STOP, OT.TICK, OT.FINISHED],
        outputs: [
            {id: 'is_playing', type: SOCKET_TYPE.BOOL, execute: getPlaying},
            {id: 'frame', type: SOCKET_TYPE.NUMBER, execute: getFrame},
            {id: 'fps', type: SOCKET_TYPE.NUMBER, execute: getFPS},
        ],
        execute(this: iEngineNode, eventContext: iEventContext, data: InstanceAnimEvent){
            switch(data){
                case InstanceAnimEvent.START:
                    this.triggerOutput(OT.START, eventContext);
                    break;
                case InstanceAnimEvent.STOP:
                    this.triggerOutput(OT.STOP, eventContext);
                    break;
                case InstanceAnimEvent.TICK:
                    this.triggerOutput(OT.TICK, eventContext);
                    break;
                case InstanceAnimEvent.FINISHED:
                    this.triggerOutput(OT.FINISHED, eventContext);
                    break;
            }
        },
    };
    catEvents.push(animation);
}

const E_MESSAGE_ID = 'e_message' as const;

export type E_MESSAGE = {
    id: typeof E_MESSAGE_ID;
    data: {name: string};
};

{// Message
    const enum OT {
        O = '_o',
    };

    const nameInput = { id: 'name', type: SOCKET_TYPE.STRING, flipInput: true, hideSocket: true, default: '' } as const satisfies iInput;
    const message = {
        id: E_MESSAGE_ID,
        isEvent: true,
        category,
        outTriggers: [OT.O],
        inputs: [
            nameInput,
        ],
        init(this: GenericNode){
            if (!isEngineNode(this)){
                this.inputBoxWidth = 6;
            }
        },
        execute(this: iEngineNode, eventContext: iEventContext, data: E_MESSAGE['data']){
            const input = nameInput;
            const name = this.getInput(input, eventContext);

            if (name.trim().length < 0) return;

            if (data.name == name){
                this.triggerOutput(OT.O, eventContext);
            }
        },
    } as const satisfies iNodeTemplate;
    catEvents.push(message);
}
