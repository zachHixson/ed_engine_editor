<script setup lang="ts">
import Collapsible from './Collapsible.vue';
import Checkbox from '@/components/common/Checkbox.vue';
import GroupList from '@/components/common/GroupList.vue';

import { checkNameCollisions, nanToNull } from '../Properties.vue';
import { useI18n } from 'vue-i18n';
import type Core from '@/core';

const { t } = useI18n();

const props = defineProps<{
    selectedSprite: Core.Instance_Sprite;
    selectedRoom: Core.Room;
}>();

const emit = defineEmits([
    'inst-prop-set',
    'inst-group-changed',
]);

function setInstanceName(newName: string): void {
    const instanceList = props.selectedRoom.instances;
    newName = checkNameCollisions(props.selectedSprite.id, newName, instanceList, t('room_editor.duplicate_name_suffix'));

    setInstProp({name: newName});
}

function setInstProp(propObj: any): void {
    emit('inst-prop-set', propObj);
}
</script>

<template>
    <div class="propContents">
        <div class="heading">{{ t('room_editor.sprite_properties_heading') }}</div>
        <div class="info" style="margin: var(--margin); margin-left: 0px;">
            <div>{{ t('room_editor.sprite_type') }}:</div>
            <div>{{(selectedSprite as Core.Instance_Sprite).sprite?.name ?? t('generic.no_option')}}</div>
        </div>
        <div class="control">
            <label for="name">{{$t('room_editor.instance_name')}}:</label>
            <input id="name" type="text" :value="selectedSprite.name" v-tooltip="$t('room_editor.tt_inst_name')"
                @change="setInstanceName(($event.target as any).value)" v-input-active/>
        </div>
        <div class="control">
            <label for="custDepth">{{$t('room_editor.custom_depth')}}:</label>
            <input id="custDepth" type="number" :value="selectedSprite.zDepthOverride ?? ''" v-tooltip="$t('room_editor.tt_cust_depth')"
                @change="setInstProp({zDepthOverride: nanToNull(parseInt(($event.target as any).value))})" v-input-active/>
        </div>
        <Collapsible
            heading-text="Animation Settings">
            <div class="collapsible-props">
                <div class="control">
                    <label for="animPlay">{{ t('object_editor.is_playing') }}:</label>
                    <Checkbox id="animPlay" class="custom-checkbox" :value="!!selectedSprite.animPlayingOverride" v-tooltip="$t('room_editor.tt_anim_play')"
                        @change="setInstProp({animPlayingOverride: $event})"/>
                </div>
                <div class="control">
                    <label for="loop">{{ t('object_editor.loop') }}:</label>
                    <Checkbox id="loop" class="custom-checkbox" :value="!!selectedSprite.animLoopOverride" v-tooltip="$t('room_editor.tt_anim_loop_triple')"
                        @change="setInstProp({animLoopOverride: $event})"/>
                </div>
                <div class="control">
                    <label for="startframe">{{$t('object_editor.start_frame')}}:</label>
                    <input id="startframe" type="number" :value="selectedSprite.startFrame" v-tooltip="$t('room_editor.tt_start_frame')"
                        @change="setInstProp({startFrame: nanToNull(parseInt(($event.target as any).value))})" v-input-active/>
                </div>
                <div class="control">
                    <label for="fps">{{$t('object_editor.fps')}}:</label>
                    <input id="fps" type="number" :value="selectedSprite.fpsOverride" v-tooltip="$t('room_editor.tt_fps')"
                        @change="setInstProp({fpsOverride: nanToNull(parseInt(($event.target as any).value))})" v-input-active/>
                </div>
            </div>
        </Collapsible>
        <GroupList
            :editList="selectedSprite.groups"
            @group-changed="emit('inst-group-changed', $event)"/>
    </div>
</template>

<style scoped>
@import '@/components/common/formStyles.css';
</style>