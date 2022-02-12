// import {SOCKET_TYPE} from '@shared/nodes/Node_Enums';

waitForSharedDependencies(['SOCKET_TYPE'], ()=>{

const {SOCKET_TYPE} = Shared;

Shared.NODE_LIST = [
    {
        id: 'trigger_in',
        category: 'testing',
        inTriggers: [
            {id: 'trigger_in_iTrigger_default', execute: 'do_thing'},
        ],
    },
    {
        id: 'trigger_io',
        category: 'testing',
        inTriggers: [
            {id: 'trigger_io_inTrigger_default', execute: 'do_thing'},
        ],
        outTriggers: ['trigger_io_outTrigger_default'],
        inputs: [
            {id: 'trigger_io_input_number', type: SOCKET_TYPE.NUMBER, default: 0},
            {id: 'trigger_io_input_string', type: SOCKET_TYPE.STRING, default: 'Test'},
        ],
    },
    {
        id: 'trigger_2io',
        category: 'testing',
        inTriggers: [
            {id: 'trigger_2io_inTrigger_01', execute: 'do_thing'},
            {id: 'trigger_2io_inTrigger_02', execute: 'do_thing'},
        ],
        outTriggers: ['trigger_2io_outTrigger_01', 'trigger_2io_outTrigger_02'],
        inputs: [
            {id: 'trigger_2io_iNum1', type: SOCKET_TYPE.NUMBER, default: 1},
            {id: 'trigger_2io_iNum2', type: SOCKET_TYPE.NUMBER, default: 2},
        ],
        outputs: [
            {id: 'trigger_2io_oNum1', type: SOCKET_TYPE.NUMBER, execute: 'do_thing'},
            {id: 'trigger_2io_oNum2', type: SOCKET_TYPE.NUMBER, execute: 'do_thing'},
        ],
    },
    {
        id: 'some_math',
        category: 'testing',
        inputs: [
            {id: 'some_math_num1', type: SOCKET_TYPE.NUMBER, default: 24},
            {id: 'some_math_num2', type: SOCKET_TYPE.NUMBER, default: 27},
        ],
        outputs: [
            {id: 'some_math_output', type: SOCKET_TYPE.NUMBER, execute: 'do_thing'},
        ],
    },
    {
        id: 'all_types',
        category: 'testing',
        inputs: [
            {id: 'all_types_iNumber', type: SOCKET_TYPE.NUMBER, default: 88},
            {id: 'all_types_iAny', type: SOCKET_TYPE.ANY, default: null},
            {id: 'all_types_iObject', type: SOCKET_TYPE.OBJECT, default: null},
            {id: 'all_types_iString', type: SOCKET_TYPE.STRING, default: 'Default'},
            {id: 'all_types_iBool', type: SOCKET_TYPE.BOOL, defualt: false},
        ],
        outputs: [
            {id: 'all_types_oNumber', type: SOCKET_TYPE.NUMBER, execute: 'do_thing'},
            {id: 'all_types_oAny', type: SOCKET_TYPE.ANY, execute: 'do_thing'},
            {id: 'all_types_oObject', type: SOCKET_TYPE.OBJECT, execute: 'do_thing'},
            {id: 'all_types_oString', type: SOCKET_TYPE.STRING, execute: 'do_thing'},
            {id: 'all_types_oBool', type: SOCKET_TYPE.BOOL, execute: 'do_thing'},
        ],
    },
];

Shared.NODE_MAP = new Map();

Shared.NODE_LIST.forEach(node => {
    Shared.NODE_MAP.set(node.id, node);
});

});