<script setup lang="ts">
import GroupList from '@/components/common/GroupList.vue';
import ColorPicker from '@/components/common/ColorPicker.vue';

import { ref, computed, defineProps, defineEmits, onMounted } from 'vue';
import { useI18n } from 'vue-i18n';
import { useGameDataStore } from '@/stores/GameData';
import Core from '@/core';

type AnyObj = {[key: string]: any};

const { t } = useI18n();
const gameDataStore = useGameDataStore();

const props = defineProps<{
    camera: Core.Camera,
    room: Core.Room,
    selectedTool: Core.ROOM_TOOL_TYPE | null,
    selectedEntity: Core.Instance_Base | null,
}>();

const emit = defineEmits([
    'inst-prop-set',
    'cam-prop-set',
    'exit-prop-set',
    'room-prop-set',
]);

//data
const TOOL_ENUMS = Core.ROOM_TOOL_TYPE;
const objects = gameDataStore.getAllObjects;
const changeingBG = ref<boolean>(false);

const bgColorBtn = ref<HTMLElement>();

//computed
const showInstProps = computed(()=>(
    props.selectedEntity &&
    props.selectedEntity.TYPE == Core.ENTITY_TYPE.INSTANCE &&
    !showCameraProps &&
    !showRoomProps
));
const showCameraProps = computed(()=>props.selectedTool == Core.ROOM_TOOL_TYPE.CAMERA);
const showExitProps = computed(()=>(
    props.selectedEntity &&
    props.selectedEntity.TYPE == Core.ENTITY_TYPE.EXIT &&
    !showCameraProps &&
    !showRoomProps
));
const showRoomProps = computed(()=>props.selectedTool == Core.ROOM_TOOL_TYPE.ROOM_PROPERTIES);
const showPlaceHolder = computed(()=>!(showInstProps || showCameraProps || showExitProps || showRoomProps));
const destinationRoomExits = computed(()=>{
    if (props.selectedEntity?.TYPE != Core.ENTITY_TYPE.EXIT) return null;
    
    const allRooms = gameDataStore.getAllRooms;
    const destRoom = allRooms.find(r => r.id == (props.selectedEntity as Core.Exit).destinationRoom);

    return destRoom?.getAllExits()!;
});

//lifecycle
onMounted(()=>{
    if (bgColorBtn.value){
        bgColorBtn.value.style.background = props.room.bgColor.toHex();
    }
});

function checkNameCollisions(name: string, list: any[]): string {
    let nameExists;

    do{
        nameExists = false;

        for (let i = 0; i < list.length && !nameExists; i++){
            let nameMatch = (list[i].name == name);
            let idMatch = (list[i].id == props.selectedEntity?.id);
            nameExists ||=  nameMatch && !idMatch;
        }

        if (nameExists){
            name += '_' + t('room_editor.duplicate_name_suffix');
        }
    } while(nameExists);

    return name;
}

function setInstProp(propObj: AnyObj): void {
    emit('inst-prop-set', propObj);
}

function setCamProp(propObj: AnyObj): void {
    emit('cam-prop-set', propObj);
}

function setExitProp(propObj: AnyObj): void {
    emit('exit-prop-set', propObj);
}

function setRoomProp(propObj: AnyObj): void {
    emit('room-prop-set', propObj);
}

function setFollowObj(): void {
    if (props.selectedEntity!.TYPE == Core.ENTITY_TYPE.INSTANCE){
        props.camera.followObjId = props.selectedEntity!.id;
    }
}

function setRoomBgColor(color: Core.Draw.Color): void {
    if (bgColorBtn.value){
        bgColorBtn.value.style.background = color.toHex();
    }
    setRoomProp({bgColor: color});
}

function setInstanceName(newName: string): void {
    const instanceList = props.room.getAllInstances();
    newName = checkNameCollisions(newName, instanceList);

    setInstProp({name: newName});
}

function setExitName(newName: string): void {
    const exitList = props.room.getAllExits();
    newName = checkNameCollisions(newName, exitList);

    setExitProp({name: newName});
}

function closeRoomBGColorEditor(): void {
    changeingBG.value = false;
}

function nanToNull(inp: number): number | null {
    if (isNaN(inp)){
        return null;
    }
    
    return inp;
}
</script>

<template>
    <div class="properties">
        <div v-if="showInstProps" class="propContents">
            <div class="heading">{{$t('room_editor.object_properties_heading')}}</div>
            <div class="info" style="margin: var(--margin); margin-left: 0px;">
                <div>{{$t('room_editor.object_type')}}:</div>
                <div>{{(selectedEntity as Core.Object_Instance).objRef.name}}</div>
            </div>
            <div class="control">
                <label for="instName">{{$t('room_editor.instance_name')}}:</label>
                <input id="instName" type="text" :value="selectedEntity!.name" v-tooltip="$t('room_editor.tt_inst_name')"
                    @change="setInstanceName(($event.target as AnyObj).value)" v-input-active/>
            </div>
            <div class="control">
                <label for="instCollisionOvrr">{{$t('room_editor.collision')}}:</label>
                <select id="instCollisionOvrr" :value="(selectedEntity as Core.Object_Instance).collisionOverride" v-tooltip="$t('room_editor.tt_coll_ovr')"
                    @change="setInstProp({collisionOverride: ($event.target as AnyObj).value})">
                    <option :value="(selectedEntity as Core.Object_Instance).COLLISION_OVERRIDES.KEEP">{{$t('room_editor.keep')}}</option>
                    <option :value="(selectedEntity as Core.Object_Instance).COLLISION_OVERRIDES.FORCE">{{$t('room_editor.on')}}</option>
                    <option :value="(selectedEntity as Core.Object_Instance).COLLISION_OVERRIDES.IGNORE">{{$t('room_editor.off')}}</option>
                </select>
            </div>
            <div class="control">
                <label for="instCustDepth">{{$t('room_editor.custom_depth')}}:</label>
                <input id="instCustDepth" type="number" :value="(selectedEntity as Core.Object_Instance).zDepthOverride" v-tooltip="$t('room_editor.tt_cust_depth')"
                    @change="setInstProp({zDepthOverride: nanToNull(parseInt(($event.target as AnyObj).value))})" v-input-active/>
            </div>
            <GroupList
                :editList="selectedEntity!.groups"
                :readOnlyList="(selectedEntity as Core.Object_Instance).objRef.groups"
                @group-changed="$emit('inst-group-changed', $event)"/>
        </div>
        <div v-if="showCameraProps" class="propContents">
            <div class="heading">{{$t('room_editor.camera_properties_heading')}}</div>
            <div class="control">
                <label for="cameraSize">{{$t('room_editor.camera_size')}}:</label>
                <input id="cameraSize" type="number" :value="camera.size" v-tooltip="$t('room_editor.tt_camera_size')"
                    @change="setCamProp({size: ($event.target as AnyObj).value}); ($event.target as AnyObj).value = camera.size" v-input-active/>
            </div>
            <div class="control">
                <label for="camMoveType">{{$t('room_editor.camera_move_type')}}:</label>
                <select id="camMoveType" :value="camera.moveType" v-tooltip="$t('room_editor.tt_camera_move')"
                    @change="setCamProp({moveType: ($event.target as AnyObj).value})">
                    <option :value="Core.Camera.MOVE_TYPES.LOCKED">{{$t('room_editor.locked')}}</option>
                    <option :value="Core.Camera.MOVE_TYPES.FOLLOW">{{$t('room_editor.follow')}}</option>
                    <option :value="Core.Camera.MOVE_TYPES.SCROLL">{{$t('room_editor.scroll')}}</option>
                </select>
            </div>
            <div v-show="camera.moveType == Core.Camera.MOVE_TYPES.SCROLL" class="control">
                <label for="camScrollDir">{{$t('room_editor.scroll_dir')}}: </label>
                <select id="camScrollDir" :value="camera.scrollDir" v-tooltip="$t('room_editor.tt_camera_scroll_dir')"
                    @change="setCamProp({scrollDir: ($event.target as AnyObj).value})">
                    <option :value="Core.Camera.SCROLL_DIRS.UP">{{$t('room_editor.up')}}</option>
                    <option :value="Core.Camera.SCROLL_DIRS.DOWN">{{$t('room_editor.down')}}</option>
                    <option :value="Core.Camera.SCROLL_DIRS.LEFT">{{$t('room_editor.left')}}</option>
                    <option :value="Core.Camera.SCROLL_DIRS.RIGHT">{{$t('room_editor.right')}}</option>
                </select>
            </div>
            <div v-show="camera.moveType == Core.Camera.MOVE_TYPES.SCROLL" class="control">
                <label for="camScrollSpeed">{{$t('room_editor.scroll_speed')}}: </label>
                <input id="camScrollSpeed" type="number" step="any" :value="camera.scrollSpeed" v-tooltip="$t('room_editor.tt_camera_scroll_speed')"
                    @change="setCamProp({scrollSpeed: parseFloat(($event.target as AnyObj).value)})" v-input-active/>
            </div>
            <div v-show="camera.moveType == Core.Camera.MOVE_TYPES.FOLLOW" class="control">
                <label for="camFollowType">{{$t('room_editor.follow_type')}}: </label>
                <select id="camFollowType" :value="camera.followType" v-tooltip="$t('room_editor.tt_camera_follow_type')"
                    @change="setCamProp({followType: ($event.target as AnyObj).value})">
                    <option :value="Core.Camera.FOLLOW_TYPES.SMOOTH">{{$t('room_editor.smooth')}}</option>
                    <option :value="Core.Camera.FOLLOW_TYPES.TILED">{{$t('room_editor.tiled')}}</option>
                </select>
            </div>
            <div v-show="camera.moveType == Core.Camera.MOVE_TYPES.FOLLOW" class="control">
                <label for="camFollowObj">{{$t('room_editor.follow_obj')}}: </label>
                <input id="camFollowObj" type="button" value="Set" v-tooltip="$t('room_editor.tt_camera_follow_obj')"
                    @click="setFollowObj()" />
            </div>
        </div>
        <div v-if="showExitProps" class="propContents">
            <div class="heading">{{$t('room_editor.exit_properties_heading')}}</div>
            <div class="control">
                <label for="exitName">{{$t('room_editor.exit_name')}}:</label>
                <input id="exitName" type="text" :value="selectedEntity!.name" v-tooltip="$t('room_editor.tt_exit_name')"
                    @change="setExitName(($event.target as AnyObj).value)" v-input-active/>
            </div>
            <div class="control">
                <label for="exitTrans">{{$t('room_editor.transition')}}:</label>
                <select id="exitTrans" :value="(selectedEntity as Core.Exit).transition" v-tooltip="$t('room_editor.tt_exit_trans')"
                    @change="setExitProp({transition: ($event.target! as AnyObj).value})">
                    <option :value="Core.Exit.TRANSITION_TYPES.NONE">{{$t('generic.no_option')}}</option>
                    <option :value="Core.Exit.TRANSITION_TYPES.FADE">{{$t('room_editor.trans_fade')}}</option>
                </select>
            </div>
            <div class="control">
                <label for="exitEnding">{{$t('room_editor.is_ending')}}:</label>
                <input id="exitEnding" type="checkbox" :checked="(selectedEntity as Core.Exit).isEnding" v-tooltip="$t('room_editor.tt_exit_is_ending')"
                    @change="setExitProp({isEnding: ($event.target as AnyObj).checked})"/>
            </div>
            <div v-show="!(selectedEntity as Core.Exit).isEnding" class="control">
                <label for="exitDestRoom">{{$t('room_editor.dest_room')}}:</label>
                <select id="exitDestRoom" :value="(selectedEntity as Core.Exit).destinationRoom" v-tooltip="$t('room_editor.tt_exit_dest_room')"
                    @change="setExitProp({destinationRoom: nanToNull(parseInt(($event.target as AnyObj).value))})">
                    <option :value="null">{{$t('generic.no_option')}}</option>
                    <option
                        v-for="room in gameDataStore.getAllRooms"
                        :key="room.id"
                        :value="room.id">{{room.name}}</option>
                </select>
            </div>
            <div v-show="!(selectedEntity as Core.Exit).isEnding && (selectedEntity as Core.Exit).destinationRoom != null" class="control">
                <label for="exitDestExit">{{$t('room_editor.dest_exit')}}:</label>
                <select id="exitDestExit" :value="(selectedEntity as Core.Exit).destinationExit" v-tooltip="$t('room_editor.tt_exit_dest_exit')"
                    @change="setExitProp({destinationExit: parseInt(($event.target as AnyObj).value)})">
                    <option
                        v-for="exit in destinationRoomExits"
                        :key="exit.id"
                        :value="exit.id">{{exit.name}}</option>
                </select>
            </div>
            <div v-show="(selectedEntity as Core.Exit).isEnding" class="control">
                <label for="endingDialog">{{$t('room_editor.end_dialog')}}:</label>
                <textarea id="endingDialog" :value="(selectedEntity as Core.Exit).endingDialog" v-tooltip="$t('room_editor.tt_exit_end_dialog')"
                    @change="setExitProp({endingDialog: ($event.target as AnyObj).value})"></textarea>
            </div>
            <div class="control">
                <label for="exitDelete">{{$t('room_editor.delete_exit')}}:</label>
                <input id="exitDelete" type="button" :value="$t('generic.delete')" v-tooltip="$t('room_editor.tt_exit_delete')"
                    @click="$emit('exit-delete', selectedEntity)" />
            </div>
        </div>
        <div v-show="showRoomProps" class="propContents">
            <div class="heading">{{$t('room_editor.room_properties_heading')}}</div>
            <div class="control">
                <label for="roomBGColor">{{$t('room_editor.bg_color')}}:</label>
                <button id="roomBGColor" class="changeBgBtn" ref="bgColorBtn" v-tooltip="$t('room_editor.tt_room_background')"
                    @click="$nextTick(()=>{changeingBG = !changeingBG})"
                    v-click-outside="closeRoomBGColorEditor">
                    <div v-show="changeingBG" ref="bgColorEditor" class="bgColorEditor">
                        <svg width="50" height="25" class="arrow">
                            <path d="M0 25 L25 0 L50 25"/>
                        </svg>
                        <div v-if="changeingBG" class="contents">
                            <ColorPicker :color="props.room.bgColor" :width="150" @change="setRoomBgColor"/>
                        </div>
                    </div>
                </button>
            </div>
            <div class="control">
                <label for="roomPersist">{{$t('room_editor.persist')}}:</label>
                <input id="roomPersist" type="checkbox" :checked="room.persist" v-tooltip="$t('room_editor.tt_room_persist')"
                    @change="setRoomProp({persist: ($event.target as AnyObj).checked})"/>
            </div>
            <div class="control">
                <label for="roomUseGrav">{{$t('room_editor.enable_gravity')}}:</label>
                <input id="roomUseGrav" type="checkbox" :checked="room.useGravity" v-tooltip="$t('room_editor.tt_room_use_gravity')"
                    @change="setRoomProp({useGravity: ($event.target as AnyObj).checked})"/>
            </div>
            <div v-show="room.useGravity" class="control">
                <label for="roomGrav">{{$t('room_editor.gravity')}}:</label>
                <input id="roomGrav" type="number" step="any" :value="room.gravity" v-tooltip="$t('room_editor.tt_room_gravity')"
                    @change="setRoomProp({gravity: parseFloat(($event.target as AnyObj).value)})" v-input-active/>
            </div>
            <div class="control">
                <label for="roomSetStart">{{$t('room_editor.set_start_room')}}:</label>
                <input id="roomSetStart" type="button" value="Set" v-tooltip="$t('room_editor.tt_room_starting_room')"
                    @click="gameDataStore.setStartRoomId(room.id)" />
            </div>
        </div>
        <div v-show="showPlaceHolder" class="noProps">{{$t('room_editor.no_props')}}</div>
    </div>
</template>

<style scoped>
.properties{
    display: flex;
    flex-direction: column;
    padding: 10px;
}

.propContents{
    display: flex;
    flex-direction: column;
}

.propContents > *{
    margin-bottom: 5px;
}

.heading{
    font-size: 1.3em;
    font-weight: bold;
    margin-bottom: 10px;
}

.info{
    --margin: 20px;
    width: 100%;
    display: flex;
    flex-direction: row;
    justify-content: space-between;
}

.control{
    display: flex;
    flex-direction: row;
    justify-content: space-between;
    align-items: center;
    width: 100%;
}

.control > label{
    text-align: right;
    flex-shrink: 1;
    width: max-content;
}

.control > input, .control > select, .control > button{
    width: 100px;
    box-sizing: border-box;
    margin-left: 10px;
}

.changeBgBtn{
    position: relative;
    height: 40px;
    border: 2px solid var(--border);
    border-radius: var(--corner-radius);
}

.changeBgBtn:hover{
    border-color: var(--button-dark-hover);
}

.bgColorEditor{
    position: absolute;
    display: flex;
    flex-direction: column;
    align-items: center;
    right: 10px;
}

.bgColorEditor > .arrow{
    align-self: flex-end;
    margin-bottom: -2px;
    z-index: 4;
}

.bgColorEditor > .arrow > path{
    fill: var(--heading);
    stroke: var(--border);
    stroke-width: 2px;
}

.bgColorEditor > .contents{
    display: flex;
    flex-direction: column;
    align-items: center;
    background: var(--heading);
    width: 100%;
    flex-grow: 1;
    border: 2px solid var(--border);
    border-radius: 10px;
    padding: 10px;
    z-index: 3;
}
</style>