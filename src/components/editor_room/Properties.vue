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

export function nanToPrev(inp: number, getter: ()=>number): number {
    if (isNaN(inp)) {
        return getter();
    }

    return inp;
}
</script>

<script setup lang="ts">
import { ROOM_TOOL_TYPE } from '@/stores/RoomEditor';
import { type iGroupChangedProps } from '@/components/common/GroupList.vue';
import AddBrushProperties from './properties/AddBrushProperties.vue';
import SpriteProperties from './properties/SpriteProperties.vue';
import ObjectProperties from './properties/ObjectProperties.vue';
import LogicProperties from './properties/LogicProperties.vue';
import EraserProperties from './properties/EraserProperties.vue';
import CameraProperties from './properties/CameraProperties.vue';
import ExitProperties from './properties/ExitProperties.vue';
import RoomProperties from './properties/RoomProperties.vue';

import { computed } from 'vue';
import { useAssetBrowserStore } from '@/stores/AssetBrowser';
import { useI18nStore } from '@/stores/I18n';
import Core from '@/core';

const assetBrowserStore = useAssetBrowserStore();
const { t } = useI18nStore();

const props = defineProps<{
    camera: Core.Camera,
    room: Core.Room,
    selectedTool: ROOM_TOOL_TYPE | null,
    selectedInstance: Core.Instance_Base | null,
}>();

const emit = defineEmits<{
    instPropSet: [Partial<Core.Instance_Base>],
    instGroupChanged: [iGroupChangedProps],
    instDeleted: [{id?: number, commit: boolean}],
    camPropSet: [Partial<Core.Camera>],
    exitPropSet: [Partial<Core.Instance_Exit>],
    roomPropSet: [Partial<Core.Room>],
    roomBgChanged: [Partial<Core.Room>],
    roomBgChangeEnd: [Partial<Core.Room>],
}>();

const showAddBrushProps = computed(()=>props.selectedTool == ROOM_TOOL_TYPE.ADD_BRUSH);
const showSpriteProps = computed(()=>(
    props.selectedTool == ROOM_TOOL_TYPE.SELECT_MOVE &&
    props.selectedInstance?.TYPE == Core.INSTANCE_TYPE.SPRITE
))
const showObjectProps = computed(()=>(
    props.selectedTool == ROOM_TOOL_TYPE.SELECT_MOVE &&
    props.selectedInstance?.TYPE == Core.INSTANCE_TYPE.OBJECT
));
const showLogicProps = computed(()=>(
    props.selectedTool == ROOM_TOOL_TYPE.SELECT_MOVE &&
    props.selectedInstance?.TYPE == Core.INSTANCE_TYPE.LOGIC
));
const showEraserProps = computed(()=>props.selectedTool == ROOM_TOOL_TYPE.ERASER);
const showCameraProps = computed(()=>props.selectedTool == ROOM_TOOL_TYPE.CAMERA);
const showExitProps = computed(()=>(
    props.selectedInstance?.TYPE == Core.INSTANCE_TYPE.EXIT &&
    (props.selectedTool == ROOM_TOOL_TYPE.SELECT_MOVE || props.selectedTool == ROOM_TOOL_TYPE.EXIT)
));
const showRoomProps = computed(()=>props.selectedTool == ROOM_TOOL_TYPE.ROOM_PROPERTIES);
const showNoSelection = computed(()=>
    (props.selectedTool == ROOM_TOOL_TYPE.SELECT_MOVE || props.selectedTool == ROOM_TOOL_TYPE.EXIT) &&
    !props.selectedInstance
);
const showNoToolProps = computed(()=>!props.selectedTool);
</script>

<template>
    <div class="properties">
        <AddBrushProperties
            v-if="showAddBrushProps"
            :selected-asset="assetBrowserStore.getSelectedAsset"
            :selected-instance="selectedInstance"></AddBrushProperties>
        <SpriteProperties
            v-if="showSpriteProps"
            :selected-sprite="(selectedInstance as Core.Instance_Sprite)"
            :selected-room="room"
            @instPropSet="emit('instPropSet', $event)"
            @instGroupChanged="emit('instGroupChanged', $event)"></SpriteProperties>
        <ObjectProperties
            v-if="showObjectProps"
            :selected-object="(selectedInstance as Core.Instance_Object)"
            :selected-room="room"
            @instPropSet="emit('instPropSet', $event)"
            @instGroupChanged="emit('instGroupChanged', $event)"></ObjectProperties>
        <LogicProperties
            v-if="showLogicProps"
            :selected-logic="(selectedInstance as Core.Instance_Logic)"
            :selected-room="room"
            @instPropSet="emit('instPropSet', $event)"
            @instGroupChanged="emit('instGroupChanged', $event)"></LogicProperties>
        <EraserProperties
            v-if="showEraserProps"
            :selectedAsset="assetBrowserStore.getSelectedAsset"
            :selectedRoom="room"
            @instDeleted="emit('instDeleted', $event)"></EraserProperties>
        <CameraProperties
            v-if="showCameraProps"
            :selected-instance="selectedInstance"
            :selected-room="room"
            :camera="camera"
            @camPropSet="emit('camPropSet', $event)"></CameraProperties>
        <ExitProperties
            v-if="showExitProps"
            :selectedExit="(selectedInstance as Core.Instance_Exit)"
            :room="room"
            @exitPropSet="emit('exitPropSet', $event)"></ExitProperties>
        <RoomProperties
            v-show="showRoomProps"
            :room="room"
            @roomPropSet="emit('roomPropSet', $event)"
            @roomBgChanged="emit('roomBgChanged', $event)"
            @roomBgChangeEnd="emit('roomBgChangeEnd', $event)"></RoomProperties>
        <div v-show="showNoSelection" class="noProps">{{ t('room_editor.no_selection') }}</div>
        <div v-show="showNoToolProps" class="noProps">{{ t('room_editor.no_tool_props') }}</div>
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
.properties:deep(.control > .custom-select),
.properties:deep(.control > button){
    width: 100px;
    min-height: 30px;
    box-sizing: border-box;
    margin: 0;
    margin-left: 10px;
}

.properties:deep(.control > .custom-checkbox){
    flex-shrink: 0;
    width: 20px;
    height: 20px;
    margin-left: 10px;
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
