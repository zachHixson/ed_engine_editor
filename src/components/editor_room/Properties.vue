<script lang="ts">
export function checkNameCollisions(id: number, name: string, list: Core.Linked_List<Core.Instance_Base>, suffix: string): string {
    let nameExists;

    do{
        nameExists = false;

        list.forEach(instance => {
            const nameMatch = instance.name == name;
            const idMatch = instance.id == id;
            nameExists ||= nameMatch && !idMatch;
        })

        if (nameExists){
            name += '_' + suffix;
        }
    } while(nameExists);

    return name;
}

export function nanToNull(inp: number): number | null {
    if (isNaN(inp)){
        return null;
    }
    
    return inp;
}
</script>

<script setup lang="ts">
import SpriteProperties from './properties/SpriteProperties.vue';
import ObjectProperties from './properties/ObjectProperties.vue';
import LogicProperties from './properties/LogicProperties.vue';
import CameraProperties from './properties/CameraProperties.vue';
import ExitProperties from './properties/ExitProperties.vue';
import RoomProperties from './properties/RoomProperties.vue';

import { computed } from 'vue';
import Core from '@/core';

const props = defineProps<{
    camera: Core.Camera,
    room: Core.Room,
    selectedTool: Core.ROOM_TOOL_TYPE | null,
    selectedInstance: Core.Instance_Base | null,
}>();

const emit = defineEmits([
    'inst-prop-set',
    'inst-group-changed',
    'cam-prop-set',
    'exit-prop-set',
    'room-prop-set',
]);

const showSpriteProps = computed(()=>(
    props.selectedTool == Core.ROOM_TOOL_TYPE.SELECT_MOVE &&
    props.selectedInstance?.TYPE == Core.INSTANCE_TYPE.SPRITE
))
const showObjectProps = computed(()=>(
    props.selectedTool == Core.ROOM_TOOL_TYPE.SELECT_MOVE &&
    props.selectedInstance?.TYPE == Core.INSTANCE_TYPE.OBJECT
));
const showLogicProps = computed(()=>(
    props.selectedTool == Core.ROOM_TOOL_TYPE.SELECT_MOVE &&
    props.selectedInstance?.TYPE == Core.INSTANCE_TYPE.LOGIC
));
const showCameraProps = computed(()=>props.selectedTool == Core.ROOM_TOOL_TYPE.CAMERA);
const showExitProps = computed(()=>(
    props.selectedInstance?.TYPE == Core.INSTANCE_TYPE.EXIT &&
    (props.selectedTool == Core.ROOM_TOOL_TYPE.SELECT_MOVE || props.selectedTool == Core.ROOM_TOOL_TYPE.EXIT)
));
const showRoomProps = computed(()=>props.selectedTool == Core.ROOM_TOOL_TYPE.ROOM_PROPERTIES);
const showPlaceHolder = computed(()=>
    (props.selectedTool == Core.ROOM_TOOL_TYPE.SELECT_MOVE || props.selectedTool == Core.ROOM_TOOL_TYPE.EXIT) &&
    !props.selectedInstance
);
</script>

<template>
    <div class="properties">
        <SpriteProperties
            v-if="showSpriteProps"
            :selected-sprite="(selectedInstance as Core.Instance_Sprite)"
            :selected-room="room"
            @inst-prop-set="emit('inst-prop-set', $event)"
            @inst-group-changed="emit('inst-group-changed', $event)"></SpriteProperties>
        <ObjectProperties
            v-if="showObjectProps"
            :selected-object="(selectedInstance as Core.Instance_Object)"
            :selected-room="room"
            @inst-prop-set="emit('inst-prop-set', $event)"
            @inst-group-changed="emit('inst-group-changed', $event)"></ObjectProperties>
        <LogicProperties
            v-if="showLogicProps"
            :selected-logic="(selectedInstance as Core.Instance_Logic)"
            :selected-room="room"
            @inst-prop-set="emit('inst-prop-set', $event)"
            @inst-group-changed="emit('inst-group-changed', $event)"></LogicProperties>
        <CameraProperties
            v-if="showCameraProps"
            :selected-instance="selectedInstance"
            :camera="camera"
            @cam-prop-set="emit('cam-prop-set', $event)"></CameraProperties>
        <ExitProperties
            v-if="showExitProps"
            :selected-instance="selectedInstance!"
            :room="room"></ExitProperties>
        <RoomProperties
            v-show="showRoomProps"
            :room="room"
            @room-prop-set="emit('room-prop-set', $event)"></RoomProperties>
        <div v-show="showPlaceHolder" class="noProps">{{$t('room_editor.no_props')}}</div>
    </div>
</template>

<style scoped>
@import '@/components/common/formStyles.css';

.properties{
    display: flex;
    flex-direction: column;
    padding: 10px;
    user-select: none;
}

.properties:deep(.propContents){
    display: flex;
    flex-direction: column;
    gap: 10px;
}

.properties:deep(.collapsible-props){
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    width: 100%;
    gap: 10px;
}

.properties:deep(.heading){
    font-size: 1.3em;
    font-weight: bold;
}

.properties:deep(.info){
    --margin: 20px;
    width: 100%;
    display: flex;
    flex-direction: row;
    justify-content: space-between;
}

.properties:deep(.control){
    display: flex;
    flex-direction: row;
    justify-content: flex-end;
    align-items: center;
    width: 100%;
}

.properties:deep(.control > label){
    text-align: right;
    flex-shrink: 1;
    width: max-content;
}

.properties:deep(.control > input),
.properties:deep(.control > select),
.properties:deep(.control > button){
    width: 100px;
    box-sizing: border-box;
    margin: 0;
    margin-left: 10px;
}

.properties:deep(.control > .custom-checkbox){
    margin: 45px;
    margin-top: 0;
    margin-bottom: 0;
}

.properties:deep(.changeBgBtn){
    position: relative;
    height: 40px;
    border: 2px solid var(--border);
    border-radius: var(--corner-radius);
}

.properties:deep(.changeBgBtn:hover){
    border-color: var(--button-dark-hover);
}
</style>