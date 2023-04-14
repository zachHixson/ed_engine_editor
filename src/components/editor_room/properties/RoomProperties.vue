<script setup lang="ts">
import ColorPicker from '@/components/common/ColorPicker.vue';

import { ref, onMounted, watch } from 'vue';
import { useGameDataStore } from '@/stores/GameData';
import type Core from '@/core';

const gameDataStore = useGameDataStore();

const props = defineProps<{
    room: Core.Room;
}>();

const emit = defineEmits([
    'room-prop-set',
    'room-bg-changed',
    'room-bg-change-end',
]);

const changeingBG = ref<boolean>(false);
const bgColorBtn = ref<HTMLElement>();

watch(()=>props.room.bgColor, (newColor: Core.Draw.Color)=>{
    setColorBtn(newColor);
}, {immediate: true});

onMounted(()=>{
    setColorBtn(props.room.bgColor);
});

function setRoomProp(propObj: any): void {
    emit('room-prop-set', propObj);
}

function setColorBtn(newColor: Core.Draw.Color){
    if (bgColorBtn.value){
        bgColorBtn.value.style.background = newColor.toHex();
    }
}

function closeRoomBGColorEditor(): void {
    changeingBG.value = false;
}
</script>

<template>
    <div class="propContents">
        <div class="heading">{{$t('room_editor.room_properties_heading')}}</div>
        <div class="control">
            <label for="roomBGColor">{{$t('room_editor.bg_color')}}:</label>
            <button id="roomBGColor" class="changeBgBtn" ref="bgColorBtn" v-tooltip="$t('room_editor.tt_room_background')"
                @click="changeingBG = true">
                <div v-if="changeingBG" ref="bgColorEditor" class="bgColorEditor">
                    <svg width="50" height="25" class="arrow">
                        <path d="M0 25 L25 0 L50 25"/>
                    </svg>
                    <div class="contents" v-click-outside.lazy="closeRoomBGColorEditor">
                        <ColorPicker
                            :color="props.room.bgColor"
                            :width="150"
                            @change="emit('room-bg-changed', {bgColor: $event})"
                            @change-end="emit('room-bg-change-end', {bgColor: $event})"/>
                    </div>
                </div>
            </button>
        </div>
        <div class="control">
            <label for="roomPersist">{{$t('room_editor.persist')}}:</label>
            <input id="roomPersist" type="checkbox" :checked="room.persist" v-tooltip="$t('room_editor.tt_room_persist')"
                @change="setRoomProp({persist: ($event.target as any).checked})"/>
        </div>
        <div class="control">
            <label for="roomUseGrav">{{$t('room_editor.enable_gravity')}}:</label>
            <input id="roomUseGrav" type="checkbox" :checked="room.useGravity" v-tooltip="$t('room_editor.tt_room_use_gravity')"
                @change="setRoomProp({useGravity: ($event.target as any).checked})"/>
        </div>
        <div v-show="room.useGravity" class="control">
            <label for="roomGrav">{{$t('room_editor.gravity')}}:</label>
            <input id="roomGrav" type="number" step="any" :value="room.gravity" v-tooltip="$t('room_editor.tt_room_gravity')"
                @change="setRoomProp({gravity: parseFloat(($event.target as any).value)})" v-input-active/>
        </div>
        <div class="control">
            <label for="roomSetStart">{{$t('room_editor.set_start_room')}}:</label>
            <input id="roomSetStart" type="button" value="Set" v-tooltip="$t('room_editor.tt_room_starting_room')"
                @click="gameDataStore.setStartRoomId(room.id)" />
        </div>
    </div>
</template>

<style scoped>
@import '@/components/common/formStyles.css';

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