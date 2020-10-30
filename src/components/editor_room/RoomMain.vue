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
            ref="editWindow"
            class="editWindow"
            @mouse-event="mouseEvent" />
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
import {ROOM_TOOL_TYPE, ROOM_ACTION, MOUSE_EVENT} from '@/common/Enums';
import Undo_Store from '@/common/Undo_Store';
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
                vPos: new Victor(0, 0),
                wPos: new Victor(0, 0)
            }
        }
    },
    computed: {
        curToolSelection() {
            return this.$store.getters['RoomEditor/getSelectedTool'];
        },
        viewGrid() {
            return this.$store.getters['RoomEditor/getGridState'];
        }
    },
    mounted() {
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
            //
        },
        resize() {
            this.$nextTick(()=>{
                this.$refs.editWindow.resize();
            });
        },
        mouseEvent(mEvent){
            let toolScript = this.toolMap.get(this.curToolSelection);

            this.mouse.down = (mEvent.type == MOUSE_EVENT.DOWN);
            this.mouse.vPos.copy(mEvent.canvasPos);
            this.mouse.wPos.copy(mEvent.worldPos);

            if (this.mouse.down){
                this.mouse.vpLastDown = mEvent.canvasPos;
                this.mouse.wpLastDown = mEvent.worldPos;
            }

            if (toolScript){
                toolScript(mEvent);
            }
        },
        toolSelectMove(mEvent){
            //
        },
        toolAddBrush(mEvent){
            //
        },
        toolEraser(mEvent){
            //
        },
        toolCamera(mEvent){
            //
        },
        actionMove({instId, newPos}){
            //
        },
        actionAdd({objId, pos}){
            //
        },
        actionDelete({objId}){
            //
        },
        actionCameraChange({newState}){
            //
        },
        actionRoomPropChange({newState}){
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
</style>