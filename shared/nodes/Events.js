import {SOCKET_TYPE} from './Node_Enums';

export const DEFAULT_EVENTS = new Map();

const defaultEvents = [
    {
        id: 'e_create',
        outTriggers: ['_default'],
    },
    {
        id: 'e_update',
        outTriggers: ['e_update_trigger_default'],
        outputs: [
            {id: 'e_update_out_delta_time', type: SOCKET_TYPE.NUMBER},
        ],
    },
    {
        id: 'e_mouse_button',
        outTriggers: ['e_mouse_button_trigger_down', 'e_mouse_button_trigger_up', 'e_mouse_button_trigger_click'],
        outputs: [
            {id: 'e_mouse_button_out_which', type: SOCKET_TYPE.STRING},
            {id: 'e_mouse_button_out_x', type: SOCKET_TYPE.NUMBER},
            {id: 'e_mouse_button_out_y', type: SOCKET_TYPE.NUMBER},
            {id: 'e_mouse_button_out_object', type: SOCKET_TYPE.OBJECT},
        ]
    },
    {
        id: 'e_mouse_move',
        outTriggers: ['e_mouse_move_trigger_default'],
        outputs: [
            {id: 'e_mouse_move_out_x', type: SOCKET_TYPE.NUMBER},
            {id: 'e_mouse_move_out_y', type: SOCKET_TYPE.NUMBER},
        ],
    },
    {
        id: 'e_keyboard',
        outTriggers: ['e_keyboard_trigger_down', 'e_keyboard_trigger_up', 'e_keyboard_trigger_tap'],
        outputs: [
            {id: 'e_keyboard_out_which', type: SOCKET_TYPE.STRING},
        ],
    },
    {
        id: 'e_collision',
        outTriggers: ['e_collision_trigger_start', 'e_collision_trigger_stop'],
        outputs: [
            {id: 'e_collision_out_object', type: SOCKET_TYPE.OBJECT},
        ],
    },
    {
        id: 'e_alarm',
        outTriggers: ['e_alarm_default'],
        outputs: [
            {id: 'e_alarm_out_name', type: SOCKET_TYPE.STRING},
        ],
    },
    {
        id: 'e_message',
        outTriggers: ['e_message_default'],
        outputs: [
            {id: 'e_message_out_name', type: SOCKET_TYPE.STRING},
            {id: 'e_message_out_data', type: SOCKET_TYPE.ANY},
        ],
    },
];

defaultEvents.forEach(event => {
    DEFAULT_EVENTS.set(event.id, event);
});

Object.freeze(DEFAULT_EVENTS);