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
                    const valSocket = this.inputs.get('initial_value');

                    this.dataCache.set('varInfo', varInfo);
                    this.method('initVarNode');
                    valSocket.value = SOCKET_DEFAULT.get(varInfo.type);
                }
                else{
                    this.editorAPI.deleteNode(this);
                }
            });
        },
        $afterSave({detail}){
            const saveData = detail.data;
            const valueInput = saveData.inputs.find(input => input.id == 'initial_value');
            const varInfo = Object.assign({}, this.dataCache.get('varInfo'));
            
            varInfo.type = varInfo.type.description;
            saveData.details = varInfo;
            saveData.inputs = [valueInput];
        },
        $beforeLoad({detail}){
            const saveData = detail.data;
            const varInfo = saveData.details;

            varInfo.type = Symbol.for(varInfo.type);
            this.dataCache.set('varInfo', varInfo);
        },
        $onMount(){
            if (!this.dataCache.get('varInfo')) return;

            this.method('initVarNode');
        },
        $onBeforeDelete(){
            //
        },
        methods: {
            initVarNode(){
                const {varName, type, isGlobal, isList} = this.dataCache.get('varInfo');
                const nameSocket = this.inputs.get('_varName');
                const typeSocket = this.inputs.get('_varType');
                const valSocket = this.inputs.get('initial_value');

                nameSocket.value = {titleId: 'node.create_var_display_name', data: varName, translate: false};

                if (isGlobal){
                    nameSocket.decoratorIcon = 'global_variable';
                    nameSocket.decoratorText = 'node.global_variable';
                }

                typeSocket.value = {titleId: 'node.create_var_display_type', data: `node.${type.description}`, translate: true}
                typeSocket.decoratorIcon = `socket_${type.description.toLowerCase()}`;
                
                valSocket.type = type;
                this.dispatchEvent(new CustomEvent('socketsChanged'));
                this.dispatchEvent(new CustomEvent('recalcWidth'));
                this.editorAPI.setVariableType(varName, type, isGlobal);
            }
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
            {id: 'data', type: SOCKET_TYPE.ANY, default: null, disabled: true, hideInput: true},
        ],
        $onInput(event){
            this.method('validate', [event.detail.target]);
        },
        $onNewConnection,
        $onRemoveConnection,
        methods: {
            setVar(){
                const varName = this.getInput('name').trim().toLowerCase();
                const data = this.getInput('data');
                const global = this.getInput('global');

                if (global){
                    this.engine.setGlobalVariable(varName, data);
                }
                else{
                    this.engine.setInstanceVariable(this.instance, varName, data);
                }

                this.triggerOutput('_o');
            },
            validate,
        },
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
        $onInput(event){
            this.method('validate', [event.detail.target]);
        },
        $onNewConnection,
        $onRemoveConnection,
        methods: {
            getVar(){
                const name = this.getInput('name').trim().toLowerCase();
                const global = this.getInput('global');
                const value = global ? this.engine.getGlobalVariable(name)
                    : this.engine.getInstanceVariable(this.instance, name);
                
                if (value == undefined){
                    return null;
                }

                return value;
            },
            validate,
        },
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

function $onNewConnection(){
    const nameSocket = this.inputs.get('name');
    nameSocket.disabled = true;
}

function $onRemoveConnection(){
    const nameSocket = this.inputs.get('name');
    nameSocket.disabled = false;
}

function validate(textbox){
    const nameSocket = this.inputs.get('name');
    const dataSocket = this.inputs.get('data') || this.outputs.get('data');
    const varName = textbox.value.trim().toLowerCase();
    const globalGet = this.editorAPI.getVariableType(varName, true);
    const localGet = this.editorAPI.getVariableType(varName, false);
    const isValid = !!globalGet || !!localGet;

    nameSocket.decoratorIcon = null;

    if (isValid){
        const type = localGet ?? globalGet;

        if (!!globalGet && !!localGet){
            nameSocket.decorator = 'warning_decorator';
            nameSocket.decoratorText = 'logic_editor.local_global_name_warning';
        }

        dataSocket.disabled = false;
        dataSocket.type = type;
    }
    else if (varName.length){
        dataSocket.disabled = true;
        dataSocket.type = SOCKET_TYPE.ANY;
        nameSocket.decoratorIcon = 'error_decorator';
        nameSocket.decoratorText = 'node.error_var_not_found';
    }

    this.dispatchEvent(new CustomEvent('socketsChanged'));
}