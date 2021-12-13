<template>
    <div class="properties">
        <div v-if="showInstProps" class="propContents">
            <div class="heading">{{$t('room_editor.object_properties_heading')}}</div>
            <div class="info" style="margin-top: var(--margin);">
                <div>{{$t('room_editor.object_type')}}:</div>
                <div>{{selectedEntity.objRef.name}}</div>
            </div>
            <div class="info" style="margin-bottom: var(--margin);">
                <div>{{$t('room_editor.instance_id')}}:</div>
                <div>{{selectedEntity.id}}</div>
            </div>
            <div class="control">
                <label for="instName">{{$t('room_editor.instance_name')}}:</label>
                <input id="instName" type="text" :value="selectedEntity.name" :title="$t('room_editor.tt_inst_name')"
                    @change="setInstanceName($event.target.value)" v-input-active/>
            </div>
            <div class="control">
                <label for="instCollisionOvrr">{{$t('room_editor.collision')}}:</label>
                <select id="instCollisionOvrr" :value="selectedEntity.collisionOverride" :title="$t('room_editor.tt_coll_ovr')"
                    @change="setInstProp({collisionOverride: parseInt($event.target.value)})">
                    <option :value="selectedEntity.COLLISION_OVERRIDES.KEEP">{{$t('room_editor.keep')}}</option>
                    <option :value="selectedEntity.COLLISION_OVERRIDES.FORCE">{{$t('room_editor.on')}}</option>
                    <option :value="selectedEntity.COLLISION_OVERRIDES.IGNORE">{{$t('room_editor.off')}}</option>
                </select>
            </div>
            <div class="control">
                <label for="instCustDepth">{{$t('room_editor.custom_depth')}}:</label>
                <input id="instCustDepth" type="number" :value="selectedEntity.zDepthOverride" :title="$t('room_editor.tt_cust_depth')"
                    @change="setInstProp({zDepthOverride: nanToNull(parseInt($event.target.value))})" v-input-active/>
            </div>
            <GroupList
                :editList="selectedEntity.groups"
                :readOnlyList="selectedEntity.objRef.groups"
                @group-changed="$emit('inst-group-changed', $event)"/>
            <VarList
                :editList="selectedEntity.customVars"
                :tooltip_text="$t('room_editor.tt_cust_inst_vars')"
                @var-changed="$emit('inst-var-changed', $event)" />
        </div>
        <div v-if="showCameraProps" class="propContents">
            <div class="heading">{{$t('room_editor.camera_properties_heading')}}</div>
            <div class="control">
                <label for="cameraSize">{{$t('room_editor.camera_size')}}:</label>
                <input id="cameraSize" type="number" :value="camera.size" :title="$t('room_editor.tt_camera_size')"
                    @change="setCamProp({size: $event.target.value}); $event.target.value = camera.size" v-input-active/>
            </div>
            <div class="control">
                <label for="camMoveType">{{$t('room_editor.camera_move_type')}}:</label>
                <select id="camMoveType" :value="camera.moveType" :title="$t('room_editor.tt_camera_move')"
                    @change="setCamProp({moveType: parseInt($event.target.value)})">
                    <option :value="camera.MOVE_TYPES.LOCKED">{{$t('room_editor.locked')}}</option>
                    <option :value="camera.MOVE_TYPES.FOLLOW">{{$t('room_editor.follow')}}</option>
                    <option :value="camera.MOVE_TYPES.SCROLL">{{$t('room_editor.scroll')}}</option>
                </select>
            </div>
            <div v-show="camera.moveType == camera.MOVE_TYPES.SCROLL" class="control">
                <label for="camScrollDir">{{$t('room_editor.scroll_dir')}}: </label>
                <select id="camScrollDir" :value="camera.scrollDir" :title="$t('room_editor.tt_camera_scroll_dir')"
                    @change="setCamProp({scrollDir: parseInt($event.target.value)})">
                    <option :value="camera.SCROLL_DIRS.UP">{{$t('room_editor.up')}}</option>
                    <option :value="camera.SCROLL_DIRS.DOWN">{{$t('room_editor.down')}}</option>
                    <option :value="camera.SCROLL_DIRS.LEFT">{{$t('room_editor.left')}}</option>
                    <option :value="camera.SCROLL_DIRS.RIGHT">{{$t('room_editor.right')}}</option>
                </select>
            </div>
            <div v-show="camera.moveType == camera.MOVE_TYPES.SCROLL" class="control">
                <label for="camScrollSpeed">{{$t('room_editor.scroll_speed')}}: </label>
                <input id="camScrollSpeed" type="number" step="any" :value="camera.scrollSpeed" :title="$t('room_editor.tt_camera_scroll_speed')"
                    @change="setCamProp({scrollSpeed: parseFloat($event.target.value)})" v-input-active/>
            </div>
            <div v-show="camera.moveType == camera.MOVE_TYPES.FOLLOW" class="control">
                <label for="camFollowObj">{{$t('room_editor.follow_obj')}}: </label>
                <select id="camFollowObj" :value="camera.followObjId" :title="$t('room_editor.tt_camera_follow_obj')"
                    @change="setCamProp({followObjId: nanToNull(parseInt($event.target.value))})">
                    <option :value="null">{{$t('generic.no_option')}}</option>
                    <option
                        v-for="object in objects"
                        :key="object.id"
                        :value="object.id">{{object.name}}</option>
                </select>
            </div>
            <div v-show="camera.moveType == camera.MOVE_TYPES.FOLLOW" class="control">
                <label for="camFollowType">{{$t('room_editor.follow_type')}}: </label>
                <select id="camFollowType" :value="camera.followType" :title="$t('room_editor.tt_camera_follow_type')"
                    @change="setCamProp({followType: parseInt($event.target.value)})">
                    <option :value="camera.FOLLOW_TYPES.SMOOTH">{{$t('room_editor.smooth')}}</option>
                    <option :value="camera.FOLLOW_TYPES.TILED">{{$t('room_editor.tiled')}}</option>
                </select>
            </div>
        </div>
        <div v-if="showExitProps" class="propContents">
            <div class="heading">{{$t('room_editor.exit_properties_heading')}}</div>
            <div class="control">
                <label for="exitName">{{$t('room_editor.exit_name')}}:</label>
                <input id="exitName" type="text" :value="selectedEntity.name" :title="$t('room_editor.tt_exit_name')"
                    @change="setExitName($event.target.value)" v-input-active/>
            </div>
            <div class="control">
                <label for="exitTrans">{{$t('room_editor.transition')}}:</label>
                <select id="exitTrans" :value="selectedEntity.transition" :title="$t('room_editor.tt_exit_trans')"
                    @change="setExitProp({transition: $event.target.value})">
                    <option :value="selectedEntity.TRANSITION_TYPES.NONE">{{$t('generic.no_option')}}</option>
                    <option :value="selectedEntity.TRANSITION_TYPES.FADE">{{$t('room_editor.trans_fade')}}</option>
                </select>
            </div>
            <div class="control">
                <label for="exitEnding">{{$t('room_editor.is_ending')}}:</label>
                <input id="exitEnding" type="checkbox" :checked="selectedEntity.isEnding" :title="$t('room_editor.tt_exit_is_ending')"
                    @change="setExitProp({isEnding: $event.target.checked})"/>
            </div>
            <div v-show="!selectedEntity.isEnding" class="control">
                <label for="exitDestRoom">{{$t('room_editor.dest_room')}}:</label>
                <select id="exitDestRoom" :value="selectedEntity.destinationRoom" :title="$t('room_editor.tt_exit_dest_room')"
                    @change="setExitProp({destinationRoom: nanToNull(parseInt($event.target.value))})">
                    <option :value="null">{{$t('generic.no_option')}}</option>
                    <option
                        v-for="room in $store.getters['GameData/getAllRooms']"
                        :key="room.id"
                        :value="room.id">{{room.name}}</option>
                </select>
            </div>
            <div v-show="!selectedEntity.isEnding && selectedEntity.destinationRoom != null" class="control">
                <label for="exitDestExit">{{$t('room_editor.dest_exit')}}:</label>
                <select id="exitDestExit" :value="selectedEntity.destinationExit" :title="$t('room_editor.tt_exit_dest_exit')"
                    @change="setExitProp({destinationExit: parseInt($event.target.value)})">
                    <option
                        v-for="exit in destinationRoomExits"
                        :key="exit.id"
                        :value="exit.id">{{exit.name}}</option>
                </select>
            </div>
            <div v-show="selectedEntity.isEnding" class="control">
                <label for="endingDialog">{{$t('room_editor.end_dialog')}}:</label>
                <textarea id="endingDialog" :value="selectedEntity.endingDialog" :title="$t('room_editor.tt_exit_end_dialog')"
                    @change="setExitProp({endingDialog: $event.target.value})"></textarea>
            </div>
            <div class="control">
                <label for="exitDelete">{{$t('room_editor.delete_exit')}}:</label>
                <input id="exitDelete" type="button" :value="$t('generic.delete')" :title="$t('room_editor.tt_exit_delete')"
                    @click="$emit('exit-delete', selectedEntity)" />
            </div>
        </div>
        <div v-show="showRoomProps" class="propContents">
            <div class="heading">{{$t('room_editor.room_properties_heading')}}</div>
            <div class="control">
                <label for="roomBGColor">{{$t('room_editor.bg_color')}}:</label>
                <button id="roomBGColor" class="changeBgBtn" ref="bgColorBtn" :title="$t('room_editor.tt_room_background')"
                    @click="$nextTick(()=>{changeingBG = !changeingBG})"
                    v-click-outside="closeRoomBGColorEditor">
                    <div v-show="changeingBG" ref="bgColorEditor" class="bgColorEditor">
                        <svg width="50" height="25" class="arrow">
                            <path d="M0 25 L25 0 L50 25"/>
                        </svg>
                        <div class="contents">
                            <div id="roomBgPicker"></div>
                        </div>
                    </div>
                </button>
            </div>
            <div class="control">
                <label for="roomPersist">{{$t('room_editor.persist')}}:</label>
                <input id="roomPersist" type="checkbox" :checked="room.persist" :title="$t('room_editor.tt_room_persist')"
                    @change="setRoomProp({persist: $event.target.checked})"/>
            </div>
            <div class="control">
                <label for="roomUseGrav">{{$t('room_editor.enable_gravity')}}:</label>
                <input id="roomUseGrav" type="checkbox" :checked="room.useGravity" :title="$t('room_editor.tt_room_use_gravity')"
                    @change="setRoomProp({useGravity: $event.target.checked})"/>
            </div>
            <div v-show="room.useGravity" class="control">
                <label for="roomGrav">{{$t('room_editor.gravity')}}:</label>
                <input id="roomGrav" type="number" step="any" :value="room.gravity" :title="$t('room_editor.tt_room_gravity')"
                    @change="setRoomProp({gravity: parseFloat($event.target.value)})" v-input-active/>
            </div>
            <div class="control">
                <label for="roomSetStart">{{$t('room_editor.set_start_room')}}:</label>
                <input id="roomSetStart" type="button" value="Set" :title="$t('room_editor.tt_room_starting_room')"
                    @click="$store.dispatch('GameData/setStartRoomId', room.id)" />
            </div>
            <VarList
                :editList="room.customVars"
                :tooltip_text="$t('room_editor.tt_cust_room_vars')"
                @var-changed="$emit('room-var-changed', $event)"/>
        </div>
        <div v-show="showPlaceHolder" class="noProps">{{$t('room_editor.no_props')}}</div>
    </div>
</template>

<script>
import iro from '@jaames/iro';
import {ROOM_TOOL_TYPE, ENTITY_TYPE} from '@/common/Enums';
import GroupList from '@/components/common/GroupList';
import VarList from './VarList';

export default {
    name: 'Properties',
    props: ['camera', 'room', 'selectedTool', 'selectedEntity'],
    components: {
        GroupList,
        VarList
    },
    data(){
        return {
            TOOL_ENUMS: ROOM_TOOL_TYPE,
            objects: this.$store.getters['GameData/getAllObjects'],
            changeingBG: false,
            colorPicker: null
        }
    },
    computed: {
        showInstProps(){
            return (
                this.selectedEntity &&
                this.selectedEntity.TYPE == ENTITY_TYPE.INSTANCE &&
                !this.showCameraProps &&
                !this.showRoomProps
            );
        },
        showCameraProps(){
            return (this.selectedTool == ROOM_TOOL_TYPE.CAMERA);
        },
        showExitProps(){
            return (
                this.selectedEntity &&
                this.selectedEntity.TYPE == ENTITY_TYPE.EXIT &&
                !this.showCameraProps &&
                !this.showRoomProps
            );
        },
        showRoomProps(){
            return (this.selectedTool == ROOM_TOOL_TYPE.ROOM_PROPERTIES);
        },
        showPlaceHolder(){
            return !(this.showInstProps || this.showCameraProps || this.showExitProps || this.showRoomProps);
        },
        destinationRoomExits(){
            if (this.selectedEntity.TYPE == ENTITY_TYPE.EXIT){
                let allRooms = this.$store.getters['GameData/getAllRooms'];
                let destRoom = allRooms.find(r => r.id == this.selectedEntity.destinationRoom);
                if (destRoom){
                    return destRoom.getAllExits();
                }
            }

            return null;
        }
    },
    mounted(){
        this.colorPicker = new iro.ColorPicker('#roomBgPicker', {
            color: this.room.bgColor,
            width: 150
        });
        this.colorPicker.on("input:end", this.setRoomBgColor);
        this.$refs.bgColorBtn.style.background = this.room.bgColor;
    },
    methods: {
        checkNameCollisions(name, list){
            let nameExists;

            do{
                nameExists = false;

                for (let i = 0; i < list.length && !nameExists; i++){
                    let nameMatch = (list[i].name == name);
                    let idMatch = (list[i].id == this.selectedEntity.id);
                    nameExists |=  nameMatch && !idMatch;
                }

                if (nameExists){
                    name += '_' + this.$t('room_editor.duplicate_name_suffix');
                }
            } while(nameExists);

            return name;
        },
        setInstProp(propObj){
            this.$emit('inst-prop-set', propObj);
        },
        setCamProp(propObj){
            this.$emit('cam-prop-set', propObj);
        },
        setExitProp(propObj){
            this.$emit('exit-prop-set', propObj);
        },
        setRoomProp(propObj){
            this.$emit('room-prop-set', propObj);
        },
        setRoomBgColor(color){
            this.updateBGColorPicker(color.hexString);
            this.setRoomProp({bgColor: color.hexString});
        },
        updateBGColorPicker(hexColor){
            this.$refs.bgColorBtn.style.background = hexColor;
        },
        setInstanceName(newName){
            let instanceList = this.room.getAllInstances();
            newName = this.checkNameCollisions(newName, instanceList);

            this.setInstProp({name: newName});
        },
        setExitName(newName){
            let exitList = this.room.getAllExits();
            newName = this.checkNameCollisions(newName, exitList);

            this.setExitProp({name: newName});
        },
        closeRoomBGColorEditor(){
            this.changeingBG = false;
        },
        nanToNull(inp){
            if (isNaN(inp)){
                return null;
            }
            
            return inp;
        }
    }
}
</script>

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
    justify-content: flex-end;
    align-items: center;
    width: 100%;
}

.control > label{
    text-align: right;
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