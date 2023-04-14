<script setup lang="ts">
import Collapsible from './Collapsible.vue';
import GroupList from '@/components/common/GroupList.vue';
import Checkbox from '@/components/common/Checkbox.vue';

import type Core from '@/core';
import { checkNameCollisions, nanToNull } from '../Properties.vue';
import { useI18n } from 'vue-i18n';

const { t } = useI18n();

const props = defineProps<{
    selectedObject: Core.Instance_Object;
    selectedRoom: Core.Room;
}>();

const emit = defineEmits([
    'inst-prop-set',
    'inst-group-changed',
]);

function setInstProp(propObj: any): void {
    emit('inst-prop-set', propObj);
}

function setInstanceName(newName: string): void {
    const instanceList = props.selectedRoom.instances;
    newName = checkNameCollisions(props.selectedObject.id, newName, instanceList, t('room_editor.duplicate_name_suffix'));

    setInstProp({name: newName});
}
</script>

<template>
    <div class="propContents">
        <div class="heading">{{$t('room_editor.object_properties_heading')}}</div>
        <div class="info" style="margin: var(--margin); margin-left: 0px;">
            <div>{{$t('room_editor.object_type')}}:</div>
            <div>{{(selectedObject as Core.Instance_Object).objRef.name}}</div>
        </div>
        <div class="control">
            <label for="instName">{{$t('room_editor.instance_name')}}:</label>
            <input id="instName" type="text" :value="selectedObject!.name" v-tooltip="$t('room_editor.tt_inst_name')"
                @change="setInstanceName(($event.target as any).value)" v-input-active/>
        </div>
        <div class="control">
            <label for="instCollisionOvrr">{{$t('room_editor.collision')}}:</label>
            <select id="instCollisionOvrr" :value="(selectedObject as Core.Instance_Object).collisionOverride" v-tooltip="$t('room_editor.tt_coll_ovr')"
                @change="setInstProp({collisionOverride: ($event.target as any).value})">
                <option :value="(selectedObject as Core.Instance_Object).COLLISION_OVERRIDES.KEEP">{{$t('room_editor.keep')}}</option>
                <option :value="(selectedObject as Core.Instance_Object).COLLISION_OVERRIDES.FORCE">{{$t('room_editor.on')}}</option>
                <option :value="(selectedObject as Core.Instance_Object).COLLISION_OVERRIDES.IGNORE">{{$t('room_editor.off')}}</option>
            </select>
        </div>
        <div class="control">
            <label for="instCustDepth">{{$t('room_editor.custom_depth')}}:</label>
            <input id="instCustDepth" type="number" :value="(selectedObject as Core.Instance_Object).zDepthOverride" v-tooltip="$t('room_editor.tt_cust_depth')"
                @change="setInstProp({zDepthOverride: nanToNull(parseInt(($event.target as any).value))})" v-input-active/>
        </div>
        <Collapsible
            heading-text="Animation Settings">
            <div class="collapsible-props">
                <div class="control">
                    <label for="animPlay">{{ t('object_editor.is_playing') }}:</label>
                    <Checkbox class="custom-checkbox" :value="selectedObject.animPlayingOverride" :triple="true" v-tooltip="$t('room_editor.tt_anim_play_triple')"
                        @change="setInstProp({animPlayingOverride: $event})"></Checkbox>
                </div>
                <div class="control">
                    <label for="loop">{{ t('object_editor.loop') }}:</label>
                    <Checkbox class="custom-checkbox" :value="selectedObject.animLoopOverride" :triple="true" v-tooltip="$t('room_editor.tt_anim_loop_triple')"
                        @change="setInstProp({animLoopOverride: $event})"></Checkbox>
                </div>
                <div class="control">
                    <label for="startframe">{{$t('object_editor.start_frame')}}:</label>
                    <input id="startframe" type="number" :value="selectedObject.startFrameOverride" v-tooltip="$t('room_editor.tt_start_frame_nullable')"
                        @change="setInstProp({startFrameOverrideClamped: nanToNull(parseInt(($event.target as any).value))})" v-input-active/>
                </div>
                <div class="control">
                    <label for="fps">{{$t('object_editor.fps')}}:</label>
                    <input id="fps" type="number" :value="selectedObject.fpsOverride" v-tooltip="$t('room_editor.tt_fps_nullable')"
                        @change="setInstProp({fpsOverride: nanToNull(parseInt(($event.target as any).value))})" v-input-active/>
                </div>
            </div>
        </Collapsible>
        <GroupList
            :editList="selectedObject!.groups"
            :readOnlyList="(selectedObject as Core.Instance_Object).objRef.groups"
            @group-changed="emit('inst-group-changed', $event)"/>
        </div>
</template>

<style scoped>
@import '@/components/common/formStyles.css';
</style>