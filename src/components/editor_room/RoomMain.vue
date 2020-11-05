<template>
    <div class="roomMain">
        <div class="toolPanel">
            <Tool
                :key="tool.tool"
                v-for="tool in tools"
                :icon="tool.icon"
                :name="tool.text"
                :tool="tool.tool"
                :curSelection="curToolSelection"
                @toolClicked="$store.dispatch('RoomEditor/setSelectedTool', $event)"/>
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
            @mouse-event="mouseEvent" />
        <div v-else class="noRoomSelected">{{$t('room_editor.no_room_selected')}}</div>
        <div class="propertyPanel">
            <button v-show="propertiesOpen" class="resizeBtn" @click="propertiesOpen = false; resize()">
                &gt;
            </button>
            <button v-show="!propertiesOpen" class="resizeBtn" @click="propertiesOpen = true; resize()">
                &lt;
            </button>
            <div v-show="propertiesOpen" class="propertiesContents">
                Properties
            </div>
        </div>
    </div>
</template>

<script>
import Victor from 'victor';
import {ROOM_TOOL_TYPE, ROOM_ACTION, MOUSE_EVENT, CATEGORY_ID} from '@/common/Enums';
import Undo_Store from '@/common/Undo_Store';
import Util_2D from '@/common/Util_2D';
import RoomEditWindow from './RoomEditWIndow';
import Tool from '@/components/common/Tool';

export default {
    name: 'RoomEditor',
    components: {
        RoomEditWindow,
        Tool
    },
    data() {
        return {
            propertiesOpen: false,
            selectedRoom: null,
            selectedInstance: null,
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
                    tool: ROOM_TOOL_TYPE.ROOM_PROPERTIES,
                    text: this.$t('room_editor.room_props'),
                    icon: 'assets/gear'
                }
            ],
            undoStore: new Undo_Store(),
            toolMap: new Map(),
            applyMap: new Map(),
            revertMap: new Map(),
            mouse: {
                down: false,
                vpLastDown: new Victor(0, 0),
                wpLastDown: new Victor(0, 0),
                wcLastDown: new Victor(0, 0),
                vPos: new Victor(0, 0),
                wPos: new Victor(0, 0),
                cell: new Victor(0, 0),
                wCell: new Victor(0, 0),
                downOnSelection: false,
                newSelection: false,
                cellCache: []
            }
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
            return this.selectedRoom;
        }
    },
    mounted() {
        this.selectedRoom = this.$store.getters['AssetBrowser/getSelectedRoom'];
        this.propertiesOpen = this.$store.getters['RoomEditor/getPropPanelState'];
        this.resize();

        this.toolMap.set(ROOM_TOOL_TYPE.SELECT_MOVE, this.toolSelectMove);
        this.toolMap.set(ROOM_TOOL_TYPE.ADD_BRUSH, this.toolAddBrush);
        this.toolMap.set(ROOM_TOOL_TYPE.ERASER, this.toolEraser);
        this.toolMap.set(ROOM_TOOL_TYPE.CAMERA, this.toolCamera);

        this.applyMap.set(ROOM_ACTION.MOVE, this.actionMove);
        this.applyMap.set(ROOM_ACTION.ADD, this.actionAdd);
        this.applyMap.set(ROOM_ACTION.DELETE, this.actionDelete);
        this.applyMap.set(ROOM_ACTION.CAMERA_CHANGE, this.actionCameraChange);
        this.applyMap.set(ROOM_ACTION.ROOM_PROP_CHANGE, this.actionRoomPropChange);

        this.revertMap.set(ROOM_ACTION.MOVE, this.revertMove);
        this.revertMap.set(ROOM_ACTION.ADD, this.revertAdd);
        this.revertMap.set(ROOM_ACTION.DELETE, this.revertDelete);
        this.revertMap.set(ROOM_ACTION.CAMERA_CHANGE, this.revertCameraChange);
        this.revertMap.set(ROOM_ACTION.ROOM_PROP_CHANGE, this.revertRoomPropChange);
    },
    beforeDestroy() {
        this.$store.dispatch('RoomEditor/setPropPanelState', this.propertiesOpen);
    },
    methods: {
        updateAssetSelection() {
            let selectedRoom = this.$store.getters['AssetBrowser/getSelectedRoom'];
            
            if (selectedRoom && selectedRoom != this.selectedRoom){
                this.selectedRoom = selectedRoom;

                this.$nextTick(()=>{
                    this.$refs.editWindow.roomChange();
                });
            }
        },
        resize() {
            this.$nextTick(()=>{
                if (this.$refs.editWindow){
                    this.$refs.editWindow.resize();
                }
            });
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
                    if (this.selectedInstance?.id == instInCell[i].id){
                        selectedInListIdx = i;
                    }
                }

                //if selected instance is in current cell, then select next item in cell
                if (selectedInListIdx >= 0){
                    this.selectedInstance = instInCell[++selectedInListIdx % instInCell.length];
                }
                else{
                    this.selectedInstance = instInCell[0];
                }
                
                this.$refs.editWindow.newInstanceSelected(this.selectedInstance);
            }
        },
        mouseEvent(mEvent){
            let toolScript = this.toolMap.get(this.curToolSelection);

            this.mouse.vPos.copy(mEvent.canvasPos);
            this.mouse.wPos.copy(mEvent.worldPos);
            this.mouse.cell.copy(mEvent.cell);
            this.mouse.wCell.copy(mEvent.worldCell);

            if (mEvent.type == MOUSE_EVENT.DOWN){
                this.mouse.down = true;
                this.mouse.vpLastDown.copy(mEvent.canvasPos);
                this.mouse.wpLastDown.copy(mEvent.worldPos);
                this.mouse.wcLastDown.copy(mEvent.worldCell);
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
                    if (this.selectedInstance == null){
                        this.selectInstanceByPos(mEvent.worldCell);
                        this.mouse.newSelection = true;
                    }
                    else if (Util_2D.compareVector(this.selectedInstance.pos, mEvent.worldCell)){
                        this.mouse.downOnSelection = true;
                    }
                    break;
                case MOUSE_EVENT.MOVE:
                    if (this.mouse.down && this.mouse.downOnSelection){
                        this.actionMove({instRef: this.selectedInstance, newPos: mEvent.worldCell});
                    }
                    break;
                case MOUSE_EVENT.UP:
                    if (Util_2D.compareVector(mEvent.worldPos, this.mouse.wpLastDown) && !this.mouse.newSelection){
                        this.selectInstanceByPos(mEvent.worldCell);
                    }

                    this.mouse.downOnSelection = false;
                    this.mouse.newSelection = false;
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
                        this.mouse.cellCache.push(mEvent.worldCell.toObject());
                    }

                    break;
                case MOUSE_EVENT.UP:
                    if (selectedAsset?.category_ID == CATEGORY_ID.OBJECT){
                        this.actionAdd({objId: selectedAsset.ID, posList: this.mouse.cellCache});
                    }
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
                        }

                        this.mouse.cellCache[0] = mEvent.worldCell;
                    }
            }
        },
        toolCamera(mEvent){
            switch(mEvent.type){
                case MOUSE_EVENT.MOVE:
                case MOUSE_EVENT.DOWN:
                    if (this.mouse.down){
                        this.selectedRoom.camera.pos.copy(mEvent.worldCell);
                    }
                    this.$refs.editWindow.cameraChanged();
                    break;
            }
        },
        actionMove({instId, instRef, newPos}, makeCommit = true){
            if (!instRef){
                instRef = this.selectedRoom.getInstanceById(instId);
            }

            this.selectedRoom.setInstancePosition(instRef, newPos);
            this.$refs.editWindow.instancesChanged();
        },
        actionAdd({objId, posList}, makeCommit = true){
            let object = this.$store.getters['GameData/getAllObjects'].filter((o) => o.ID == objId)[0];
            let room = this.$store.getters['AssetBrowser/getSelectedRoom'];

            for (let i = 0; i < posList.length; i++){
                room.addInstance(object, posList[i]);
            }

            this.$refs.editWindow.instancesChanged();
        },
        actionDelete({instId, pos}, makeCommit = true){
            this.selectedRoom.removeInstance(instId, pos);
            this.$refs.editWindow.instancesChanged();
        },
        actionCameraChange({newState}, makeCommit = true){
            Object.assign(this.selectedRoom.camera, newState);
            this.$refs.editWindow.cameraChanged();
        },
        actionRoomPropChange({newState}, makeCommit = true){
            //
        },
        revertMove({objId, oldPos}){
            //
        },
        revertAdd({instId}){
            //
        },
        revertDelete({instObj}){
            //
        },
        revertCameraChange({oldState}){
            //
        },
        revertRoomPropChange({oldState}){
            //
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
    padding-right: 20px;
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
    display: flex;
    justify-content: center;
    align-items: center;
}
</style>