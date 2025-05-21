import { iNodeTemplate } from './iNodeTemplate';
import {SOCKET_TYPE, SOCKET_DEFAULT} from './Node_Enums';
import { iEditorNode, iEngineNode, iEventContext, iVarInfo, iEditorAPI } from '../LogicInterfaces';
import { iAnyObj } from '../interfaces';
import { isEngineNode, type GenericNode } from './Node_Library';
import { canConvertSocket } from './Socket_Conversions';
import { NodeSave, NodeSaveId } from '@compiled/SaveTypes';

type ActionCreateVariable = {varNode: iEditorNode, varInfo: iVarInfo};
type ActionEditVariable = {varNode: iEditorNode, newVarInfo: iVarInfo, oldVarInfo: iVarInfo, oldInitValue: any};
type GetSetNodeData = {
    isValid: boolean,
    onNewVariableCB: ()=>void,
};

const ActionCreateVariableKey = Symbol('create variable');
const ActionEditVariableKey = Symbol('edit variable');

const catVariables: iNodeTemplate[] = [];
export default catVariables;

{// Create Variable
    function getValue(this: iEngineNode, eventContext: iEventContext): any {
        const {name, isGlobal} = this.getNodeData<iVarInfo>();
        const variable = isGlobal ? this.engine.getGlobalVariable(name) : eventContext.instance.getLocalVariable(name);
        
        if (variable == undefined){
            return null;
        }

        return variable.value;
    }

    function actionCreateVariable({varNode, varInfo}: ActionCreateVariable): Partial<ActionCreateVariable> {
        const valSocket = varNode.inputs.get('initial_value')!;
    
        varNode.setNodeData<iVarInfo>(varInfo);
        editor_initVarNode.call(varNode);
        valSocket.value = SOCKET_DEFAULT.get(varInfo.type);
        editor_setVar.call(varNode);
        varNode.editorAPI.addNode(varNode, false);
        document.dispatchEvent(new CustomEvent('onNewVariable'));
        return {varNode}
    }

    function revertCreateVariable({varNode}: ActionCreateVariable): void {
        varNode.editorAPI.deleteNodes([varNode], false);
        editor_deleteVar.call(varNode);
    }

    function actionEditVariable(this: iEditorNode, args: ActionEditVariable): Partial<ActionEditVariable> {
        const {varNode, newVarInfo, oldVarInfo} = args;

        //remove old var name from variable map
        editor_deleteVar.call(varNode);

        //update current node
        varNode.setNodeData<iVarInfo>(newVarInfo);
        varNode.refresh();

        //update data if name changed
        if (newVarInfo.name != oldVarInfo.name){
            const getSetNodes = varNode.editorAPI.getVariableUsage(oldVarInfo.name, null, !!oldVarInfo.isGlobal);

            //update all references to use new name
            getSetNodes.forEach(node => {
                node.inputs.get('name')!.value = newVarInfo.name;
                node.refresh();
            });
        }
        
        //Update data if type changed
        if (newVarInfo.type != oldVarInfo.type){
            const getSetNodes = varNode.editorAPI.getVariableUsage(oldVarInfo.name, null, !!oldVarInfo.isGlobal);
            
            getSetNodes.forEach(node => node.refresh());
        }

        return args;
    }

    function revertEditVariable({varNode, newVarInfo, oldVarInfo, oldInitValue}: ActionEditVariable): void {
        //remove old var name from variable map
        editor_deleteVar.call(varNode);

        //revert current node
        varNode.setNodeData<iVarInfo>(oldVarInfo);
        varNode.refresh();

        //revert data if name changed
        if (newVarInfo.name != oldVarInfo.name){
            const getSetNodes = varNode.editorAPI.getVariableUsage(newVarInfo.name, null, !!newVarInfo.isGlobal);

            //update all references to use new name
            getSetNodes.forEach(node => {
                node.inputs.get('name')!.value = oldVarInfo.name;
                node.refresh();
            });
        }

        //revert data if type changed
        if (newVarInfo.type != oldVarInfo.type){
            const getSetNodes = varNode.editorAPI.getVariableUsage(newVarInfo.name, null, !!newVarInfo.isGlobal);
            const valSocket = varNode.inputs.get('initial_value')!;

            getSetNodes.forEach(node => node.refresh());
            valSocket.value = oldInitValue;
        }
    }

    function editor_initVarNode(this: iEditorNode): void {
        const {name, type, isGlobal, isList} = this.getNodeData<iVarInfo>();
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
        outSocket.isList = !!isList;
        this.onForceSocketUpdate.emit();
        this.onRecalcWidth.emit();
    }

    function editor_setVar(this: iEditorNode): void {
        const varInfo = this.getNodeData<iVarInfo>();

        if (!varInfo) return;
        const {name, type, isGlobal, isList} = varInfo;
        
        if (isGlobal){
            this.editorAPI.setGlobalVariable(name, type, !!isList);
        }
        else{
            this.parentScript.setLocalVariable(name, type, !!isList);
        }
    }

    function editor_deleteVar(this: iEditorNode): void {
        const {name, isGlobal} = this.getNodeData<iVarInfo>();
        isGlobal ?
            this.editorAPI.deleteGlobalVariable(name)
            : this.parentScript.deleteLocalVariable(name);
    }

    const createVariable = {
        id: 'create_variable',
        category: 'variables',
        doNotCopy: true,
        editorCanDelete: false,
        showEditButton: true,
        reverseOutputs: true,
        inputs: [
            {id: '_varName', type: SOCKET_TYPE.INFO, hideSocket: true, enableDecorators: true},
            {id: '_varType', type: SOCKET_TYPE.INFO, hideSocket: true, enableDecorators: true},
            {id: 'initial_value', type: SOCKET_TYPE.NUMBER, default: 0, hideSocket: true, flipInput: true},
        ],
        outputs: [
            {id: '_value', type: SOCKET_TYPE.ANY, execute: getValue}
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
        afterSave(this: iEditorNode, saveData: NodeSave){
            const valueInput = saveData[4].find((input: iAnyObj) => input[0] == 'initial_value')!;
            const varInfo = Object.assign({}, this.getNodeData<iVarInfo>());

            varInfo.isGlobal = varInfo.isGlobal ? 1 : 0;
            varInfo.isList = varInfo.isList ? 1 : 0;
            
            saveData[NodeSaveId.extra] = varInfo;
            saveData[NodeSaveId.inputs][0] = valueInput;
        },
        afterLoad(this: GenericNode, saveData: NodeSave){
            const varInfo = saveData[NodeSaveId.extra];

            varInfo.isGlobal = !!varInfo.isGlobal;
            varInfo.isList = !!varInfo.isList;

            this.setNodeData<iVarInfo>(varInfo);

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
                
                const args: ActionEditVariable = {
                    varNode: this,
                    newVarInfo: varInfo,
                    oldVarInfo: this.getNodeData<iVarInfo>(),
                    oldInitValue: this.inputs.get('initial_value')!.value,
                };

                this.editorAPI.undoStore.startRecording();
                this.editorAPI.executeAction<ActionEditVariable>(ActionEditVariableKey, args, true);
            }, this.getNodeData<iVarInfo>());
        },
        onDeleteStopped(this: iEditorNode, protectedNodes: iEditorNode[]){
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
                editor_deleteVar.call(this);
            });
        },
        refresh(this: iEditorNode){
            const downStream = this.editorAPI.getOutputConnections(this, 'initial_value');

            editor_initVarNode.call(this);
            editor_setVar.call(this);

            downStream.forEach(connection => connection.endNode!.refresh());
        },
    };
    catVariables.push(createVariable);
}

{// Set Variable
    function setVar(this: iEngineNode, eventContext: iEventContext): void {
        const varName = this.getInput<string>('name', eventContext);
        const data = this.getInput<any>('data', eventContext);
        const isGlobal = this.engine.getGlobalVariable(varName) !== null;
        const isDefined = !!(isGlobal || eventContext.instance.getLocalVariable(varName));

        if (isDefined){
            isGlobal ? this.engine.setGlobalVariable(varName, data) : eventContext.instance.setLocalVariable(varName, data);
        }
        else{
            this.engine.nodeException({
                errorId: Symbol.for(this.nodeId.toString() + 'no_variable_found'),
                msgId: 'node.error_var_not_found',
                msgVars: [varName],
                logicId: this.parentScript.id,
                nodeId: this.nodeId,
                fatal: false,
            });
        }

        this.triggerOutput('_o', eventContext);
    }

    const setVariable = {
        id: 'set_variable',
        category: 'variables',
        inputBoxWidth: 6,
        inTriggers: [
            {id: '_i', execute: setVar},
        ],
        outTriggers: ['_o'],
        inputs: [
            {id: 'name', type: SOCKET_TYPE.STRING, default: '', hideSocket: true, enableDecorators: true},
            {id: 'data', type: SOCKET_TYPE.ANY, default: null, disabled: true, hideInput: true},
        ],
        init(this: GenericNode){
            if (isEngineNode(this)) return;
            const nodeData = {
                isValid: false,
                onNewVariableCB: this.onNewVariable!.bind(this),
            };
            this.setNodeData<GetSetNodeData>(nodeData);
            document.addEventListener('onNewVariable', nodeData.onNewVariableCB as EventListener);
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
        onBeforeUnmount(this: iEditorNode){
            const cb = this.getNodeData<GetSetNodeData>().onNewVariableCB;
            document.removeEventListener('onNewVariable', cb as EventListener);
            this.editorAPI.clearNodeException(getNoVariableFoundKey(this));
        },
        refresh(this: iEditorNode){
            const upStreamConnection = this.editorAPI.getInputConnection(this, 'data');
            validate.call(this);

            if (!upStreamConnection) return;

            const upStreamSocket = this.editorAPI.getConnectedInputSocket(this, 'data', upStreamConnection)!;
            const dataSocket = this.inputs.get('data')!;
            
            if (!(canConvertSocket(upStreamSocket.type, dataSocket.type) && this.getNodeData<GetSetNodeData>().isValid)){
                const isRecording = this.editorAPI.undoStore.isRecording;
                this.editorAPI.deleteConnections([upStreamConnection], isRecording);

                this.editorAPI.pushNodeException({
                    errorId: Symbol.for(this.nodeId.toString() + 'connection_deleted'),
                    msgId: 'node.connection_deleted',
                    logicId: this.parentScript.id,
                    nodeId: this.nodeId,
                    fatal: false,
                });
            }
        },
    };
    catVariables.push(setVariable);
}

{// Get Variable
    type IsValid = boolean;

    function getVar(this: iEngineNode, eventContext: iEventContext): void {
        const varName = this.getInput<string>('name', eventContext);
        const isGlobal = this.engine.getGlobalVariable(varName);
        const variable = isGlobal ? isGlobal : eventContext.instance.getLocalVariable(varName);
        
        //this condition should be impossible due to being unable to connect a non-existant variable
        if (variable == null){
            this.engine.nodeException({
                errorId: Symbol.for(this.nodeId.toString() + 'no_variable_found'),
                msgId: 'node.error_var_not_found',
                msgVars: [varName],
                logicId: this.parentScript.id,
                nodeId: this.nodeId,
                fatal: true,
            });
            throw new Error(`attempt to read from ${isGlobal ? 'global' : 'local'} variable ${varName} which does not exist`);
        }

        return variable.value;
    }

    const getVariable = {
        id: 'get_variable',
        category: 'variables',
        inputBoxWidth: 6,
        stackDataIO: true,
        inputs: [
            {id: 'name', type: SOCKET_TYPE.STRING, default: '', hideSocket: true, flipInput: true},
        ],
        outputs: [
            {id: 'data', type: SOCKET_TYPE.ANY, disabled: true, execute: getVar},
        ],
        init(this: GenericNode){
            if (isEngineNode(this)) return;
            const nodeData = {
                isValid: false,
                onNewVariableCB: this.onNewVariable!.bind(this),
            };
            this.setNodeData<GetSetNodeData>(nodeData);
            document.addEventListener('onNewVariable', nodeData.onNewVariableCB as EventListener);
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
        onBeforeUnmount(this: iEditorNode){
            const cb = this.getNodeData<GetSetNodeData>().onNewVariableCB;
            document.removeEventListener('onNewVariable', cb as EventListener);
            this.editorAPI.clearNodeException(getNoVariableFoundKey(this));
        },
        refresh(this: iEditorNode){
            const downStream = this.editorAPI.getOutputConnections(this, 'data');
            const nodeExceptionData = {
                errorId: Symbol.for(this.nodeId.toString() + 'connection_deleted'),
                msgId: 'node.connection_deleted',
                logicId: this.parentScript.id,
                nodeId: this.nodeId,
                fatal: false,
            };

            validate.call(this);

            downStream.forEach(connection => {
                const type = this.outputs.get('data')!.type;
                const socket = connection.endNode!.inputs.get(connection.endSocketId!)!;

                connection.endNode!.refresh();

                if (!canConvertSocket(type, socket.type)){
                    const isRecording = this.editorAPI.undoStore.isRecording;
                    this.editorAPI.deleteConnections([connection], isRecording);

                    this.editorAPI.pushNodeException(nodeExceptionData);
                }
            });

            if (!this.getNodeData<IsValid>()){
                this.editorAPI.pushNodeException(nodeExceptionData);
            }
        },
    };
    catVariables.push(getVariable);
}

{// Number
    function value(this: iEngineNode, eventContext: iEventContext): number {
        return this.getInput<number>('_number', eventContext);
    }

    const num = {
        id: 'number',
        category: 'variables',
        inputs: [
            {id: '_number', type: SOCKET_TYPE.NUMBER, default: 0, required: true, hideSocket: true},
        ],
        outputs: [
            {id: '_out', type: SOCKET_TYPE.NUMBER, execute: value},
        ],
    };
    catVariables.push(num);
}

{// String
    function value(this: iEngineNode, eventContext: iEventContext): string {
        return this.getInput<string>('_string', eventContext);
    }

    const str = {
        id: 'string',
        category: 'variables',
        inputs: [
            {id: '_string', type: SOCKET_TYPE.STRING, default: '', hideSocket: true},
        ],
        outputs: [
            {id: '_out', type: SOCKET_TYPE.STRING, execute: value},
        ],
    };
    catVariables.push(str);
}

{// Boolean
    function value(this: iEngineNode, eventContext: iEventContext): boolean {
        return this.getInput<boolean>('_boolean', eventContext);
    }

    const bool = {
        id: 'boolean',
        category: 'variables',
        inputs: [
            {id: '_boolean', type: SOCKET_TYPE.BOOL, default: false, hideSocket: true},
        ],
        outputs: [
            {id: '_out', type: SOCKET_TYPE.BOOL, execute: value},
        ],
    };
    catVariables.push(bool);
}

function determineConnected(this: iEditorNode){
    setTimeout(()=>{
        const connection = this.editorAPI.getInputConnection(this, 'data') ?? this.editorAPI.getOutputConnections(this, 'data')[0];
        const nameSocket = this.inputs.get('name')!;
        nameSocket.disabled = !!connection;
        this.onForceSocketUpdate.emit('name');
    });
}

function getNoVariableFoundKey(node: GenericNode): symbol {
    return Symbol.for(node.nodeId.toString() + 'no_variable_found');
}

function validate(this: iEditorNode, textbox?: HTMLInputElement){
    const noVariableFoundKey = getNoVariableFoundKey(this);
    const dataSocket = this.inputs.get('data') || this.outputs.get('data')!;
    const varName = textbox?.value ?? this.getInput<string>('name');
    const globalGet = this.editorAPI.getGlobalVariable(varName);
    const localGet = this.parentScript.getLocalVariable(varName);
    const isValid = !!globalGet || !!localGet;

    if (isValid){
        const variable = localGet ?? globalGet!;

        //Warn of a possible name conflict between local and global variables
        if (!!globalGet && !!localGet){
            this.editorAPI.pushNodeException({
                errorId: Symbol.for(this.nodeId.toString() + 'global_local_conflict'),
                msgId: 'logic_editor.local_global_name_warning',
                logicId: this.parentScript.id,
                nodeId: this.nodeId,
                fatal: false,
            });
        }

        dataSocket.disabled = false;
        dataSocket.type = variable.type;
        dataSocket.isList = variable.isList;
        this.editorAPI.clearNodeException(noVariableFoundKey);
    }
    else if (varName.length){
        dataSocket.disabled = true;
        dataSocket.type = SOCKET_TYPE.ANY;
        dataSocket.isList = false;

        this.editorAPI.pushNodeException({
            errorId: noVariableFoundKey,
            msgId: 'node.error_var_not_found',
            msgVars: [varName],
            logicId: this.parentScript.id,
            nodeId: this.nodeId,
            fatal: false,
            onClearCallback: ()=>{
                setTimeout(()=>{
                    if (!this.domRef) return;
                    validate.call(this, textbox)
                });
            },
        });
    }

    this.getNodeData<GetSetNodeData>().isValid = isValid;
    this.onForceSocketUpdate.emit('data');
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
        validate.call(this);
    }
}

function onInput(this: iEditorNode, event: InputEvent){
    validate.call(this, event.target as HTMLInputElement);
}

function onNewVariable(this: iEditorNode){
    validate.call(this);
    this.onForceUpdate.emit();
}

function onBeforeDelete(this: iEditorNode){
    document.removeEventListener('onNewVariable', this.onNewVariable as EventListener);
}