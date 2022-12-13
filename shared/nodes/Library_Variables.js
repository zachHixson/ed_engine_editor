import {SOCKET_TYPE, SOCKET_DEFAULT} from './Node_Enums';

export default [
    {// Create Variable
        id: 'create_variable',
        category: 'variables',
        inputs: [
            {id: '_varName', type: SOCKET_TYPE.INFO, hideSocket: true},
            {id: '_varType', type: SOCKET_TYPE.INFO, hideSocket: true},
            {id: 'initial_value', type: SOCKET_TYPE.NUMBER, default: 0, hideSocket: true},
        ],
        $onCreate(){
            this.editorAPI.dialogNewVariable((positive, varInfo) => {
                if (positive){
                    const {name, type, global, isList} = varInfo;
                    const nameSocket = this.inputs.get('_varName');
                    const typeSocket = this.inputs.get('_varType');
                    const valSocket = this.inputs.get('initial_value');

                    nameSocket.value = {titleId: 'create_var_display_name', data: name, translate: false};

                    if (global){
                        nameSocket.decorator = 'global_variable';
                        nameSocket.decoratorText = 'global_variable';
                    }

                    typeSocket.value = {titleId: 'create_var_display_type', data: `node.${type.description}`, translate: true}
                    typeSocket.decorator = `socket_${type.description.toLowerCase()}`;
                    
                    valSocket.type = type;
                    valSocket.value = SOCKET_DEFAULT.get(type);
                    this.dispatchEvent(new CustomEvent('socketsChanged'));
                    this.editorAPI.setVariableType(name, type, global);
                }
                else{
                    this.editorAPI.deleteNode(this);
                }
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