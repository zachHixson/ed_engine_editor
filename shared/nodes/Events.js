import {SOCKET_TYPE, WIDGET, COLLISION_EVENT} from './Node_Enums';

export const EVENTS = [
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
            getDelta(){
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
        execute(data){
            this.engine.cacheNodeEventData('mouse_button', data);
        },
        methods: {
            which(){
                const eventData = this.engine.getCachedNodeEventData('mouse_button');
                return eventData.which;
            },
            x(){
                const eventData = this.engine.getCachedNodeEventData('mouse_button');
                return eventData.x;
            },
            y(){
                const eventData = this.engine.getCachedNodeEventData('mouse_button');
                return eventData.y;
            },
            object(){
                const eventData = this.engine.getCachedNodeEventData('mouse_button');
                return eventData.object;
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
            x(){
                return this.engine.mouse.x;
            },
            y(){
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
        outputs: [
            {id: 'which_key', type: SOCKET_TYPE.STRING, execute: 'which'},
        ],
        execute(data){
            const {code} = this.getWidgetData();

            this.engine.cacheNodeEventData('keyboard', data);

            if (data.code == code){
                if (data.type == 'down'){
                    this.triggerOutput('key_down');
                }
                else{
                    this.triggerOutput('key_up');
                }
            }
        },
        methods: {
            which(){
                const data = this.engine.getCachedNodeEventData('keyboard');
                return data.which;
            },
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
        execute(data){
            const cacheKey = this.method('getCacheKey');

            this.engine.cacheNodeEventData(cacheKey, data);

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
            getCacheKey(){
                return `${this.nodeId}/${this.instance.id.toString()}`;
            },
            object(){
                const cacheKey = this.method('getCacheKey');
                const cacheData = this.engine.getCachedNodeEventData(cacheKey);
                return cacheData.instance;
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
        execute(data){
            this.engine.cacheNodeEventData('timer', data);
        },
        methods: {
            name(){
                const data = this.engine.getCachedNodeEventData('timer', data);
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
        execute(){
            this.engine.cacheNodeEventData('message', data);
        },
        methods: {
            name(){
                const data = this.engine.getCachedNodeEventData('message', data);
                return data.name;
            },
            data(){
                const data = this.engine.getCachedNodeEventData('message', data);
                return data.data;
            },
        },
    },
];