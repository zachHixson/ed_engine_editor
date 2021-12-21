<template>
    <div class="roomMain" :style="cssBG">
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
            :editorSelection="editorSelection"
            :undoLength="undoStore.undoLength"
            :redoLength="undoStore.redoLength"
            @mouse-event="mouseEvent"
            @undo="stepBackward"
            @redo="stepForward"
            @mouseenter.native="mouse.inWindow = true"
            @mouseleave.native="mouse.inWindow = false"/>
        <div v-else class="noRoomSelected">{{$t('room_editor.no_room_selected')}}</div>
        <div v-if="selectedRoom" class="propertyPanel" :class="{propertiesClosed : !propertiesOpen}">
            <div class="resizeBtnWrapper">
                <button class="resizeBtn" @click="propertiesOpen = !propertiesOpen; resize()">
                    <img v-show="propertiesOpen" src="@/assets/arrow_01.svg" style="transform: rotate(90deg)"/>
                    <img v-show="!propertiesOpen" src="@/assets/gear.svg" style="transform: rotate(-90deg)"/>
                </button>
            </div>
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
import {ROOM_TOOL_TYPE, ROOM_ACTION, MOUSE_EVENT, CATEGORY_ID, ENTITY_TYPE} from '@/common/Enums';
import Undo_Store, {UndoHelpers} from '@/common/Undo_Store';
import {compareVector} from '@/common/Util_2D';
import RoomEditWindow from './RoomEditWindow';
import Properties from './Properties';
import Tool from '@/components/common/Tool';
import HotkeyMap from '@/components/common/HotkeyMap';
import Instance from "@/common/data_classes/Instance";
import Exit from "@/common/data_classes/Exit";

export default {
    name: 'RoomEditor',
    props: ['selectedAsset', 'selectedRoom'],
    components: {
        RoomEditWindow,
        Properties,
        Tool
    },
    data() {
        return {
            propertiesOpen: this.$store.getters['RoomEditor/getPropPanelState'],
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
            hotkeyMap: new HotkeyMap(),
            hotkeyDown: null,
            hotkeyUp: null,
            toolMap: new Map(),
            actionMap: new Map(),
            revertMap: new Map(),
            mouse: {
                down: false,
                wpLastDown: new Victor(0, 0),
                downOnSelection: false,
                newSelection: false,
                cellCache: [],
                inWindow: false,
            },
        }
    },
    watch: {
        selectedRoom(newRoom, oldRoom){
            if (newRoom && oldRoom && newRoom.id != oldRoom.id){
                this.editorSelection = null;
            }
        },
        inputActive(newVal){
            this.hotkeyMap.enabled = !newVal && this.mouse.inWindow;
        },
        inWindow(newVal){
            this.hotkeyMap.enabled = newVal && !this.inputActive;
        },
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
        },
        inputActive(){
            return this.$store.getters['getInputActive'];
        },
        inWindow(){
            return this.mouse.inWindow;
        },
        cssBG(){
            let color =  this.selectedRoom?.bgColor ?? '#FFFFFF'
            return 'background:' + color;
        },
    },
    mounted() {
        this.hotkeyDown = this.hotkeyMap.keyDown.bind(this.hotkeyMap);
        this.hotkeyUp = this.hotkeyMap.keyUp.bind(this.hotkeyMap);

        window.addEventListener('keydown', this.hotkeyDown);
        window.addEventListener('keyup', this.hotkeyUp);

        this.resize();
        this.bindHotkeys();
        this.bindTools();
        this.bindActions();
        this.bindReversions();
    },
    beforeDestroy() {
        this.$store.dispatch('RoomEditor/setPropPanelState', this.propertiesOpen);

        window.removeEventListener('keydown', this.hotkeyDown);
        window.removeEventListener('keydown', this.hotkeyUp);
    },
    methods: {
        ...UndoHelpers,
        bindHotkeys(){
            let deleteEntity = () => {
                let type = this.editorSelection?.TYPE;

                if (type == ENTITY_TYPE.INSTANCE){
                    this.actionDelete(this.editorSelection);
                }
                else if (type == ENTITY_TYPE.EXIT){
                    this.actionExitDelete(this.editorSelection);
                }
            }

            this.hotkeyMap.bindKey(['s'], this.toolClicked, [ROOM_TOOL_TYPE.SELECT_MOVE]);
            this.hotkeyMap.bindKey(['b'], this.toolClicked, [ROOM_TOOL_TYPE.ADD_BRUSH]);
            this.hotkeyMap.bindKey(['e'], this.toolClicked, [ROOM_TOOL_TYPE.ERASER]);
            this.hotkeyMap.bindKey(['c'], this.toolClicked, [ROOM_TOOL_TYPE.CAMERA]);
            this.hotkeyMap.bindKey(['x'], this.toolClicked, [ROOM_TOOL_TYPE.EXIT]);
            this.hotkeyMap.bindKey(['r'], this.toolClicked, [ROOM_TOOL_TYPE.ROOM_PROPERTIES]);
            this.hotkeyMap.bindKey(['g'], ()=>{this.$store.dispatch('RoomEditor/setGridState', !this.viewGrid)});
            this.hotkeyMap.bindKey(['n'], ()=>{this.propertiesOpen = !this.propertiesOpen; this.resize()});
            this.hotkeyMap.bindKey(['delete'], deleteEntity);
            this.hotkeyMap.bindKey(['backspace'], deleteEntity);
        },
        bindTools(){
            this.toolMap.set(ROOM_TOOL_TYPE.SELECT_MOVE, this.toolSelectMove);
            this.toolMap.set(ROOM_TOOL_TYPE.ADD_BRUSH, this.toolAddBrush);
            this.toolMap.set(ROOM_TOOL_TYPE.ERASER, this.toolEraser);
            this.toolMap.set(ROOM_TOOL_TYPE.EXIT, this.toolExit);
            this.toolMap.set(ROOM_TOOL_TYPE.CAMERA, this.toolCamera);
        },
        bindActions(){
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
        },
        bindReversions(){
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

                //get instances in same cell
                for (let i = 0; i < nearbyInst.length; i++){
                    if (compareVector(pos, nearbyInst[i].pos)){
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
                    this.editorSelection = instInCell[++selectedInListIdx % instInCell.length];
                }
                else{
                    this.editorSelection = instInCell[0];
                }
            }
            else{
                this.editorSelection = null;
            }
        },
        mouseEvent(mEvent){
            let toolScript = this.toolMap.get(this.curToolSelection);

            if (mEvent.type == MOUSE_EVENT.DOWN){
                this.mouse.down = true;
                this.mouse.wpLastDown.copy(mEvent.worldCell);
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
                    else if (compareVector(this.editorSelection.pos, mEvent.worldCell)){
                        this.mouse.downOnSelection = true;
                        this.mouse.cellCache.push(mEvent.worldCell.clone());
                    }
                    break;
                case MOUSE_EVENT.MOVE:
                    if (
                        this.mouse.down &&
                        this.mouse.downOnSelection &&
                        !compareVector(this.mouse.cellCache[0], mEvent.worldCell)
                    ){
                        this.actionMove({instRef: this.editorSelection, newPos: mEvent.worldCell}, false);
                        this.mouse.cellCache[0].copy(mEvent.worldCell);
                    }
                    break;
                case MOUSE_EVENT.UP:
                    if (compareVector(mEvent.worldCell, this.mouse.wpLastDown) && !this.mouse.newSelection){
                        this.selectInstanceByPos(mEvent.worldCell);
                    }

                    if (this.undoStore.cache.get('move_start')){
                        this.actionMove({}, true);
                    }

                    this.mouse.downOnSelection = false;
                    this.mouse.newSelection = false;
                    this.mouse.cellCache = [];
                    break;
            }
        },
        toolAddBrush(mEvent){
            switch(mEvent.type){
                case MOUSE_EVENT.MOVE:
                case MOUSE_EVENT.DOWN:
                    let hasVisited = false;

                    //check if cell has already been visited
                    for (let i = 0; i < this.mouse.cellCache.length; i++){
                        hasVisited |= compareVector(this.mouse.cellCache[i], mEvent.worldCell);
                    }

                    if (!hasVisited && this.mouse.down){
                        if (this.mouse.down && this.selectedAsset?.category_ID == CATEGORY_ID.OBJECT){
                            this.actionAdd({objId: this.selectedAsset.id, pos: mEvent.worldCell}, false);
                        }
                        
                        this.mouse.cellCache.push(mEvent.worldCell.clone());
                    }

                    break;
                case MOUSE_EVENT.UP:
                    this.actionAdd({}, true);
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
                        removedFromCell |= compareVector(this.mouse.cellCache[0], mEvent.worldCell);
                    }

                    if (!removedFromCell && this.mouse.down){
                        let instances = this.selectedRoom.getInstancesInRadius(mEvent.worldCell, 0);
                        instances = instances.filter((i) => compareVector(i.pos, mEvent.worldCell));
                        instances.sort((a, b) => a.zDepth > b.zDepth);

                        if (instances.length > 0){
                            this.actionDelete({instId: instances[0].id, pos: instances[0].pos}, false);
                        }

                        this.mouse.cellCache[0] = mEvent.worldCell;
                    }
                    break;
                case MOUSE_EVENT.UP:
                    this.actionDelete({}, true);
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
                let exitAtCursor = this.selectedRoom.getExitsAtPosition(mEvent.worldCell)
                    .find(e => compareVector(e.pos, mEvent.worldCell));

                if (exitAtCursor){
                    this.editorSelection = exitAtCursor;
                }
                else{
                    this.editorSelection = this.actionExitAdd({pos: mEvent.worldCell});
                }
            }
        },
        actionMove({instId, instRef, newPos}, makeCommit = true){
            if (makeCommit){
                let {instRef, oldPos} = this.undoStore.cache.get('move_start');
                let data = {instId: instRef.id, instRef, newPos: instRef.pos.clone(), oldPos};
                this.undoStore.commit({action: ROOM_ACTION.MOVE, data});
                this.undoStore.cache.delete('move_start');
                return;
            }

            if (!instRef){
                instRef = this.selectedRoom.getInstanceById(instId);
            }

            this.selectedRoom.setInstancePosition(instRef, newPos);
            this.$refs.editWindow.instancesChanged();
            
            if (!this.undoStore.cache.get('move_start')){
                this.undoStore.cache.set('move_start', {instRef, oldPos: instRef.pos.clone()});
            }
        },
        actionAdd({objId, instRefList = [], pos}, makeCommit = true){
            let object = this.$store.getters['GameData/getAllObjects'].find((o) => o.id == objId);
            let cacheList = this.undoStore.cache.get('add_list');
            let newInst;

            if (makeCommit){
                let data = {instRefList: cacheList};
                this.undoStore.commit({action: ROOM_ACTION.ADD, data});
                this.undoStore.cache.delete('add_list');
                return;
            }

            if (objId){
                newInst = new Instance(this.selectedRoom.curInstId, pos, object);
                instRefList.push(newInst);
            }

            for (let i = 0; i < instRefList.length; i++){
                this.selectedRoom.addInstance(instRefList[i]);
            }

            this.$refs.editWindow.instancesChanged();

            if (cacheList){
                cacheList.push(newInst);
            }
            else if (newInst){
                this.undoStore.cache.set('add_list', [newInst]);
            }
        },
        actionDelete({instId, instRefList = [], pos}, makeCommit = true){
            let cacheList = this.undoStore.cache.get('delete_list');
            let instRef;

            if (makeCommit){
                let data = {instRefList: cacheList};
                this.undoStore.commit({action: ROOM_ACTION.DELETE, data})
                this.undoStore.cache.delete('delete_list');
                return;
            }

            if (instId != undefined){
                instRef = this.selectedRoom.removeInstance(instId, pos);

                if (instRef == this.editorSelection){
                    this.editorSelection = null;
                }
            }

            for (let i = 0; i < instRefList.length; i++){
                let inst = instRefList[i]
                this.selectedRoom.removeInstance(inst.id, inst.pos);
            }

            this.$refs.editWindow.instancesChanged();

            if (cacheList){
                cacheList.push(instRef);
            }
            else if (instRef){
                this.undoStore.cache.set('delete_list', [instRef]);
            }
        },
        actionInstanceChange({newState, instRef}, makeCommit = true){
            let curInstance = (instRef) ? instRef : this.editorSelection;
            let oldState = Object.assign({}, curInstance);

            Object.assign(curInstance, newState);
            this.$refs.editWindow.instancesChanged();

            if (makeCommit){
                let data = {newState, oldState, instRef: curInstance};
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
        actionInstanceVarChange({changeObj, instRef}, makeCommit = true){
            let varList = (instRef) ? instRef.customVars : this.editorSelection.customVars;

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
            let newExit = exitRef ?? new Exit(this.selectedRoom.curExitId, pos);
            let newExitName = this.$t('room_editor.new_exit_prefix') + newExit.id;
            this.selectedRoom.addExit(newExit);

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
            this.editorSelection = null;
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
        revertAdd({instRefList}){
            for (let i = 0; i < instRefList.length; i++){
                let instRef = instRefList[i];

                if (instRef.id == this.editorSelection?.id){
                    this.editorSelection = null;
                }

                this.selectedRoom.removeInstance(instRef.id, instRef.pos);
            }

            this.$refs.editWindow.instancesChanged();
        },
        revertDelete({instRefList}){
            for (let i = 0; i < instRefList.length; i++){
                this.selectedRoom.addInstance(instRefList[i]);
            }

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
            if (exitRef.id == this.editorSelection?.id){
                this.editorSelection = null;
            }

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
                if (newVal != null){
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
            else if (newVal != null && oldVal != null){
                this.changeCustomVar(varList, {varName, newVal: oldVal});
            }
            else if (add){
                this.changeCustomVar(varList, {varName, remove: true});
            }
            else if (remove){
                this.changeCustomVar(varList, {varName, newVal, oldIdx});
            }
        },
    }
}
</script>

<style scoped>
.roomMain{
    display: flex;
    flex-direction: row;
    justify-content: space-between;
    align-items: center;
    width: 100%;
    height: 100%;
    overflow: hidden;
}

.toolPanel{
    position: relative;
    display: flex;
    flex-direction: column;
    width: auto;
    height: 95%;
    padding: 0;
    margin: 0;
    background: var(--tool-panel-bg);
    border: 2px solid var(--border);
    border-left: none;
    border-radius: 0px var(--corner-radius) var(--corner-radius) 0px;
}

.propertyPanel{
    position: relative;
    display: flex;
    flex-direction: row;
    height: 95%;
    background: var(--tool-panel-bg);
    border: 2px solid var(--border);
    border-right: none;
    border-radius: var(--corner-radius) 0px 0px var(--corner-radius);
    z-index: 5;
}

.propertiesContents{
    width: 250px;
}

.propertiesClosed{
    border: none;
}

.resizeBtnWrapper{
    position: absolute;
    left: 0;
    top: 50%;
    transform: translateY(-50%);
}

.resizeBtn{
    position: relative;
    left: -100%;
    display: flex;
    justify-content: center;
    align-items: center;
    align-self: center;
    width: 30px;
    height: 70px;
    background: var(--tool-panel-bg);
    border: 2px solid var(--border);
    border-right: none;
    border-radius: var(--corner-radius) 0px 0px var(--corner-radius);
}

.resizeBtn > img{
    width: 100%;
    height: 100%;
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