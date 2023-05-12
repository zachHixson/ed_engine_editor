import {SOCKET_TYPE, WIDGET, COLLISION_EVENT} from './Node_Enums';
import { iNodeTemplate } from './iNodeTemplate';
import { iEngineNode } from '../LogicInterfaces';
import { MOUSE_EVENT } from '../Enums';
import { Vector } from '../Vector';
import { isEngineNode } from './Node_Library';
import { type GenericNode } from './Node_Library';
import { InstanceAnimEvent, Instance_Object } from '../core';

export default [
    {// Create
        id: 'e_create',
        isEvent: true,
        category: 'events',
        outTriggers: ['_o'],
    },
    {// Update
        id: 'e_update',
        isEvent: true,
        category: 'events',
        outTriggers: ['_o'],
        outputs: [
            {id: 'delta_time', type: SOCKET_TYPE.NUMBER, execute: 'getDelta'},
        ],
        methods: {
            getDelta(this: iEngineNode){
                return this.engine.deltaTime;
            },
        },
    },
    {// Mouse Button
        id: 'e_mouse_button',
        isEvent: true,
        category: 'events',
        outTriggers: ['button_down', 'button_up', 'button_click'],
        outputs: [
            {id: 'which_button', type: SOCKET_TYPE.NUMBER, execute: 'which'},
            {id: 'x', type: SOCKET_TYPE.NUMBER, execute: 'x'},
            {id: 'y', type: SOCKET_TYPE.NUMBER, execute: 'y'},
            {id: 'object', type: SOCKET_TYPE.INSTANCE, execute: 'object'},
        ],
        execute(this: iEngineNode, instanceContext: Instance_Object, data: any){
            const lBtn = !!(data.buttons & 0b001);
            const mBtn = !!(data.buttons & 0b010);
            const rBtn = !!(data.buttons & 0b100);

            if (lBtn) data.button = 1;
            if (mBtn) data.button = 2;
            if (rBtn) data.button = 3;

            this.dataCache.set('lastData', data);

            if (data.type == MOUSE_EVENT.DOWN){
                this.dataCache.set('downPos', data.pos.clone());
                this.triggerOutput('button_down', instanceContext);
            }
            else if (data.type == MOUSE_EVENT.UP){
                const downPos = this.dataCache.get('downPos') as Vector | undefined;

                if (downPos && downPos.equalTo(data.pos)){
                    this.triggerOutput('button_click', instanceContext);
                }
                else{
                    this.triggerOutput('button_up', instanceContext);
                }
            }
        },
        methods: {
            which(this: iEngineNode){
                const eventData = this.dataCache.get('lastData');
                return eventData?.button ?? 0;
            },
            x(this: iEngineNode){
                const eventData = this.dataCache.get('lastData');
                return eventData?.pos.x ?? 0;
            },
            y(this: iEngineNode){
                const eventData = this.dataCache.get('lastData');
                return eventData?.pos.y ?? 0;
            },
            object(this: iEngineNode){
                const eventData = this.dataCache.get('lastData');
                return eventData?.instances[0] ?? null;
            },
        },
    },
    {// Mouse Move
        id: 'e_mouse_move',
        isEvent: true,
        category: 'events',
        outTriggers: ['_o'],
        outputs: [
            {id: 'e_mouse_move_out_x', type: SOCKET_TYPE.NUMBER, execute: 'x'},
            {id: 'e_mouse_move_out_y', type: SOCKET_TYPE.NUMBER, execute: 'y'},
        ],
        methods: {
            x(this: iEngineNode){
                return this.engine.mouse.pos.x;
            },
            y(this: iEngineNode){
                return this.engine.mouse.pos.y;
            },
        },
    },
    {// Keyboard
        id: 'e_keyboard',
        isEvent: true,
        category: 'events',
        widget: {
            id: 'key_selector',
            type: WIDGET.KEY,
        },
        outTriggers: ['key_down', 'key_up'],
        execute(this: iEngineNode, instanceContext: Instance_Object, data: KeyboardEvent){
            const {code} = this.getWidgetData();

            if (data.code == code){
                if (data.type == 'down'){
                    this.triggerOutput('key_down', instanceContext);
                }
                else{
                    this.triggerOutput('key_up', instanceContext);
                }
            }
        },
    },
    {// Collision
        id: 'e_collision',
        isEvent: true,
        category: 'events',
        outTriggers: ['start', 'repeat', 'stop'],
        outputs: [
            {id: 'object', type: SOCKET_TYPE.INSTANCE, execute: 'object'},
        ],
        execute(this: iEngineNode, instanceContext: Instance_Object, data){
            const cacheKey = this.method('getCacheKey', instanceContext);

            this.dataCache.set(cacheKey, data);

            switch (data.type){
                case COLLISION_EVENT.START:
                    this.triggerOutput('start', instanceContext);
                    break;
                case COLLISION_EVENT.REPEAT:
                    this.triggerOutput('repeat', instanceContext);
                    break;
                case COLLISION_EVENT.STOP:
                    this.triggerOutput('stop', instanceContext);
                    break;
            }
        },
        methods: {
            getCacheKey(this: iEngineNode, instanceContext: Instance_Object){
                return `${this.nodeId}/${instanceContext.id.toString()}`;
            },
            object(this: iEngineNode, instanceContext: Instance_Object){
                const cacheKey = this.method('getCacheKey', instanceContext);
                const cacheData = this.dataCache.get(cacheKey);
                return cacheData?.instance ?? null;
            },
        },
    },
    {// Animation
        id: 'e_animation',
        isEvent: true,
        category: 'events',
        outputs: [
            {id: 'is_playing', type: SOCKET_TYPE.BOOL, execute: 'getPlaying'},
            {id: 'frame', type: SOCKET_TYPE.NUMBER, execute: 'getFrame'},
            {id: 'fps', type: SOCKET_TYPE.NUMBER, execute: 'getFPS'},
        ],
        outTriggers: ['start', 'stop', 'tick', 'finished'],
        execute(this: iEngineNode, instanceContext: Instance_Object, data: InstanceAnimEvent){
            switch(data){
                case InstanceAnimEvent.START:
                    this.triggerOutput('start', instanceContext);
                    break;
                case InstanceAnimEvent.STOP:
                    this.triggerOutput('stop', instanceContext);
                    break;
                case InstanceAnimEvent.TICK:
                    this.triggerOutput('tick', instanceContext);
                    break;
                case InstanceAnimEvent.FINISHED:
                    this.triggerOutput('finished', instanceContext);
                    break;
            }
        },
        methods: {
            getPlaying(this: iEngineNode, instanceContext: Instance_Object){
                return instanceContext.animPlaying;
            },
            getFrame(this: iEngineNode, instanceContext: Instance_Object){
                return instanceContext.animFrame;
            },
            getFPS(this: iEngineNode, instanceContext: Instance_Object){
                return instanceContext.fps;
            }
        }
    },
    {// Message
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
        execute(this: iEngineNode, instanceContext: Instance_Object, data: any){
            const name = this.getInput('name', instanceContext);

            if (name.trim().length < 0) return;
            
            if (data.name == name){
                this.triggerOutput('_o', instanceContext);
            }
        },
    },
] as iNodeTemplate[];