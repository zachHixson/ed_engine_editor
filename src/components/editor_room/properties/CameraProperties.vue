<script setup lang="ts">
import Core from '@/core';

const props = defineProps<{
    selectedInstance: Core.Instance_Base | null;
    camera: Core.Camera;
}>();

const emit = defineEmits([
    'cam-prop-set',
]);

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
            <input id="camFollowObj" type="button" value="Set" v-tooltip="$t('room_editor.tt_camera_follow_obj')"
                @click="setFollowObj()" :disabled="!selectedInstance" />
        </div>
    </div>
</template>

<style scoped>
@import '@/components/common/formStyles.css';
</style>