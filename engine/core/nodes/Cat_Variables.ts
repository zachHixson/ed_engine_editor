import { iNodeTemplate } from './iNodeTemplate';
import {SOCKET_TYPE, SOCKET_DEFAULT} from './Node_Enums';
import { iEngineInput, iEngineOutput, iEditorNode, iEngineNode, iNodeSaveData } from '../LogicInterfaces';
import { iAnyObj } from '../interfaces';
import { isEngineNode, type GenericNode } from './Node_Library';
import type { Instance_Object } from '../core';

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
        init(this: GenericNode){
            if (!isEngineNode(this)){
                this.editorCanDelete = false;
                this.reverseOutputs = true;
                this.inputs.get('_varName')!.enableDecorators = true;
                this.inputs.get('_varType')!.enableDecorators = true;
                this.inputs.get('initial_value')!.flipInput = true;
            }
        },
        onCreate(this: GenericNode){
            if (isEngineNode(this)) return;
            
            this.editorAPI.deleteNodes([this], false);
            this.editorAPI.popLastCommit();

            this.editorAPI.dialogNewVariable((positive, varInfo) => {
                const self = this as iEditorNode; //need this because typescript hates arrow functions

                if (positive){
                    const valSocket = self.inputs.get('initial_value')!;

                    self.dataCache.set('varInfo', varInfo);
                    self.method('editor_initVarNode');
                    valSocket.value = SOCKET_DEFAULT.get(varInfo.type);
                    self.method('editor_setVar');
                    self.editorAPI.addNode(self, true);
                    document.dispatchEvent(new CustomEvent('onNewVariable'));
                }
            });
        },
        afterSave(this: iEditorNode, saveData: iNodeSaveData){
            const valueInput = saveData.inputs.find((input: iAnyObj) => input.id == 'initial_value')!;
            const varInfo = Object.assign({}, this.dataCache.get('varInfo'));

            varInfo.isGlobal = +varInfo.isGlobal;
            varInfo.isList = +varInfo.isList;
            
            saveData.details = varInfo;
            saveData.inputs = [valueInput];
        },
        afterLoad(this: GenericNode, saveData){
            const varInfo = saveData.details;

            varInfo.isGlobal = !!varInfo.isGlobal;
            varInfo.isList = !!varInfo.isList;

            this.dataCache.set('varInfo', varInfo);

            if (isEngineNode(this)){
                const {name, isGlobal, type, isList} = varInfo;
                const inputValue = this.inputs.get('initial_value')!.value;
                const isEmptyNumber = inputValue == '' && type == SOCKET_TYPE.NUMBER;
                let initialValue = inputValue;

                if (isList){
                    initialValue = isEmptyNumber ? [] : [inputValue];
                } 

                isGlobal ?
                    this.engine.createGlobalVariable(name, initialValue, type, isList)
                    : this.parentScript.setLocalVariableDefault(name, initialValue, type, isList);
            }
            else{
                this.method('editor_initVarNode');
                this.method('editor_setVar');
            }
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
            editor_initVarNode(this: iEditorNode){
                const {name, type, isGlobal, isList} = this.dataCache.get('varInfo');
                const nameSocket = this.inputs.get('_varName')!;
                const typeSocket = this.inputs.get('_varType')!;
                const valSocket = this.inputs.get('initial_value')!;
                const outSocket = this.outputs.get('_value')!;

                nameSocket.value = {titleId: 'node.create_var_display_name', data: name, translate: false};

                if (isGlobal){
                    nameSocket.decoratorIcon = 'global_variable';
                    nameSocket.decoratorText = 'node.global_variable';
                }

                typeSocket.value = {titleId: 'node.create_var_display_type', data: `node.${SOCKET_TYPE[type]}`, translate: true}
                
                valSocket.type = type;
                outSocket.type = type;
                outSocket.isList = isList;
                this.emit('force-socket-update');
                this.emit('recalcWidth');
            },
            editor_setVar(this: iEditorNode){
                const varInfo = this.dataCache.get('varInfo');

                if (!varInfo) return;
                const {name, type, isGlobal, isList} = varInfo;
                
                if (isGlobal){
                    if (this.editorAPI.getGlobalVariable(name)) return;
                    this.editorAPI.setGlobalVariable(name, type, isList);
                }
                else{
                    this.parentScript.setLocalVariable(name, type, isList);
                }
            },
            editor_deleteVar(this: iEditorNode){
                const {name, isGlobal} = this.dataCache.get('varInfo');
                isGlobal ?
                    this.editorAPI.deleteGlobalVariable(name)
                    : this.parentScript.deleteLocalVariable(name);
            },
            getInitialValue(this: iEngineNode, instanceContext: Instance_Object){
                const {name, isGlobal} = this.dataCache.get('varInfo');
                const variable = isGlobal ? this.engine.getGlobalVariable(name) : instanceContext.getLocalVariable(name);
                
                if (variable == undefined){
                    return null;
                }

                return variable.value;
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
        init(this: GenericNode){
            if (!isEngineNode(this)){
                this.inputBoxWidth = 6;
                this.inputs.get('name')!.enableDecorators = true;
                document.addEventListener('onNewVariable', this.onNewVariable as EventListener);
            }
        },
        onInput: onInput,
        initVariableNodes: initVariableNodes,
        onNewVariable: onNewVariable,
        onNewConnection: determineConnected,
        onRemoveConnection: determineConnected,
        onBeforeDelete: onBeforeDelete,
        onBeforeUnmount: onBeforeUnmount,
        methods: {
            setVar(this: iEngineNode, instanceContext: Instance_Object){
                const varName = this.getInput('name', instanceContext);
                const data = this.getInput('data', instanceContext);
                const isGlobal = this.engine.getGlobalVariable(varName) !== undefined;

                isGlobal ? this.engine.setGlobalVariable(varName, data) : instanceContext.setLocalVariable(varName, data);
                this.triggerOutput('_o', instanceContext);
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
        init(this: GenericNode){
            if (!isEngineNode(this)){
                const nameInput = this.inputs.get('name')!;
                nameInput.flipInput = true;
                this.inputBoxWidth = 6;
                this.stackDataIO = true;
                document.addEventListener('onNewVariable', this.onNewVariable as EventListener);
            }
        },
        onInput: onInput,
        initVariableNodes: initVariableNodes,
        onNewVariable: onNewVariable,
        onNewConnection: determineConnected,
        onRemoveConnection: determineConnected,
        onBeforeDelete: onBeforeDelete,
        onBeforeUnmount: onBeforeUnmount,
        methods: {
            getVar(this: iEngineNode, instanceContext: Instance_Object){
                const varName = this.getInput('name', instanceContext);
                const isGlobal = this.engine.getGlobalVariable(varName);
                const variable = isGlobal ? this.engine.getGlobalVariable(varName) : instanceContext.getLocalVariable(varName);
                
                if (variable == undefined){
                    return null;
                }

                return variable.value;
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
            value(this: iEngineNode, instanceContext: Instance_Object){
                return this.getInput('_number', instanceContext);
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
            value(this: iEngineNode, instanceContext: Instance_Object){
                return this.getInput('_string', instanceContext);
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
            value(this: iEngineNode, instanceContext: Instance_Object){
                return this.getInput('_boolean', instanceContext);
            },
        }
    },
] satisfies iNodeTemplate[] as iNodeTemplate[];

function determineConnected(this: iEditorNode){
    const connection = this.editorAPI.getInputConnection(this, 'data') ?? this.editorAPI.getOutputConnections(this, 'data')[0];
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
        const variable = localGet ?? globalGet!;

        if (!!globalGet && !!localGet){
            this.decoratorIcon = 'warning_decorator';
            this.decoratorText = 'logic_editor.local_global_name_warning';
        }

        dataSocket.disabled = false;
        dataSocket.type = variable.type;
        dataSocket.isList = variable.isList;
    }
    else if (varName.length){
        dataSocket.disabled = true;
        dataSocket.type = SOCKET_TYPE.ANY;
        dataSocket.isList = false;
        this.decoratorIcon = 'error_decorator';
        this.decoratorText = 'node.error_var_not_found';
    }

    this.dataCache.set('isValid', isValid);
    this.emit('force-socket-update', 'data');
}

function initVariableNodes(this: GenericNode){
    if (isEngineNode(this)){
        //set global node state if global variable
        const varName = this.inputs.get('name')!.value;
        const dataSocket = this.inputs.get('data') ?? this.outputs.get('data');
        const variable = this.engine.getGlobalVariable(varName) ?? this.parentScript.localVariableDefaults.get(varName);

        if (dataSocket && variable){
            dataSocket.type = variable.type;
            dataSocket.isList = variable.isList;
        }
    }
    else{
        determineConnected.call(this);
        this.method('validate');
    }
}

function onInput(this: iEditorNode, event: InputEvent){
    this.method('validate', event.target);
}

function onNewVariable(this: iEditorNode){
    this.method('validate');
    this.emit('forceUpdate');
}

function onBeforeDelete(this: iEditorNode){
    document.removeEventListener('onNewVariable', this.onNewVariable as EventListener);
}

function onBeforeUnmount(this: iEditorNode){
    document.removeEventListener('onNewVariable', this.onNewVariable as EventListener);
}