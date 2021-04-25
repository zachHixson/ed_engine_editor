<template>
    <div class="roomMain">
        <div v-if="selectedRoom" class="toolPanel">
            <Tool
                :key="tool.tool"
                v-for="tool in tools"
                :icon="tool.icon"
                :name="tool.text"
                :tool="tool.tool"
                :curSelection="curToolSelection"
                @toolClicked="toolClicked"/>
            <div class="toolSpacer"></div>
            <Tool
                :tool="0"
                icon="assets/grid"
                :name="$t('room_editor.toggle_grid')"
                :toggled="viewGrid"
                @toolClicked="$store.dispatch('RoomEditor/setGridState', !viewGrid)"/>
        </div>
        <RoomEditWindow
            v-if="isRoomSelected"
            ref="editWindow"
            class="editWindow"
            :selectedRoom="selectedRoom"
            :undoLength="undoStore.undoLength"
            :redoLength="undoStore.redoLength"
            @mouse-event="mouseEvent"
            @undo="applyChronoStep(undoStore.stepBack(), revertMap)"
            @redo="applyChronoStep(undoStore.stepForward(), actionMap)"/>
        <div v-else class="noRoomSelected">{{$t('room_editor.no_room_selected')}}</div>
        <div v-if="selectedRoom" class="propertyPanel">
            <button v-show="propertiesOpen" class="resizeBtn" @click="propertiesOpen = false; resize()">
                &gt;
            </button>
            <button v-show="!propertiesOpen" class="resizeBtn" @click="propertiesOpen = true; resize()">
                &lt;
            </button>
            <div v-show="propertiesOpen" class="propertiesContents">
                <Properties
                    ref="props"
                    :selectedTool="curToolSelection"
                    :selectedEntity="editorSelection"
                    :camera="(selectedRoom) ? selectedRoom.camera : null"
                    :room="selectedRoom"
                    @inst-prop-set="actionInstanceChange({newState: $event})"
                    @inst-group-changed="actionInstanceGroupChange($event)"
                    @inst-var-changed="actionInstanceVarChange({changeObj: $event})"
                    @cam-prop-set="actionCameraChange({newState: $event})"
                    @exit-prop-set="actionExitChange({newState: $event})"
                    @exit-delete="actionExitDelete({exitId: $event.id, pos: $event.pos})"
                    @room-prop-set="actionRoomPropChange({newState: $event})"
                    @room-var-changed="actionRoomVarChange({changeObj: $event})"/>
            </div>
        </div>
    </div>
</template>

<script>
import Vue from 'vue';
import Victor from 'victor';
import {ROOM_TOOL_TYPE, ROOM_ACTION, MOUSE_EVENT, CATEGORY_ID} from '@/common/Enums';
import Undo_Store from '@/common/Undo_Store';
import Util_2D from '@/common/Util_2D';
import RoomEditWindow from './RoomEditWindow';
import Properties from './Properties';
import Tool from '@/components/common/Tool';

export default {
    name: 'RoomEditor',
    components: {
        RoomEditWindow,
        Properties,
        Tool
    },
    data() {
        return {
            propertiesOpen: this.$store.getters['RoomEditor/getPropPanelState'],
            selectedRoom: this.$store.getters['AssetBrowser/getSelectedRoom'],
            editorSelection: null,
            tools: [
                {
                    tool: ROOM_TOOL_TYPE.SELECT_MOVE,
                    text: this.$t('room_editor.select_move'),
                    icon: 'assets/select_move'
                },
                {
                    tool: ROOM_TOOL_TYPE.ADD_BRUSH,
                    text: this.$t('room_editor.add_brush'),
                    icon: 'assets/brush_add'
                },
                {
                    tool: ROOM_TOOL_TYPE.ERASER,
                    text: this.$t('room_editor.eraser'),
                    icon: 'assets/eraser'
                },
                {
                    tool: ROOM_TOOL_TYPE.CAMERA,
                    text: this.$t('room_editor.camera'),
                    icon: 'assets/camera'
                },
                {
                    tool: ROOM_TOOL_TYPE.EXIT,
                    text: this.$t('room_editor.exit'),
                    icon: 'assets/exit'
                },
                {
                    tool: ROOM_TOOL_TYPE.ROOM_PROPERTIES,
                    text: this.$t('room_editor.room_props'),
                    icon: 'assets/gear'
                }
            ],
            undoStore: new Undo_Store(32, false),
            toolMap: new Map(),
            actionMap: new Map(),
            revertMap: new Map(),
            mouse: {
                down: false,
                wpLastDown: new Victor(0, 0),
                downOnSelection: false,
                newSelection: false,
                cellCache: []
            },
            squashCounter: 0
        }
    },
    computed: {
        curToolSelection() {
            return this.$store.getters['RoomEditor/getSelectedTool'];
        },
        viewGrid() {
            return this.$store.getters['RoomEditor/getGridState'];
        },
        isRoomSelected() {
            return this.selectedRoom != null;
        }
    },
    mounted() {
        this.resize();

        this.toolMap.set(ROOM_TOOL_TYPE.SELECT_MOVE, this.toolSelectMove);
        this.toolMap.set(ROOM_TOOL_TYPE.ADD_BRUSH, this.toolAddBrush);
        this.toolMap.set(ROOM_TOOL_TYPE.ERASER, this.toolEraser);
        this.toolMap.set(ROOM_TOOL_TYPE.EXIT, this.toolExit);
        this.toolMap.set(ROOM_TOOL_TYPE.CAMERA, this.toolCamera);

        this.actionMap.set(ROOM_ACTION.MOVE, this.actionMove);
        this.actionMap.set(ROOM_ACTION.ADD, this.actionAdd);
        this.actionMap.set(ROOM_ACTION.DELETE, this.actionDelete);
        this.actionMap.set(ROOM_ACTION.INSTANCE_CHANGE, this.actionInstanceChange);
        this.actionMap.set(ROOM_ACTION.INSTANCE_GROUP_CHANGE, this.actionInstanceGroupChange);
        this.actionMap.set(ROOM_ACTION.INSTANCE_VAR_CHANGE, this.actionInstanceVarChange);
        this.actionMap.set(ROOM_ACTION.EXIT_ADD, this.actionExitAdd);
        this.actionMap.set(ROOM_ACTION.EXIT_CHANGE, this.actionExitChange);
        this.actionMap.set(ROOM_ACTION.EXIT_DELETE, this.actionExitDelete);
        this.actionMap.set(ROOM_ACTION.CAMERA_CHANGE, this.actionCameraChange);
        this.actionMap.set(ROOM_ACTION.ROOM_PROP_CHANGE, this.actionRoomPropChange);
        this.actionMap.set(ROOM_ACTION.ROOM_VAR_CHANGE, this.actionRoomVarChange);

        this.revertMap.set(ROOM_ACTION.MOVE, this.revertMove);
        this.revertMap.set(ROOM_ACTION.ADD, this.revertAdd);
        this.revertMap.set(ROOM_ACTION.DELETE, this.revertDelete);
        this.revertMap.set(ROOM_ACTION.INSTANCE_CHANGE, this.revertInstanceChange);
        this.revertMap.set(ROOM_ACTION.INSTANCE_GROUP_CHANGE, this.revertInstanceGroupChange);
        this.revertMap.set(ROOM_ACTION.INSTANCE_VAR_CHANGE, this.revertInstanceVarChange);
        this.revertMap.set(ROOM_ACTION.EXIT_ADD, this.revertExitAdd);
        this.revertMap.set(ROOM_ACTION.EXIT_CHANGE, this.revertExitChange);
        this.revertMap.set(ROOM_ACTION.EXIT_DELETE, this.revertExitDelete);
        this.revertMap.set(ROOM_ACTION.CAMERA_CHANGE, this.revertCameraChange);
        this.revertMap.set(ROOM_ACTION.ROOM_PROP_CHANGE, this.revertRoomPropChange);
        this.revertMap.set(ROOM_ACTION.ROOM_VAR_CHANGE, this.revertRoomVarChange);

        this.$nextTick(()=>{
            this.updateAssetSelection();
        })
    },
    beforeDestroy() {
        this.$store.dispatch('RoomEditor/setPropPanelState', this.propertiesOpen);
    },
    methods: {
        updateAssetSelection() {
            let selectedRoom = this.$store.getters['AssetBrowser/getSelectedRoom'];
            this.selectedRoom = selectedRoom;
            
            if (selectedRoom && selectedRoom != this.selectedRoom){
                this.$nextTick(()=>{
                    this.updateEditorSelection(null);
                });
            }
        },
        updateEditorSelection(newSelection){
            this.editorSelection = newSelection;
            this.$refs.editWindow.setSelection(this.editorSelection);
        },
        resize() {
            this.$nextTick(()=>{
                if (this.$refs.editWindow){
                    this.$refs.editWindow.resize();
                }
            });
        },
        bgColorChanged(){
            this.$refs.editWindow.bgColorChanged();
        },
        toolClicked(tool){
            this.selectedTool = tool;
            this.$store.dispatch('RoomEditor/setSelectedTool', tool);
            this.$store.dispatch('RoomEditor/setSelectedNavTool', null);
        },
        selectInstanceByPos(pos){
            let nearbyInst = this.selectedRoom.getInstancesInRadius(pos, 0);

            if (nearbyInst.length > 0){
                let selectedInListIdx = -1;
                let instInCell = [];

                //get instances in same sell
                for (let i = 0; i < nearbyInst.length; i++){
                    if (Util_2D.compareVector(pos, nearbyInst[i].pos)){
                        instInCell.push(nearbyInst[i]);
                    }
                }

                //search instances in cell for selected instance
                for (let i = 0; i < instInCell.length && selectedInListIdx < 0; i++){
                    if (this.editorSelection?.id == instInCell[i].id){
                        selectedInListIdx = i;
                    }
                }

                //if selected instance is in current cell, then select next item in cell
                if (selectedInListIdx >= 0){
                    this.updateEditorSelection(instInCell[++selectedInListIdx % instInCell.length]);
                }
                else{
                    this.updateEditorSelection(instInCell[0]);
                }
            }
            else{
                this.updateEditorSelection(null);
            }
        },
        mouseEvent(mEvent){
            let toolScript = this.toolMap.get(this.curToolSelection);

            if (mEvent.type == MOUSE_EVENT.DOWN){
                this.mouse.down = true;
                this.mouse.wpLastDown.copy(mEvent.worldPos);
            }
            else if (mEvent.type == MOUSE_EVENT.UP){
                this.mouse.down = false;
            }
            
            if (toolScript){
                toolScript(mEvent);
            }
        },
        toolSelectMove(mEvent){
            switch(mEvent.type){
                case MOUSE_EVENT.DOWN:
                    if (this.editorSelection == null){
                        this.selectInstanceByPos(mEvent.worldCell);
                        this.mouse.newSelection = true;
                    }
                    else if (Util_2D.compareVector(this.editorSelection.pos, mEvent.worldCell)){
                        this.mouse.downOnSelection = true;
                        this.mouse.cellCache.push(mEvent.worldCell.clone());
                    }
                    break;
                case MOUSE_EVENT.MOVE:
                    if (
                        this.mouse.down &&
                        this.mouse.downOnSelection &&
                        !Util_2D.compareVector(this.mouse.cellCache[0], mEvent.worldCell)
                    ){
                        this.actionMove({instRef: this.editorSelection, newPos: mEvent.worldCell});
                        this.squashCounter++;
                        this.mouse.cellCache[0].copy(mEvent.worldCell);
                    }
                    break;
                case MOUSE_EVENT.UP:
                    if (Util_2D.compareVector(mEvent.worldPos, this.mouse.wpLastDown) && !this.mouse.newSelection){
                        this.selectInstanceByPos(mEvent.worldCell);
                    }

                    if (this.squashCounter > 0){
                        this.squashActions();
                    }

                    this.mouse.downOnSelection = false;
                    this.mouse.newSelection = false;
                    this.mouse.cellCache = [];
                    break;
            }
        },
        toolAddBrush(mEvent){
            let selectedAsset = this.$store.getters['AssetBrowser/getSelectedAsset'];

            switch(mEvent.type){
                case MOUSE_EVENT.MOVE:
                case MOUSE_EVENT.DOWN:
                    let hasVisited = false;

                    //check if cell has already been visited
                    for (let i = 0; i < this.mouse.cellCache.length; i++){
                        hasVisited |= Util_2D.compareVector(this.mouse.cellCache[i], mEvent.worldCell);
                    }

                    if (!hasVisited && this.mouse.down){
                        if (this.mouse.down && selectedAsset?.category_ID == CATEGORY_ID.OBJECT){
                            this.actionAdd({objId: selectedAsset.ID, pos: mEvent.worldCell});
                            this.squashCounter++;
                        }
                        
                        this.mouse.cellCache.push(mEvent.worldCell.clone());
                    }

                    break;
                case MOUSE_EVENT.UP:
                    this.squashActions();
                    this.mouse.cellCache = [];
                    break;
            }
        },
        toolEraser(mEvent){
            switch(mEvent.type){
                case MOUSE_EVENT.MOVE:
                case MOUSE_EVENT.DOWN:
                    let removedFromCell = false;

                    if (this.mouse.cellCache.length > 0){
                        removedFromCell |= Util_2D.compareVector(this.mouse.cellCache[0], mEvent.worldCell);
                    }

                    if (!removedFromCell && this.mouse.down){
                        let instances = this.selectedRoom.getInstancesInRadius(mEvent.worldCell, 60);
                        instances = instances.filter((i) => Util_2D.compareVector(i.pos, mEvent.worldCell));
                        instances.sort((a, b) => a.zDepth > b.zDepth);

                        if (instances.length > 0){
                            this.actionDelete({instId: instances[0].id, pos: instances[0].pos});
                            this.squashCounter++;
                        }

                        this.mouse.cellCache[0] = mEvent.worldCell;
                    }
                    break;
                case MOUSE_EVENT.UP:
                    this.squashActions();
            }
        },
        toolCamera(mEvent){
            switch(mEvent.type){
                case MOUSE_EVENT.MOVE:
                case MOUSE_EVENT.DOWN:
                    if (this.mouse.down){
                        this.actionCameraChange({newState: {pos: mEvent.worldCell}});
                    }
                    break;
            }
        },
        toolExit(mEvent){
            if (mEvent.type == MOUSE_EVENT.DOWN){
                let exitsAtCursor = this.selectedRoom.getExitsAtPosition(mEvent.worldCell);
                exitsAtCursor = exitsAtCursor.filter(e => Util_2D.compareVector(e.pos, mEvent.worldCell));

                if (exitsAtCursor.length > 0){
                    this.updateEditorSelection(exitsAtCursor[0]);
                }
                else{
                    this.updateEditorSelection(this.actionExitAdd({pos: mEvent.worldCell}));
                }
            }
        },
        actionMove({instId, instRef, newPos}, makeCommit = true){
            let oldPos;

            if (!instRef){
                instRef = this.selectedRoom.getInstanceById(instId);
            }

            oldPos = instRef.pos.clone();
            this.selectedRoom.setInstancePosition(instRef, newPos);
            this.$refs.editWindow.instancesChanged();

            if (makeCommit){
                let data = {instId: instRef.id, instRef, newPos: newPos.clone(), oldPos}
                this.undoStore.commit({action: ROOM_ACTION.MOVE, data});
            }
        },
        actionAdd({objId, instRef, pos}, makeCommit = true){
            let object = this.$store.getters['GameData/getAllObjects'].filter((o) => o.ID == objId)[0];
            let newInstance = this.selectedRoom.addInstance(object, pos);

            if (instRef){
                Object.assign(newInstance, instRef);
            }

            this.$refs.editWindow.instancesChanged();

            if (makeCommit){
                let data = {objId, pos: pos.clone(), instRef: newInstance};
                this.undoStore.commit({action: ROOM_ACTION.ADD, data});
            }
        },
        actionDelete({instId, pos}, makeCommit = true){
            let instRef = this.selectedRoom.removeInstance(instId, pos);
            this.$refs.editWindow.instancesChanged();

            if (instRef == this.editorSelection){
                this.updateEditorSelection(null);
            }

            if (makeCommit){
                let data = {instId, instRef, pos}
                this.undoStore.commit({action: ROOM_ACTION.DELETE, data})
            }
        },
        actionInstanceChange({newState}, makeCommit = true){
            let oldState = Object.assign({}, this.editorSelection);

            Object.assign(this.editorSelection, newState);
            this.$refs.editWindow.instancesChanged();

            if (makeCommit){
                let data = {newState, oldState, instRef: this.editorSelection};
                this.undoStore.commit({action: ROOM_ACTION.INSTANCE_CHANGE, data});
            }
        },
        actionInstanceGroupChange({add, groupName, newName, remove, oldIdx, instRef}, makeCommit = true){
            let groups;

            if (instRef){
                groups = instRef.groups;
            }
            else{
                groups = this.editorSelection.groups;
            }

            if (add){
                groups.push(groupName);
            }
            else if (newName){
                let idx = groups.indexOf(groupName);
                Vue.set(groups, idx, newName);
            }
            else if (remove){
                let idx = groups.indexOf(groupName);
                groups.splice(idx, 1);
            }

            if (makeCommit){
                let data = {add, groupName, newName, remove, oldIdx, instRef: this.editorSelection};
                this.undoStore.commit({action: ROOM_ACTION.INSTANCE_GROUP_CHANGE, data});
            }
        },
        actionInstanceVarChange({changeObj}, makeCommit = true){
            let varList = this.editorSelection.customVars;
            
            this.changeCustomVar(varList, changeObj);

            if (makeCommit){
                let data = {changeObj, instRef: this.editorSelection};
                this.undoStore.commit({action: ROOM_ACTION.INSTANCE_VAR_CHANGE, data});
            }
        },
        actionCameraChange({newState}, makeCommit = true){
            let oldState = Object.assign({}, this.selectedRoom.camera);

            Object.assign(this.selectedRoom.camera, newState);
            this.$refs.editWindow.cameraChanged();

            if (makeCommit){
                let data = {newState, oldState};
                this.undoStore.commit({action: ROOM_ACTION.CAMERA_CHANGE, data});
            }
        },
        actionExitAdd({exitRef, pos}, makeCommit = true){
            let newExit = this.selectedRoom.addExit(pos);
            let newExitName = this.$t('room_editor.new_exit_prefix') + newExit.id;

            if (exitRef){
                Object.assign(newExit, exitRef);
                newExitName = exitRef.name;
            }

            newExit.name = newExitName;
            this.$refs.editWindow.instancesChanged();

            if (makeCommit){
                let data = {exitRef: newExit, pos: pos.clone()};
                this.undoStore.commit({action: ROOM_ACTION.EXIT_ADD, data});
            }

            return newExit;
        },
        actionExitChange({newState}, makeCommit = true){
            let oldState = Object.assign({}, this.editorSelection);

            Object.assign(this.editorSelection, newState);
            this.$refs.editWindow.instancesChanged();

            if (makeCommit){
                let data = {newState, oldState, exitRef: this.editorSelection};
                this.undoStore.commit({action: ROOM_ACTION.EXIT_CHANGE, data});
            }
        },
        actionExitDelete({exitId, pos}, makeCommit = true){
            let exitRef = this.selectedRoom.removeExit(exitId, pos);
            this.updateEditorSelection(null);
            this.$refs.editWindow.instancesChanged();

            if (makeCommit){
                let data = {exitId, exitRef, pos};
                this.undoStore.commit({action: ROOM_ACTION.EXIT_DELETE, data});
            }
        },
        actionRoomPropChange({newState}, makeCommit = true){
            let oldState = Object.assign({}, this.selectedRoom);

            Object.assign(this.selectedRoom, newState);

            if (oldState.bgColor != this.selectedRoom.bgColor){
                this.$refs.props.updateBGColorPicker(this.selectedRoom.bgColor);
                this.bgColorChanged();
            }

            if (makeCommit){
                let data = {newState, oldState};
                this.undoStore.commit({action: ROOM_ACTION.ROOM_PROP_CHANGE, data});
            }
        },
        actionRoomVarChange({changeObj}, makeCommit = true){
            let varList = this.selectedRoom.customVars;
            let varIdx = this.changeCustomVar(varList, changeObj);

            if (makeCommit){
                let data = {changeObj};
                this.undoStore.commit({action: ROOM_ACTION.ROOM_VAR_CHANGE, data});
            }
        },
        revertMove({instRef, oldPos}){
            this.selectedRoom.setInstancePosition(instRef, oldPos);
            this.$refs.editWindow.instancesChanged();
        },
        revertAdd({instRef}){
            this.selectedRoom.removeInstance(instRef.id, instRef.pos);
            this.$refs.editWindow.instancesChanged();
        },
        revertDelete({instRef}){
            let instance = this.selectedRoom.addInstance(instRef.objRef, instRef.pos);
            Object.assign(instance, instRef);
            this.$refs.editWindow.instancesChanged();
        },
        revertInstanceChange({oldState, instRef}){
            Object.assign(instRef, oldState);
            this.$refs.editWindow.instancesChanged();
        },
        revertInstanceGroupChange({add, groupName, newName, remove, oldIdx, instRef}){
            let groups = instRef.groups;

            if (add){
                let idx = instRef.groups.indexOf(groupName);
                groups.splice(idx, 1);
            }
            else if (newName){
                let idx = instRef.groups.indexOf(newName);
                Vue.set(groups, idx, groupName);
            }
            else if (remove){
                groups.splice(oldIdx, 0, groupName);
            }
        },
        revertInstanceVarChange({changeObj, instRef}){
            let varList = instRef.customVars;
            this.unchangeCustomVar(varList, changeObj);
        },
        revertCameraChange({oldState}){
            Object.assign(this.selectedRoom.camera, oldState);
            this.$refs.editWindow.cameraChanged();
        },
        revertExitAdd({exitRef}){
            this.selectedRoom.removeExit(exitRef.id, exitRef.pos);
            this.$refs.editWindow.instancesChanged();
        },
        revertExitDelete({exitRef}){
            let exit = this.selectedRoom.addExit(exitRef.pos);
            Object.assign(exit, exitRef);
            this.$refs.editWindow.instancesChanged();
        },
        revertExitChange({oldState, exitRef}){
            Object.assign(exitRef, oldState);
            this.$refs.editWindow.instancesChanged();
        },
        revertRoomPropChange({oldState}){
            let oldBG = this.selectedRoom.bgColor;

            Object.assign(this.selectedRoom, oldState);

            if (oldBG != this.selectedRoom.bgColor){
                this.$refs.props.updateBGColorPicker(this.selectedRoom.bgColor);
                this.bgColorChanged();
            }
        },
        revertRoomVarChange({changeObj}){
            let varList = this.selectedRoom.customVars;
            this.unchangeCustomVar(varList, changeObj);
        },
        changeCustomVar(varList, {varName, newName, newVal, add, remove, oldIdx}){
            let varIdx = -1;

            for (let i = 0; i < varList.length && varIdx < 0; i++){
                varIdx = (varList[i].name == varName) ? i : -1;
            }

            if (varIdx >= 0){
                if (newVal){
                    varList[varIdx].val = newVal;
                }

                if (newName){
                    varList[varIdx].name = newName;
                }

                if (remove){
                    varList.splice(varIdx, 1);
                }
            }
            else{
                let newVar = {name: varName, val: newVal};

                if (oldIdx){
                    varList.splice(oldIdx, 0, newVar)
                }
                else{
                    varList.push(newVar);
                }
            }
        },
        unchangeCustomVar(varList, {varName, newName, oldVal, newVal, add, remove, oldIdx}){
            if (varName && newName){
                this.changeCustomVar(varList, {varName: newName, newName: varName});
            }
            else if (newVal && oldVal){
                this.changeCustomVar(varList, {varName, newVal: oldVal});
            }
            else if (add){
                this.changeCustomVar(varList, {varName, remove: true});
            }
            else if (remove){
                this.changeCustomVar(varList, {varName, newVal, oldIdx});
            }
        },
        applyChronoStep(step, map){
            if (step.squashList){
                for (let i = 0; i < step.squashList.length; i++){
                    this.applyChronoStep(step.squashList[i], map);
                }
            }
            else{
                let action = map.get(step.action);
                
                action(step.data, false);
            }
        },
        squashActions(){
            this.undoStore.squashCommits(this.squashCounter);
            this.squashCounter = 0;
        }
    }
}
</script>

<style scoped>
.roomMain{
    display: flex;
    flex-direction: row;
    justify-content: space-between;
    width: 100%;
    height: 100%;
}

.toolPanel{
    flex-shrink: 0;
    width: auto;
    height: 100%;
    padding: 0;
    margin: 0;
    background: #CCCCCC;
}

.propertyPanel{
    display: flex;
    flex-direction: row;
    height: 100%;
    background: #CCCCCC;
    z-index: 5;
}

.propertiesContents{
    width: 250px;
}

.resizeBtn{
    display: flex;
    justify-content: center;
    align-items: center;
    align-self: center;
    width: 10px;
    height: 50px;
    background: none;
    border: 1px solid black;
}

.toolSpacer{
    width: 100%;
    height: 10px;
}

.noRoomSelected{
    flex-grow: 1;
    display: flex;
    justify-content: center;
    align-items: center;
}
</style>