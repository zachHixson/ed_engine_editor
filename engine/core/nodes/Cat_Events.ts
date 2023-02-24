import {SOCKET_TYPE, WIDGET, COLLISION_EVENT} from './Node_Enums';
import { iNodeTemplate } from './iNodeTemplate';
import { iEngineNode } from '../LogicInterfaces';

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
        widget: {
            id: 'mouse_btn',
            type: WIDGET.MOUSE_BTN,
        },
        outTriggers: ['button_down', 'button_up', 'button_click'],
        outputs: [
            {id: 'which_button', type: SOCKET_TYPE.STRING, execute: 'which'},
            {id: 'x', type: SOCKET_TYPE.NUMBER, execute: 'x'},
            {id: 'y', type: SOCKET_TYPE.NUMBER, execute: 'y'},
            {id: 'object', type: SOCKET_TYPE.OBJECT, execute: 'object'},
        ],
        execute(this: iEngineNode, data: MouseEvent){
            this.dataCache.set('lastData', data);
        },
        methods: {
            which(this: iEngineNode){
                const eventData = this.dataCache.get('lastData');
                return eventData?.button ?? 0;
            },
            x(this: iEngineNode){
                const eventData = this.dataCache.get('lastData');
                return eventData?.x ?? 0;
            },
            y(this: iEngineNode){
                const eventData = this.dataCache.get('lastData');
                return eventData?.y ?? 0;
            },
            object(this: iEngineNode){
                const eventData = this.dataCache.get('lastData');
                return eventData?.object ?? null;
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
                return this.engine.mouse.x;
            },
            y(this: iEngineNode){
                return this.engine.mouse.y;
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
        execute(this: iEngineNode, data: KeyboardEvent){
            const {code} = this.getWidgetData();

            if (data.code == code){
                if (data.type == 'down'){
                    this.triggerOutput('key_down');
                }
                else{
                    this.triggerOutput('key_up');
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
            {id: 'object', type: SOCKET_TYPE.OBJECT, execute: 'object'},
        ],
        execute(this: iEngineNode, data){
            const cacheKey = this.method('getCacheKey');

            this.dataCache.set(cacheKey, data);

            switch (data.type){
                case COLLISION_EVENT.START:
                    this.triggerOutput('start');
                    break;
                case COLLISION_EVENT.REPEAT:
                    this.triggerOutput('repeat');
                    break;
                case COLLISION_EVENT.STOP:
                    this.triggerOutput('stop');
                    break;
            }
        },
        methods: {
            getCacheKey(this: iEngineNode){
                return `${this.nodeId}/${this.instance.id.toString()}`;
            },
            object(this: iEngineNode){
                const cacheKey = this.method('getCacheKey');
                const cacheData = this.dataCache.get(cacheKey);
                return cacheData?.instance ?? null;
            },
        },
    },
    {// Timer
        id: 'e_timer',
        isEvent: true,
        category: 'events',
        outTriggers: ['_o'],
        outputs: [
            {id: 'name', type: SOCKET_TYPE.STRING, execute: 'name'},
        ],
        execute(this: iEngineNode, data){
            this.dataCache.set('timer', data);
        },
        methods: {
            name(this: iEngineNode){
                const data = this.dataCache.get('timer');
                return data.name;
            }
        },
    },
    {// Message
        id: 'e_message',
        isEvent: true,
        category: 'events',
        outTriggers: ['_o'],
        outputs: [
            {id: 'name', type: SOCKET_TYPE.STRING, execute: 'name'},
            {id: 'data', type: SOCKET_TYPE.ANY, execute: 'data'},
        ],
        execute(this: iEngineNode, data: any){
            this.dataCache.set(data.name, data);
        },
        methods: {
            name(this: iEngineNode){
                const data = this.dataCache.get('message');
                return data.name;
            },
            data(this: iEngineNode){
                const data = this.dataCache.get('message');
                return data.data;
            },
        },
    },
] as iNodeTemplate[];