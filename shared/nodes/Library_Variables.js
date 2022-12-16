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
        $init(){
            this.editorCanDelete = false;
            this.inputs.get('_varName').enableDecorators = true;
            this.inputs.get('_varType').enableDecorators = true;
            this.inputs.get('initial_value').flipInput = true;
        },
        $onScriptAdd(){
            if (this.engine){
                const {varName, isGlobal} = this.dataCache.get('varInfo');
                const initialValue = this.getInput('initial_value');

                isGlobal ?
                    this.engine.setGlobalVariable(varName, initialValue)
                    : this.parentScript.setLocalVariableDefault(varName, initialValue);
            }
            else{
                this.method('editor_setVar');
            }
        },
        $onCreate(){
            this.editorAPI.dialogNewVariable((positive, varInfo) => {
                if (positive){
                    const valSocket = this.inputs.get('initial_value');

                    this.dataCache.set('varInfo', varInfo);
                    this.method('editor_initVarNode');
                    valSocket.value = SOCKET_DEFAULT.get(varInfo.type);
                    this.method('editor_setVar');
                }
                else{
                    this.editorAPI.deleteNode(this);
                }
            });
        },
        $afterSave({detail: saveData}){
            const valueInput = saveData.inputs.find(input => input.id == 'initial_value');
            const varInfo = Object.assign({}, this.dataCache.get('varInfo'));
            
            varInfo.type = varInfo.type.description;
            saveData.details = varInfo;
            saveData.inputs = [valueInput];
        },
        $beforeLoad({detail: saveData}){
            const varInfo = saveData.details;

            varInfo.type = Symbol.for(varInfo.type);
            this.dataCache.set('varInfo', varInfo);
        },
        $afterLoad(){
            if (!this.engine) this.method('editor_setVar');
        },
        $onMount(){
            const varInfo = this.dataCache.get('varInfo');
            
            if (!varInfo) return;

            this.method('editor_initVarNode');
        },
        $onDeleteStopped({detail}){
            const createVars = detail.filter(node => node.templateId == this.templateId);
            const varNames = createVars.map(node => node.inputs.get('_varName').value.data);
            const message = varNames.length > 1 ? 'node.create_var_confirm_multiple' : 'node.create_var_confirm';
            const selectedNodes = this.editorAPI.getSelectedNodes();

            this.editorAPI.dialogConfirm({
                textId: message,
                vars: {varList: varNames.join(', ')}
            }, positive => {
                if (!positive) return;
                const allGetSetNodes = [];

                varNames.forEach(varName => {
                    const isGlobal = !!this.editorAPI.getVariableType(varName, true);
                    const getSetNodes = this.editorAPI.getVariableUsage(varName, null, isGlobal);
                    allGetSetNodes.push(...getSetNodes);
                });

                this.editorAPI.deleteNodes([...selectedNodes, ...allGetSetNodes]);
                this.method('editor_deleteVar');
            });
        },
        methods: {
            editor_initVarNode(){
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
            },
            editor_setVar(){
                const varInfo = this.dataCache.get('varInfo');

                if (!varInfo) return;
                const {varName, type, isGlobal, isList} = varInfo;
                isGlobal ?
                    this.editorAPI.setVariableType(varName, type, isGlobal)
                    : this.parentScript.localVariables.set(varName, type);
            },
            editor_deleteVar(){
                const {varName, isGlobal} = this.dataCache.get('varInfo');
                this.editorAPI.deleteVariableType(varName, isGlobal);
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
        $init(){
            this.inputBoxWidth = 6;
            this.inputs.get('name').enableDecorators = true;
        },
        $onInput({detail: event}){
            this.method('validate', [event.detail.target]);
        },
        $afterGameDataLoaded(){
            if (this.engine) return;
            determineConnected.call(this);
            this.method('validate');
        },
        $onNewConnection: determineConnected,
        $onRemoveConnection: determineConnected,
        methods: {
            setVar(){
                const varName = this.getInput('name');
                const data = this.getInput('data');
                const isGlobal = this.engine.getGlobalVariable(varName);

                isGlobal ? this.engine.setGlobalVariable(varName, data) : this.instance.setLocalVariable(varName, data);
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
            {id: 'data', type: SOCKET_TYPE.ANY, disabled: true, execute: 'getVar'},
        ],
        $init(){
            const nameInput = this.inputs.get('name');
            // nameInput.enableDecorators = true;
            nameInput.flipInput = true;
            this.inputBoxWidth = 6;
        },
        $onInput({detail: event}){
            this.method('validate', [event.target]);
        },
        $afterGameDataLoaded(){
            if (this.engine) return;
            determineConnected.call(this);
            this.method('validate');
        },
        $onNewConnection: determineConnected,
        $onRemoveConnection: determineConnected,
        methods: {
            getVar(){
                const varName = this.getInput('name');
                const isGlobal = this.engine.getGlobalVariable(varName);
                const value = isGlobal ? this.engine.getGlobalVariable(varName) : this.instance.getLocalVariable(varName);
                
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

function determineConnected(){
    const connection = this.editorAPI.getConnection(this, 'data');
    const nameSocket = this.inputs.get('name');
    const isDataConnected = !!connection;
    nameSocket.disabled = isDataConnected;
}

function validate(textbox){
    const dataSocket = this.inputs.get('data') || this.outputs.get('data');
    const varName = textbox?.value ?? this.getInput('name');
    const globalGet = this.editorAPI.getVariableType(varName, true);
    const localGet = this.parentScript.localVariables.get(varName);
    const isValid = !!globalGet || !!localGet;

    this.decoratorIcon = null;

    if (isValid){
        const type = localGet ?? globalGet;

        if (!!globalGet && !!localGet){
            this.decoratorIcon = 'warning_decorator';
            this.decoratorText = 'logic_editor.local_global_name_warning';
        }

        dataSocket.disabled = false;
        dataSocket.type = type;
    }
    else if (varName.length){
        dataSocket.disabled = true;
        dataSocket.type = SOCKET_TYPE.ANY;
        this.decoratorIcon = 'error_decorator';
        this.decoratorText = 'node.error_var_not_found';
    }

    this.dataCache.set('isValid', isValid);
    this.dispatchEvent(new CustomEvent('socketsChanged'));
}