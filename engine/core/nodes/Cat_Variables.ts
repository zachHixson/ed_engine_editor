import { iNodeTemplate } from './iNodeTemplate';
import {SOCKET_TYPE, SOCKET_DEFAULT} from './Node_Enums';
import { iEditorNode, iEngineNode, iNodeSaveData, iEventContext, iVarInfo, iEditorAPI } from '../LogicInterfaces';
import { iAnyObj } from '../interfaces';
import { isEngineNode, type GenericNode } from './Node_Library';
import { canConvertSocket } from './Socket_Conversions';

type ActionCreateVariable = {varNode: iEditorNode, varInfo: iVarInfo};
type ActionEditVariable = {varNode: iEditorNode, newVarInfo: iVarInfo, oldVarInfo: iVarInfo, oldInitValue: any};

const ActionCreateVariableKey = Symbol('create variable');
const ActionEditVariableKey = Symbol('edit variable');

export default [
    {// Create Variable
        id: 'create_variable',
        category: 'variables',
        doNotCopy: true,
        inputs: [
            {id: '_varName', type: SOCKET_TYPE.INFO, hideSocket: true},
            {id: '_varType', type: SOCKET_TYPE.INFO, hideSocket: true},
            {id: 'initial_value', type: SOCKET_TYPE.NUMBER, default: 0, hideSocket: true},
        ],
        outputs: [
            {id: '_value', type: SOCKET_TYPE.ANY, execute: 'getValue'}
        ],
        registerActions(editorAPI: iEditorAPI){
            editorAPI.registerAction<ActionCreateVariable>(
                ActionCreateVariableKey,
                actionCreateVariable,
                revertCreateVariable
            );
            editorAPI.registerAction<ActionEditVariable>(
                ActionEditVariableKey,
                actionEditVariable,
                revertEditVariable
            );
        },
        init(this: GenericNode){
            if (isEngineNode(this)) return;

            this.editorCanDelete = false;
            this.reverseOutputs = true;
            this.showEditButton = true;
            this.inputs.get('_varName')!.enableDecorators = true;
            this.inputs.get('_varType')!.enableDecorators = true;
            this.inputs.get('initial_value')!.flipInput = true;
        },
        onCreate(this: GenericNode){
            if (isEngineNode(this)) return;
            
            this.editorAPI.deleteNodes([this], false);
            this.editorAPI.popLastCommit();

            this.editorAPI.dialogVariable((positive, varInfo) => {
                const args: ActionCreateVariable = {
                    varNode: this,
                    varInfo,
                };

                if (positive){
                    this.editorAPI.executeAction<ActionCreateVariable>(ActionCreateVariableKey, args, true);
                }
            });
        },
        afterSave(this: iEditorNode, saveData: iNodeSaveData){
            const valueInput = saveData.inp.find((input: iAnyObj) => input.id == 'initial_value')!;
            const varInfo = Object.assign({}, this.dataCache.get('varInfo'));

            varInfo.isGlobal = +varInfo.isGlobal;
            varInfo.isList = +varInfo.isList;
            
            saveData.d = varInfo;
            saveData.inp = [valueInput];
        },
        afterLoad(this: GenericNode, saveData){
            const varInfo = saveData.d;

            varInfo.isGlobal = !!varInfo.isGlobal;
            varInfo.isList = !!varInfo.isList;

            this.dataCache.set('varInfo', varInfo);

            if (isEngineNode(this)){
                const {name, isGlobal, type, isList} = varInfo;
                const inputValue = type == SOCKET_TYPE.INSTANCE ? null : this.inputs.get('initial_value')!.value;
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
                this.refresh();
            }
        },
        onMount(this: iEditorNode){
            this.refresh();
        },
        onEdit(this: GenericNode){
            if (isEngineNode(this)) return;

            this.editorAPI.dialogVariable((positive, varInfo)=> {
                if (!positive) return;

                console.clear();
                
                const args: ActionEditVariable = {
                    varNode: this,
                    newVarInfo: varInfo,
                    oldVarInfo: this.dataCache.get('varInfo'),
                    oldInitValue: this.inputs.get('initial_value')!.value,
                };

                this.editorAPI.undoStore.startRecording();
                this.editorAPI.executeAction<ActionEditVariable>(ActionEditVariableKey, args, true);
            }, this.dataCache.get('varInfo'));
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

                this.editorAPI.undoStore.startRecording();
                this.editorAPI.deleteNodes([...selectedNodes, ...allGetSetNodes]);
                this.editorAPI.clearSelectedNodes();
                this.method('editor_deleteVar');
            });
        },
        refresh(this: iEditorNode){
            const downStream = this.editorAPI.getOutputConnections(this, 'initial_value');

            this.method('editor_initVarNode');
            this.method('editor_setVar');

            downStream.forEach(connection => connection.endNode!.refresh());
        },
        methods: {
            getValue(this: iEngineNode, eventContext: iEventContext){
                const {name, isGlobal} = this.dataCache.get('varInfo');
                const variable = isGlobal ? this.engine.getGlobalVariable(name) : eventContext.instance.getLocalVariable(name);
                
                if (variable == undefined){
                    return null;
                }

                return variable.value;
            },
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

                typeSocket.value = {titleId: 'node.create_var_display_type', data: `node.${SOCKET_TYPE[type]}`, translate: true};
                
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
        afterGameDataLoaded: afterGameDataLoaded,
        onNewVariable: onNewVariable,
        onMount(this: iEditorNode){
            this.refresh();
        },
        onNewConnection: determineConnected,
        onRemoveConnection: determineConnected,
        onBeforeDelete: onBeforeDelete,
        onBeforeUnmount: onBeforeUnmount,
        refresh(this: iEditorNode){
            const upStreamConnection = this.editorAPI.getInputConnection(this, 'data');
            this.method('validate');

            if (!upStreamConnection) return;

            const upStreamSocket = this.editorAPI.getConnectedInputSocket(this, 'data', upStreamConnection)!;
            const dataSocket = this.inputs.get('data')!;
            
            if (!canConvertSocket(upStreamSocket.type, dataSocket.type)){
                const isRecording = this.editorAPI.undoStore.isRecording;
                this.editorAPI.deleteConnections([upStreamConnection], isRecording);
            }
        },
        methods: {
            setVar(this: iEngineNode, eventContext: iEventContext){
                const varName = this.getInput<string>('name', eventContext);
                const data = this.getInput<any>('data', eventContext);
                const isGlobal = this.engine.getGlobalVariable(varName) !== undefined;

                isGlobal ? this.engine.setGlobalVariable(varName, data) : eventContext.instance.setLocalVariable(varName, data);
                this.triggerOutput('_o', eventContext);
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
            if (isEngineNode(this)) return;
            
            const nameInput = this.inputs.get('name')!;
            nameInput.flipInput = true;
            this.inputBoxWidth = 6;
            this.stackDataIO = true;
            document.addEventListener('onNewVariable', this.onNewVariable as EventListener);
        },
        onInput: onInput,
        afterGameDataLoaded: afterGameDataLoaded,
        onNewVariable: onNewVariable,
        onMount(this: iEditorNode){
            const outConnections = this.editorAPI.getOutputConnections(this, 'data');
            outConnections.forEach(connection => connection.endNode!.refresh());
        },
        onNewConnection: determineConnected,
        onRemoveConnection: determineConnected,
        onBeforeDelete: onBeforeDelete,
        onBeforeUnmount: onBeforeUnmount,
        refresh(this: iEditorNode){
            const downStream = this.editorAPI.getOutputConnections(this, 'data');

            this.method('validate');

            downStream.forEach(connection => {
                const type = this.outputs.get('data')!.type;
                const socket = connection.endNode!.inputs.get(connection.endSocketId!)!;

                connection.endNode!.refresh();

                if (!canConvertSocket(type, socket.type)){
                    const isRecording = this.editorAPI.undoStore.isRecording;
                    this.editorAPI.deleteConnections([connection], isRecording);
                }
            });
        },
        methods: {
            getVar(this: iEngineNode, eventContext: iEventContext){
                const varName = this.getInput<string>('name', eventContext);
                const isGlobal = this.engine.getGlobalVariable(varName);
                const variable = isGlobal ? this.engine.getGlobalVariable(varName) : eventContext.instance.getLocalVariable(varName);
                
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
            value(this: iEngineNode, eventContext: iEventContext){
                return this.getInput<number>('_number', eventContext);
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
            value(this: iEngineNode, eventContext: iEventContext){
                return this.getInput<string>('_string', eventContext);
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
            value(this: iEngineNode, eventContext: iEventContext){
                return this.getInput<boolean>('_boolean', eventContext);
            },
        }
    },
] satisfies iNodeTemplate[] as iNodeTemplate[];

function actionCreateVariable({varNode, varInfo}: ActionCreateVariable): Partial<ActionCreateVariable> {
    const valSocket = varNode.inputs.get('initial_value')!;

    varNode.dataCache.set('varInfo', varInfo);
    varNode.method('editor_initVarNode');
    valSocket.value = SOCKET_DEFAULT.get(varInfo.type);
    varNode.method('editor_setVar');
    varNode.editorAPI.addNode(varNode, false);
    document.dispatchEvent(new CustomEvent('onNewVariable'));
    return {varNode}
}

function revertCreateVariable({varNode}: ActionCreateVariable): void {
    varNode.editorAPI.deleteNodes([varNode], false);
    varNode.method('editor_deleteVar');
}

function actionEditVariable(args: ActionEditVariable): Partial<ActionEditVariable> {
    const {varNode, newVarInfo, oldVarInfo} = args;
    varNode.dataCache.set('varInfo', newVarInfo);
    varNode.refresh();
    
    //Update data if type changed
    if (newVarInfo.type != oldVarInfo.type){
        const getSetNodes = varNode.editorAPI.getVariableUsage(oldVarInfo.name, null, oldVarInfo.isGlobal);
        
        getSetNodes.forEach(node => node.refresh());
    }

    return args;
}

function revertEditVariable({varNode, newVarInfo, oldVarInfo, oldInitValue}: ActionEditVariable): void {
    varNode.dataCache.set('varInfo', oldVarInfo);
    varNode.refresh();

    if (newVarInfo.type != oldVarInfo.type){
        const getSetNodes = varNode.editorAPI.getVariableUsage(newVarInfo.name, null, newVarInfo.isGlobal);
        const valSocket = varNode.inputs.get('initial_value')!;

        getSetNodes.forEach(node => node.refresh());
        valSocket.value = oldInitValue;
    }
}

function determineConnected(this: iEditorNode){
    const connection = this.editorAPI.getInputConnection(this, 'data') ?? this.editorAPI.getOutputConnections(this, 'data')[0];
    const nameSocket = this.inputs.get('name')!;
    nameSocket.disabled = !!connection;
    this.emit('force-socket-update', 'name');
}

function validate(this: iEditorNode, textbox?: HTMLInputElement){
    const dataSocket = this.inputs.get('data') || this.outputs.get('data')!;
    const varName = textbox?.value ?? this.getInput<string>('name');
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

function afterGameDataLoaded(this: GenericNode){
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
    this.emit('force-update');
}

function onBeforeDelete(this: iEditorNode){
    document.removeEventListener('onNewVariable', this.onNewVariable as EventListener);
}

function onBeforeUnmount(this: iEditorNode){
    document.removeEventListener('onNewVariable', this.onNewVariable as EventListener);
}