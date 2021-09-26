import {SOCKET_TYPE} from '../Node_Enums';

const defaultEvents = [
    {
        id: 'event_create',
        outTriggers: ['e_create_trigger_default'],
    },
    {
        id: 'event_update',
        outTriggers: ['e_update_trigger_default'],
        outputs: [
            {id: 'e_update_out_delta_time', type: SOCKET_TYPE.NUMBER},
        ],
    },
    {
        id: 'event_mouse_button',
        outTriggers: ['e_mouse_button_trigger_down', 'e_mouse_button_trigger_up', 'e_mouse_button_trigger_click'],
        outputs: [
            {id: 'e_mouse_button_out_which', type: SOCKET_TYPE.STRING},
            {id: 'e_mouse_button_out_x', type: SOCKET_TYPE.NUMBER},
            {id: 'e_mouse_button_out_y', type: SOCKET_TYPE.NUMBER},
            {id: 'e_mouse_button_out_object', type: SOCKET_TYPE.OBJECT},
        ]
    },
    {
        id: 'event_mouse_move',
        outTriggers: ['e_mouse_move_trigger_default'],
        outputs: [
            {id: 'e_mouse_move_out_x', type: SOCKET_TYPE.NUMBER},
            {id: 'e_mouse_move_out_y', type: SOCKET_TYPE.NUMBER},
        ],
    },
    {
        id: 'event_keyboard',
        outTriggers: ['e_keyboard_trigger_down', 'e_keyboard_trigger_up', 'e_keyboard_trigger_tap'],
        outputs: [
            {id: 'e_keyboard_out_which', type: SOCKET_TYPE.STRING},
        ],
    },
    {
        id: 'event_collision',
        outTriggers: ['e_collision_trigger_start', 'e_collision_trigger_stop'],
        outputs: [
            {id: 'e_collision_out_object', type: SOCKET_TYPE.OBJECT},
        ],
    },
    {
        id: 'event_alarm',
        outTriggers: ['e_alarm_default'],
        outputs: [
            {id: 'e_alarm_out_name', type: SOCKET_TYPE.STRING},
        ],
    },
    {
        id: 'event_message',
        outTriggers: ['e_message_default'],
        outputs: [
            {id: 'e_message_out_name', type: SOCKET_TYPE.STRING},
            {id: 'e_message_out_data', type: SOCKET_TYPE.ANY},
        ],
    },
];
export const DEFAULT_EVENTS = new Map();

defaultEvents.forEach(event => {
    DEFAULT_EVENTS.set(event.id, event);
});

Object.freeze(DEFAULT_EVENTS);