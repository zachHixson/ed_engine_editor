<script setup lang="ts">
import Svg from '@/components/common/Svg.vue';
import SearchDropdown from '@/components/common/SearchDropdown.vue';

import { computed } from 'vue';
import { useI18nStore } from '@/stores/I18n';
import Core from '@/core';

import eyedropperIcon from '@/assets/eye_dropper.svg';

const { t } = useI18nStore();

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
    if (!props.selectedInstance) return;
    props.camera.followObjId = props.selectedInstance!.id;
}
</script>

<template>
    <div class="propContents">
        <div class="heading">{{ t('room_editor.camera_properties_heading') }}</div>
        <div class="control">
            <label for="cameraSize">{{ t('room_editor.camera_size') }}:</label>
            <input id="cameraSize" type="number" :value="camera.size" v-tooltip="t('room_editor.tt_camera_size')"
                @change="setCamProp({size: ($event.target as any).value}); ($event.target as any).value = camera.size" v-input-active/>
        </div>
        <div class="control">
            <label for="camMoveType">{{ t('room_editor.camera_move_type') }}:</label>
            <SearchDropdown
                id="camMoveType"
                class="custom-select"
                :value="camera.moveType"
                :items="[
                    { name: t('room_editor.locked'), id: Core.Camera.MOVE_TYPES.LOCKED, value: Core.Camera.MOVE_TYPES.LOCKED },
                    { name: t('room_editor.follow'), id: Core.Camera.MOVE_TYPES.FOLLOW, value: Core.Camera.MOVE_TYPES.FOLLOW },
                    { name: t('room_editor.scroll'), id: Core.Camera.MOVE_TYPES.SCROLL, value: Core.Camera.MOVE_TYPES.SCROLL },
                ]"
                @change="setCamProp({moveType: $event})"
                v-tooltip="t('room_editor.tt_camera_move')"></SearchDropdown>
        </div>
        <div v-show="camera.moveType == Core.Camera.MOVE_TYPES.SCROLL" class="control">
            <label for="camScrollDir">{{t('room_editor.scroll_dir')}}: </label>
            <SearchDropdown
                id="camScrollDir"
                class="custom-select"
                :value="camera.scrollDir"
                :items="[
                    { name: t('room_editor.up'), id: Core.Camera.SCROLL_DIRS.UP, value: Core.Camera.SCROLL_DIRS.UP },
                    { name: t('room_editor.down'), id: Core.Camera.SCROLL_DIRS.DOWN, value: Core.Camera.SCROLL_DIRS.DOWN },
                    { name: t('room_editor.left'), id: Core.Camera.SCROLL_DIRS.LEFT, value: Core.Camera.SCROLL_DIRS.LEFT },
                    { name: t('room_editor.right'), id: Core.Camera.SCROLL_DIRS.RIGHT, value: Core.Camera.SCROLL_DIRS.RIGHT },
                ]"
                @change="setCamProp({scrollDir: $event})"
                v-tooltip="t('room_editor.tt_camera_scroll_dir')"></SearchDropdown>
        </div>
        <div v-show="camera.moveType == Core.Camera.MOVE_TYPES.SCROLL" class="control">
            <label for="camScrollSpeed">{{ t('room_editor.scroll_speed') }}: </label>
            <input id="camScrollSpeed" type="number" step="any" :value="camera.scrollSpeed" v-tooltip="t('room_editor.tt_camera_scroll_speed')"
                @change="setCamProp({scrollSpeed: parseFloat(($event.target as any).value)})" v-input-active/>
        </div>
        <div v-show="camera.moveType == Core.Camera.MOVE_TYPES.FOLLOW" class="control">
            <label for="camFollowType">{{ t('room_editor.follow_type') }}: </label>
            <SearchDropdown
                id="camFollowType"
                class="custom-select"
                :value="camera.followType"
                :items="[
                    { name: t('room_editor.smart'), id: Core.Camera.FOLLOW_TYPES.SMART, value: Core.Camera.FOLLOW_TYPES.SMART },
                    { name: t('room_editor.centered'), id: Core.Camera.FOLLOW_TYPES.CENTERED, value: Core.Camera.FOLLOW_TYPES.CENTERED },
                    { name: t('room_editor.tiled'), id: Core.Camera.FOLLOW_TYPES.TILED, value: Core.Camera.FOLLOW_TYPES.TILED },
                ]"
                @change="setCamProp({followType: $event})"
                v-tooltip="t('room_editor.tt_camera_follow_type')"></SearchDropdown>
        </div>
        <div v-show="camera.moveType == Core.Camera.MOVE_TYPES.FOLLOW" class="control">
            <label for="camFollowObj">{{t('room_editor.follow_obj')}}: </label>
            <div class="followObjInfo">
                <div class="followObjName" v-tooltip="()=>followObjName">{{ followObjName }}</div>
                <button @click="setFollowObj" v-tooltip="t('room_editor.tt_camera_follow_obj')">
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
    border: 2px solid var(--border);
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