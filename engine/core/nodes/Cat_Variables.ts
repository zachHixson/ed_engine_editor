import { iNodeTemplate } from './iNodeTemplate';
import {SOCKET_TYPE, SOCKET_DEFAULT} from './Node_Enums';
import { iEditorNode, iEngineNode, iNodeSaveData } from '../LogicInterfaces';
import { iAnyObj } from '../interfaces';
import { isEngineNode, type Node } from './Node_Library';

export default [
    {// Create Variable
        id: 'create_variable',
        category: 'variables',
        inputs: [
            {id: '_varName', type: SOCKET_TYPE.INFO, hideSocket: true},
            {id: '_varType', type: SOCKET_TYPE.INFO, hideSocket: true},
            {id: 'initial_value', type: SOCKET_TYPE.NUMBER, default: 0, hideSocket: true},
        ],
        outputs: [
            {id: '_value', type: SOCKET_TYPE.ANY, execute: 'getInitialValue'}
        ],
        init(this: Node){
            if (!isEngineNode(this)){
                this.editorCanDelete = false;
                this.reverseOutputs = true;
                this.inputs.get('_varName')!.enableDecorators = true;
                this.inputs.get('_varType')!.enableDecorators = true;
                this.inputs.get('initial_value')!.flipInput = true;
            }
        },
        onScriptAdd(this: Node){
            if (isEngineNode(this)){
                const {name, isGlobal} = this.dataCache.get('varInfo');
                const initialValue = this.getInput('initial_value');

                isGlobal ?
                    this.engine.setGlobalVariable(name, initialValue)
                    : this.parentScript.setLocalVariableDefault(name, initialValue);
            }
            else{
                this.method('editor_setVar');
            }
        },
        onCreate(this: Node){
            if (isEngineNode(this)) return;
            
            this.editorAPI.deleteNodes([this], false);
            this.editorAPI.popLastCommit();

            this.editorAPI.dialogNewVariable((positive, varInfo) => {
                if (positive){
                    const valSocket = this.inputs.get('initial_value')!;

                    this.dataCache.set('varInfo', varInfo);
                    this.method('editor_initVarNode');
                    valSocket.value = SOCKET_DEFAULT.get(varInfo.type);
                    this.method('editor_setVar');
                    !isEngineNode(this) && this.editorAPI.addNode(this, true);
                    document.dispatchEvent(new CustomEvent('onNewVariable'));
                }
            });
        },
        afterSave(this: iEditorNode, saveData: iNodeSaveData){
            const valueInput = saveData.inputs.find((input: iAnyObj) => input.id == 'initial_value')!;
            const varInfo = Object.assign({}, this.dataCache.get('varInfo'));
            
            varInfo.type = varInfo.type;
            saveData.details = varInfo;
            saveData.inputs = [valueInput];
        },
        beforeLoad(this: Node, saveData){
            const varInfo = saveData.details;

            varInfo.type = varInfo.type;
            this.dataCache.set('varInfo', varInfo);

            if (!isEngineNode(this)){
                this.method('editor_initVarNode');
            }
        },
        afterLoad(this: Node){
            if (!isEngineNode(this)) this.method('editor_setVar');
        },
        onMount(this: iEditorNode){
            const varInfo = this.dataCache.get('varInfo');
            
            if (!varInfo) return;

            this.method('editor_initVarNode');
        },
        onDeleteStopped(this: iEditorNode, protectedNodes){
            const createVars = protectedNodes.filter(node => node.templateId == this.templateId);
            const varNames = createVars.map(node => node.inputs.get('_varName')!.value.data);
            const message = varNames.length > 1 ? 'node.create_var_confirm_multiple' : 'node.create_var_confirm';
            const selectedNodes = this.editorAPI.getSelectedNodes();

            this.editorAPI.dialogConfirm({
                textId: message,
                vars: {varList: varNames.join(', ')}
            }, positive => {
                if (!positive) return;
                const allGetSetNodes: iEditorNode[] = [];

                varNames.forEach(varName => {
                    const isGlobal = !!this.editorAPI.getGlobalVariable(varName);
                    const getSetNodes = this.editorAPI.getVariableUsage(varName, null, isGlobal);
                    allGetSetNodes.push(...getSetNodes);
                });

                this.editorAPI.deleteNodes([...selectedNodes, ...allGetSetNodes]);
                this.editorAPI.clearSelectedNodes();
                this.method('editor_deleteVar');
            });
        },
        methods: {
            editor_initVarNode(){
                const {name, type, isGlobal, isList} = this.dataCache.get('varInfo');
                const nameSocket = this.inputs.get('_varName');
                const typeSocket = this.inputs.get('_varType');
                const valSocket = this.inputs.get('initial_value');
                const outSocket = this.outputs.get('_value');

                nameSocket.value = {titleId: 'node.create_var_display_name', data: name, translate: false};

                if (isGlobal){
                    nameSocket.decoratorIcon = 'global_variable';
                    nameSocket.decoratorText = 'node.global_variable';
                }

                typeSocket.value = {titleId: 'node.create_var_display_type', data: `node.${SOCKET_TYPE[type]}`, translate: true}
                
                valSocket.type = type;
                outSocket.type = type;
                this.emit('force-socket-update');
                this.emit('recalcWidth');
            },
            editor_setVar(){
                const varInfo = this.dataCache.get('varInfo');

                if (!varInfo) return;
                const {name, type, isGlobal, isList} = varInfo;
                isGlobal ?
                    this.editorAPI.setGlobalVariable(name, type)
                    : this.parentScript.setLocalVariable(name, type);
            },
            editor_deleteVar(){
                const {name, isGlobal} = this.dataCache.get('varInfo');
                isGlobal ?
                    this.editorAPI.deleteGlobalVariable(name)
                    : this.parentScript.deleteLocalVariable(name);
            },
            getInitialValue(){
                return this.getInput('initial_value');
            },
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
        init(this: Node){
            if (!isEngineNode(this)){
                this.inputBoxWidth = 6;
                this.inputs.get('name')!.enableDecorators = true;
                document.addEventListener('onNewVariable', this.onNewVariable as EventListener);
            }
        },
        onInput(event: InputEvent){
            this.method('validate', [event.target]);
        },
        afterGameDataLoaded(this: Node){
            if (isEngineNode(this)) return;
            determineConnected.call(this);
            this.method('validate');
        },
        onNewVariable(this: iEditorNode){
            this.method('validate');
            this.emit('forceUpdate');
        },
        onNewConnection: determineConnected,
        onRemoveConnection: determineConnected,
        onBeforeDelete(this: iEditorNode){
            document.removeEventListener('onNewVariable', this.onNewVariable as EventListener);
        },
        onBeforeUnmount(this: iEditorNode){
            document.removeEventListener('onNewVariable', this.onNewVariable as EventListener);
        },
        methods: {
            setVar(this: iEngineNode){
                const varName = this.getInput('name');
                const data = this.getInput('data');
                const isGlobal = this.engine.getGlobalVariable(varName) !== undefined;

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
        init(this: Node){
            if (!isEngineNode(this)){
                const nameInput = this.inputs.get('name')!;
                nameInput.flipInput = true;
                this.inputBoxWidth = 6;
                document.addEventListener('onNewVariable', this.onNewVariable as EventListener);
            }
        },
        onInput(event){
            this.method('validate', [event.target]);
        },
        afterGameDataLoaded(this: Node){
            if (isEngineNode(this)) return;
            determineConnected.call(this);
            this.method('validate');
        },
        onNewVariable(){
            this.method('validate');
            this.emit('forceUpdate');
        },
        onNewConnection: determineConnected,
        onRemoveConnection: determineConnected,
        onBeforeDelete(this: iEditorNode){
            document.removeEventListener('onNewVariable', this.onNewVariable as EventListener);
        },
        onBeforeUnmount(this: iEditorNode){
            document.removeEventListener('onNewVariable', this.onNewVariable as EventListener);
        },
        methods: {
            getVar(this: iEngineNode){
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
] as iNodeTemplate[];

function determineConnected(this: iEditorNode){
    const connection = this.editorAPI.getConnection(this, 'data');
    const nameSocket = this.inputs.get('name')!;
    nameSocket.disabled = !!connection;
    this.emit('force-socket-update', 'name');
}

function validate(this: iEditorNode, textbox?: HTMLInputElement){
    const dataSocket = this.inputs.get('data') || this.outputs.get('data')!;
    const varName = textbox?.value ?? this.getInput('name');
    const globalGet = this.editorAPI.getGlobalVariable(varName);
    const localGet = this.parentScript.getLocalVariable(varName);
    const isValid = !!globalGet || !!localGet;

    this.decoratorIcon = null;

    if (isValid){
        const type = localGet ?? globalGet!;

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
    this.emit('force-socket-update', 'data');
}