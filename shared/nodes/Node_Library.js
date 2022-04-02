import {SOCKET_TYPE} from './Node_Enums';

export const NODE_LIST = [
    // {
    //     id: 'trigger_in',
    //     category: 'testing',
    //     inTriggers: [
    //         {id: 'trigger_in_iTrigger_default', execute: 'do_thing'},
    //     ],
    // },
    // {
    //     id: 'trigger_io',
    //     category: 'testing',
    //     inTriggers: [
    //         {id: 'trigger_io_inTrigger_default', execute: 'do_thing'},
    //     ],
    //     outTriggers: ['trigger_io_outTrigger_default'],
    //     inputs: [
    //         {id: 'trigger_io_input_number', type: SOCKET_TYPE.NUMBER, default: 0},
    //         {id: 'trigger_io_input_string', type: SOCKET_TYPE.STRING, default: 'Test'},
    //     ],
    // },
    // {
    //     id: 'trigger_2io',
    //     category: 'testing',
    //     inTriggers: [
    //         {id: 'trigger_2io_inTrigger_01', execute: 'do_thing'},
    //         {id: 'trigger_2io_inTrigger_02', execute: 'do_thing'},
    //     ],
    //     outTriggers: ['trigger_2io_outTrigger_01', 'trigger_2io_outTrigger_02'],
    //     inputs: [
    //         {id: 'trigger_2io_iNum1', type: SOCKET_TYPE.NUMBER, default: 1},
    //         {id: 'trigger_2io_iNum2', type: SOCKET_TYPE.NUMBER, default: 2},
    //     ],
    //     outputs: [
    //         {id: 'trigger_2io_oNum1', type: SOCKET_TYPE.NUMBER, execute: 'do_thing'},
    //         {id: 'trigger_2io_oNum2', type: SOCKET_TYPE.NUMBER, execute: 'do_thing'},
    //     ],
    // },
    // {
    //     id: 'some_math',
    //     category: 'testing',
    //     inputs: [
    //         {id: 'some_math_num1', type: SOCKET_TYPE.NUMBER, default: 24},
    //         {id: 'some_math_num2', type: SOCKET_TYPE.NUMBER, default: 27},
    //     ],
    //     outputs: [
    //         {id: 'some_math_output', type: SOCKET_TYPE.NUMBER, execute: 'do_thing'},
    //     ],
    // },
    // {
    //     id: 'all_types',
    //     category: 'testing',
    //     inputs: [
    //         {id: 'all_types_iNumber', type: SOCKET_TYPE.NUMBER, default: 88},
    //         {id: 'all_types_iAny', type: SOCKET_TYPE.ANY, default: null},
    //         {id: 'all_types_iObject', type: SOCKET_TYPE.OBJECT, default: null},
    //         {id: 'all_types_iString', type: SOCKET_TYPE.STRING, default: 'Default'},
    //         {id: 'all_types_iBool', type: SOCKET_TYPE.BOOL, defualt: false},
    //     ],
    //     outputs: [
    //         {id: 'all_types_oNumber', type: SOCKET_TYPE.NUMBER, execute: 'do_thing'},
    //         {id: 'all_types_oAny', type: SOCKET_TYPE.ANY, execute: 'do_thing'},
    //         {id: 'all_types_oObject', type: SOCKET_TYPE.OBJECT, execute: 'do_thing'},
    //         {id: 'all_types_oString', type: SOCKET_TYPE.STRING, execute: 'do_thing'},
    //         {id: 'all_types_oBool', type: SOCKET_TYPE.BOOL, execute: 'do_thing'},
    //     ],
    // },
    ///////////// actual nodes
    {
        id: 'branch',
        category: 'actual',
        inTriggers: [
            {id: 'default', execute: 'checkCondition'}
        ],
        inputs: [
            {id: 'condition', type: SOCKET_TYPE.BOOL, default: false}
        ],
        outTriggers: ['true', 'false'],
        methods: {
            checkCondition(){
                const conditionVal = this.getInput('condition');
                const out = conditionVal ? 'true' : 'false';
                this.triggerOutput(out);
            },
        },
    },
    {
        id: 'compare',
        category: 'actual',
        inputs: [
            {id: '_inp', type: SOCKET_TYPE.ANY, default: null},
            {id: '_inp2', type: SOCKET_TYPE.ANY, default: null},
        ],
        widget: {
            id: 'compare_function',
            type: 'enum',
            options: ['equal_sym', 'gt', 'lt', 'gte', 'lte'],
        },
        outputs: [
            {id: 'equal', type: SOCKET_TYPE.BOOL, execute: 'compare'},
        ],
        methods: {
            compare(){
                const compareFunc = this.getWidgetData();
                const inp1 = this.getInput('_inp1');
                const inp2 = this.getInput('_inp2');

                switch(compareFunc){
                    case 'equal':
                        return inp1 == inp2;
                    case 'gt':
                        return inp1 > inp2;
                    case 'lt':
                        return inp1 < inp2;
                    case 'gte':
                        return inp1 >= inp2;
                    case 'lte':
                        return inp1 <= inp2;
                }
            },
        },
    },
    {
        id: 'logic',
        category: 'actual',
        widget: {
            id: 'logic_function',
            type: 'enum',
            options: ['and', 'or', 'xor'],
        },
        inputs: [
            {id: '_inp1', type: SOCKET_TYPE.BOOL, default: false},
            {id: '_inp2', type: SOCKET_TYPE.BOOL, default: false},
        ],
        outputs: [
            {id: '_result', type: SOCKET_TYPE.BOOL, execute: 'result'},
        ],
        methods: {
            result(){
                const logicFunc = this.getWidgetData();
                const inp1 = this.getInput('_inp1');
                const inp2 = this.getInput('_inp2');

                switch(logicFunc){
                    case 'and':
                        return inp1 && inp2;
                    case 'or':
                        return inp1 || inp2;
                    case 'xor':
                        return !!(inp1 ^ inp2);
                }
            },
        },
    },
    {
        id: 'not',
        category: 'actual',
        inputs: [
            {id: '_inp', type: SOCKET_TYPE.BOOL, default: false}
        ],
        outputs: [
            {id: '_out', type: SOCKET_TYPE.BOOL, execute: 'not'}
        ],
        methods: {
            not(){return !this.getInput('_inp')}
        },
    },
    {
        id: 'debug_log',
        category: 'actual',
        inTriggers: [
            {id: '_default', execute: 'log'}
        ],
        inputs: [
            {id: 'label', type: SOCKET_TYPE.STRING, default: ''},
            {id: '_data', type: SOCKET_TYPE.ANY, default: null},
        ],
        methods: {
            log(){
                const label = this.getInput('label');
                const data = this.getInput('_data');

                if (label.length > 0 && data){
                    this.api.log(label, data);
                }
                else if (data){
                    this.api.log(data);
                }
                else{
                    this.api.log(label);
                }
            }
        },
    },
    {
        id: 'key_down',
        category: 'actual',
        inputs: [{id: 'key', type: SOCKET_TYPE.STRING, default: ''}],
        outputs: [{id: 'is_down', type: SOCKET_TYPE.BOOL, execute: 'isDown'}],
        methods: {
            isDown(){
                const keymap = this.api.keymap;
                const input = this.getInput('key').toLowerCase();
                return !!keymap[input];
            }
        }
    },
    {
        id: 'math',
        category: 'actual',
        widget: {
            id: 'math_function',
            type: 'enum',
            options: ['add_sym', 'subtract_sym', 'multiply_sym', 'divide_sym'],
        },
        inputs: [
            {id: '_num1', type: SOCKET_TYPE.NUMBER, default: 0},
            {id: '_num2', type: SOCKET_TYPE.NUMBER, default: 0},
        ],
        outputs: [{id: '_out', type: SOCKET_TYPE.NUMBER, execute: 'compute'}],
        methods: {
            compute(){
                const mathFunc = this.getWidgetData();
                const num1 = this.getInput('_num1');
                const num2 = this.getInput('_num2');

                switch(mathFunc){
                    case 'add_sym':
                        return num1 + num2;
                    case 'subtract_sym':
                        return num1 - num2;
                    case 'multiply_sym':
                        return num1 * num2;
                    case 'divide_sym':
                        if (num2 == 0){
                            this.api.nodeExeption(this, 'Cannot divide by 0');
                            return;
                        }
                        return num1 / num2;
                }
            },
        },
    },
];

export const NODE_MAP = new Map();

NODE_LIST.forEach(node => {
    NODE_MAP.set(node.id, node);
});