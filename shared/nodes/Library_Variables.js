import {SOCKET_TYPE, SOCKET_DEFAULT} from './Node_Enums';

export default [
    {// Create Variable
        id: 'create_variable',
        category: 'variables',
        inputs: [
            {id: 'varName', type: SOCKET_TYPE.INFO, hideSocket: true},
            {id: 'initialValue', type: SOCKET_TYPE.NUMBER, default: 0, hideSocket: true},
        ],
        $onCreate(){
            this.editorAPI.dialogNewVariable(({name, type, global, isList}) => {
                const socket = this.inputs.get('initialValue');

                socket.value = name;
                socket.type = type;
                socket.value = SOCKET_DEFAULT.get(type);
                this.dispatchEvent(new CustomEvent('socketsChanged'));
                this.editorAPI.setVariableType(name, type, global);
            });
        },
        $onBeforeDelete(){
            //
        }
    },
    {// Set Variable
        id: 'set_variable',
        category: 'variables',
        inTriggers: [
            {id: '_i', execute: 'setVar'},
        ],
        outTriggers: ['_o'],
        inputs: [
            {id: 'name', type: SOCKET_TYPE.STRING, default: '', hideSocket: true},
            {id: 'data', type: SOCKET_TYPE.ANY, default: null, hideInput: true},
        ],
        methods: {},
    },
    {// Get Variable
        id: 'get_variable',
        category: 'variables',
        inputs: [
            {id: 'name', type: SOCKET_TYPE.STRING, default: '', hideSocket: true},
        ],
        outputs: [
            {id: 'data', type: SOCKET_TYPE.ANY, execute: 'getVar'},
        ],
        methods: {},
    },
    {// Number
        id: 'number',
        category: 'variables',
        inputs: [
            {id: '_number', type: SOCKET_TYPE.NUMBER, default: 0, required: true, hideSocket: true},
        ],
        outputs: [
            {id: '_out', type: SOCKET_TYPE.NUMBER, execute: 'value'},
        ],
        methods: {
            value(){
                return this.getInput('_number');
            },
        }
    },
    {// String
        id: 'string',
        category: 'variables',
        inputs: [
            {id: '_string', type: SOCKET_TYPE.STRING, default: '', hideSocket: true},
        ],
        outputs: [
            {id: '_out', type: SOCKET_TYPE.STRING, execute: 'value'},
        ],
        methods: {
            value(){
                return this.getInput('_string');
            },
        }
    },
    {// Boolean
        id: 'boolean',
        category: 'variables',
        inputs: [
            {id: '_boolean', type: SOCKET_TYPE.BOOL, default: false, hideSocket: true},
        ],
        outputs: [
            {id: '_out', type: SOCKET_TYPE.BOOL, execute: 'value'},
        ],
        methods: {
            value(){
                return this.getInput('_boolean');
            },
        }
    },
];