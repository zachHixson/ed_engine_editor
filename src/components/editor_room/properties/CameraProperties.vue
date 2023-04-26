<script setup lang="ts">
import Svg from '@/components/common/Svg.vue';

import { computed } from 'vue';
import Core from '@/core';

import eyedropperIcon from '@/assets/eye_dropper.svg';

const props = defineProps<{
    selectedInstance: Core.Instance_Base | null;
    selectedRoom: Core.Room,
    camera: Core.Camera;
}>();

const emit = defineEmits([
    'cam-prop-set',
]);

const followObjName = computed(()=>props.selectedRoom.instances.find(i => i.id == props.camera.followObjId)?.name ?? 'none');

function setCamProp(propObj: any): void {
    emit('cam-prop-set', propObj);
}

function setFollowObj(): void {
    props.camera.followObjId = props.selectedInstance!.id;
}
</script>

<template>
    <div class="propContents">
        <div class="heading">{{$t('room_editor.camera_properties_heading')}}</div>
        <div class="control">
            <label for="cameraSize">{{$t('room_editor.camera_size')}}:</label>
            <input id="cameraSize" type="number" :value="camera.size" v-tooltip="$t('room_editor.tt_camera_size')"
                @change="setCamProp({size: ($event.target as any).value}); ($event.target as any).value = camera.size" v-input-active/>
        </div>
        <div class="control">
            <label for="camMoveType">{{$t('room_editor.camera_move_type')}}:</label>
            <select id="camMoveType" :value="camera.moveType" v-tooltip="$t('room_editor.tt_camera_move')"
                @change="setCamProp({moveType: ($event.target as any).value})">
                <option :value="Core.Camera.MOVE_TYPES.LOCKED">{{$t('room_editor.locked')}}</option>
                <option :value="Core.Camera.MOVE_TYPES.FOLLOW">{{$t('room_editor.follow')}}</option>
                <option :value="Core.Camera.MOVE_TYPES.SCROLL">{{$t('room_editor.scroll')}}</option>
            </select>
        </div>
        <div v-show="camera.moveType == Core.Camera.MOVE_TYPES.SCROLL" class="control">
            <label for="camScrollDir">{{$t('room_editor.scroll_dir')}}: </label>
            <select id="camScrollDir" :value="camera.scrollDir" v-tooltip="$t('room_editor.tt_camera_scroll_dir')"
                @change="setCamProp({scrollDir: ($event.target as any).value})">
                <option :value="Core.Camera.SCROLL_DIRS.UP">{{$t('room_editor.up')}}</option>
                <option :value="Core.Camera.SCROLL_DIRS.DOWN">{{$t('room_editor.down')}}</option>
                <option :value="Core.Camera.SCROLL_DIRS.LEFT">{{$t('room_editor.left')}}</option>
                <option :value="Core.Camera.SCROLL_DIRS.RIGHT">{{$t('room_editor.right')}}</option>
            </select>
        </div>
        <div v-show="camera.moveType == Core.Camera.MOVE_TYPES.SCROLL" class="control">
            <label for="camScrollSpeed">{{$t('room_editor.scroll_speed')}}: </label>
            <input id="camScrollSpeed" type="number" step="any" :value="camera.scrollSpeed" v-tooltip="$t('room_editor.tt_camera_scroll_speed')"
                @change="setCamProp({scrollSpeed: parseFloat(($event.target as any).value)})" v-input-active/>
        </div>
        <div v-show="camera.moveType == Core.Camera.MOVE_TYPES.FOLLOW" class="control">
            <label for="camFollowType">{{$t('room_editor.follow_type')}}: </label>
            <select id="camFollowType" :value="camera.followType" v-tooltip="$t('room_editor.tt_camera_follow_type')"
                @change="setCamProp({followType: ($event.target as any).value})">
                <option :value="Core.Camera.FOLLOW_TYPES.SMART">{{$t('room_editor.smart')}}</option>
                <option :value="Core.Camera.FOLLOW_TYPES.CENTERED">{{$t('room_editor.centered')}}</option>
                <option :value="Core.Camera.FOLLOW_TYPES.TILED">{{$t('room_editor.tiled')}}</option>
            </select>
        </div>
        <div v-show="camera.moveType == Core.Camera.MOVE_TYPES.FOLLOW" class="control">
            <label for="camFollowObj">{{$t('room_editor.follow_obj')}}: </label>
            <div class="followObjInfo">
                <div class="followObjName" v-tooltip="()=>followObjName">{{ followObjName }}</div>
                <button @click="setFollowObj" v-tooltip="$t('room_editor.tt_camera_follow_obj')">
                    <Svg :src="eyedropperIcon"></Svg>
                </button>
            </div>
        </div>
    </div>
</template>

<style scoped>
@import '@/components/common/formStyles.css';

.followObjInfo{
    display: flex;
    flex-direction: row;
    justify-content: space-between;
    align-items: center;
    width: 100px;
    height: 30px;
    background: #EEEEEE;
    margin-left: 10px;
    border: 2px solid gray;
    border-radius: 10px;
    box-sizing: border-box;
    overflow: hidden;
}

.followObjName{
    display: flex;
    justify-content: flex-start;
    overflow-x: hidden;
    text-overflow: ellipsis;
    flex-shrink: 1;
    flex-grow: 0;
    padding: 5px;
}

.followObjInfo > button {
    height: 100%;
    width: 20px;
    flex-shrink: 0;
    background: var(--button-dark-norm);
    border: none;
}

.followObjInfo > button:hover {
    background: var(--button-dark-hover);
}

.followObjInfo > button:active {
    background: var(--button-dark-down);
}
</style>