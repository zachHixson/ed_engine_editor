<template>
    <div class="properties">
        <div v-if="showInstProps" class="propContents">
            <div class="heading">{{$t('room_editor.object_properties_heading')}}</div>
            <div class="control">
                <label>{{$t('room_editor.object_type')}}:</label>
                <div class="info">{{selectedInstance.objRef.name}}</div>
            </div>
            <div class="control">
                <label>{{$t('room_editor.instance_id')}}:</label>
                <div class="info">{{selectedInstance.id}}</div>
            </div>
            <div class="control">
                <label for="instName">{{$t('room_editor.instance_name')}}:</label>
                <input id="instName" type="text" :value="selectedInstance.instanceName" :title="$t('room_editor.tt_inst_name')"
                    @change="setInstanceName($event.target.value)"/>
            </div>
            <div class="control">
                <label for="instCollisionOvrr">{{$t('room_editor.collision')}}:</label>
                <select id="instCollisionOvrr" :value="selectedInstance.collisionOverride" :title="$t('room_editor.tt_coll_ovr')"
                    @change="setInstProp({collisionOverride: parseInt($event.target.value)})">
                    <option :value="selectedInstance.COLLISION_OVERRIDES.KEEP">{{$t('room_editor.keep')}}</option>
                    <option :value="selectedInstance.COLLISION_OVERRIDES.FORCE">{{$t('room_editor.on')}}</option>
                    <option :value="selectedInstance.COLLISION_OVERRIDES.IGNORE">{{$t('room_editor.off')}}</option>
                </select>
            </div>
            <div class="control">
                <label for="instCustDepth">{{$t('room_editor.custom_depth')}}:</label>
                <input id="instCustDepth" type="number" :value="selectedInstance.zDepthOverride" :title="$t('room_editor.tt_cust_depth')"
                    @change="setInstProp({zDepthOverride: nanToNull(parseInt($event.target.value))})"/>
            </div>
            <div class="editList">
                <label>{{$t('room_editor.custom_variables')}}:</label>
                <VarList
                    :editList="selectedInstance.customVars"
                    :tooltip_text="$t('room_editor.tt_cust_inst_vars')"
                    @var-changed="$emit('inst-var-changed', $event)" />
            </div>
        </div>
        <div v-show="showCameraProps" class="propContents">
            <div class="heading">{{$t('room_editor.camera_properties_heading')}}</div>
            <div class="control">
                <label for="cameraSize">{{$t('room_editor.camera_size')}}:</label>
                <input id="cameraSize" type="number" :value="camera.size" :title="$t('room_editor.tt_camera_size')"
                    @change="setCamProp({size: $event.target.value}); $event.target.value = camera.size"/>
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
                    @change="setCamProp({scrollSpeed: parseFloat($event.target.value)})"/>
            </div>
            <div v-show="camera.moveType == camera.MOVE_TYPES.FOLLOW" class="control">
                <label for="camFollowObj">{{$t('room_editor.follow_obj')}}: </label>
                <select id="camFollowObj" :value="camera.followObjId" :title="$t('room_editor.tt_camera_follow_obj')"
                    @change="setCamProp({followObjId: parseInt($event.target.value)})">
                    <option :value="null">{{$t('generic.no_option')}}</option>
                    <option
                        v-for="object in objects"
                        :key="object.ID"
                        :value="object.ID">{{object.name}}</option>
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
        <div v-show="showRoomProps" class="propContents">
            <div class="heading">{{$t('room_editor.room_properties_heading')}}</div>
            <div class="control">
                <label for="roomBGColor">{{$t('room_editor.bg_color')}}:</label>
                <button id="roomBGColor" class="changeBgBtn" ref="bgColorBtn" :title="$t('room_editor.tt_room_background')"
                    @click="$nextTick(()=>{changeingBG = !changeingBG})"
                    v-click-outside="closeRoomBGColorEditor">
                    <div v-show="changeingBG" ref="bgColorEditor" class="bgColorEditor">
                        <div class="arrow"></div>
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
                    @change="setRoomProp({gravity: parseFloat($event.target.value)})"/>
            </div>
            <div class="control">
                <label for="roomSetStart">{{$t('room_editor.set_start_room')}}:</label>
                <input id="roomSetStart" type="button" value="Set" :title="$t('room_editor.tt_room_starting_room')"
                    @click="$store.dispatch('GameData/setStartRoomId', room.ID)" />
            </div>
            <div class="list">
                <label>{{$t('room_editor.custom_variables')}}:</label>
                <VarList
                    :editList="room.customVars"
                    :tooltip_text="$t('room_editor.tt_cust_room_vars')"
                    @var-changed="$emit('room-var-changed', $event)"/>
            </div>
        </div>
        <div v-show="showPlaceHolder" class="noProps">{{$t('room_editor.no_props')}}</div>
    </div>
</template>

<script>
import iro from '@jaames/iro';
import {ROOM_TOOL_TYPE} from '@/common/Enums';
import VarList from './VarList';

export default {
    name: 'Properties',
    props: ['camera', 'room', 'selectedTool', 'selectedInstance'],
    components: {
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
                this.selectedInstance &&
                this.selectedTool != ROOM_TOOL_TYPE.CAMERA &&
                this.selectedTool != ROOM_TOOL_TYPE.ROOM_PROPERTIES
            )
        },
        showCameraProps(){
            return (this.selectedTool == ROOM_TOOL_TYPE.CAMERA);
        },
        showRoomProps(){
            return (this.selectedTool == ROOM_TOOL_TYPE.ROOM_PROPERTIES);
        },
        showPlaceHolder(){
            return !(this.showInstProps || this.showCameraProps || this.showRoomProps);
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
        setInstProp(propObj){
            this.$emit('inst-prop-set', propObj);
        },
        setCamProp(propObj){
            this.$emit('cam-prop-set', propObj);
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
            let nameExists;

            do{
                nameExists = false;

                for (let i = 0; i < instanceList.length && !nameExists; i++){
                    let nameMatch = (instanceList[i].instanceName == newName);
                    let idMatch = (instanceList[i].id == this.selectedInstance.id);
                    nameExists |=  nameMatch && !idMatch;
                }

                if (nameExists){
                    newName += '_' + this.$t('room_editor.duplicate_name_suffix');
                }
            } while(nameExists);

            this.setInstProp({instanceName: newName});
        },
        closeRoomBGColorEditor(){
            this.changeingBG = false;
        },
        nanToNull(inp){
            if (inp){
                return inp;
            }
            
            return null;
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

.heading{
    font-size: 1.3em;
    margin-bottom: 10px;
}

.control{
    display: flex;
    flex-direction: row;
    justify-content: end;
    width: 100%;
    margin-bottom: 5px;
}

.control > label{
    text-align: right;
}

.control > input, .control > select, .control > button, .control > .info{
    width: 100px;
    box-sizing: border-box;
    margin-left: 10px;
}

.changeBgBtn{
    position: relative;
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
    width: 0;
    height: 0;
    border-left: 20px solid transparent;
    border-right: 20px solid transparent;
    border-bottom: 20px solid gray;
    margin-right: 20px;
}

.bgColorEditor > .contents{
    display: flex;
    flex-direction: column;
    align-items: center;
    background: gray;
    width: 100%;
    flex-grow: 1;
    border-radius: 10px;
    padding: 10px;
}
</style>