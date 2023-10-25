<script lang="ts">
export const ObjectMainEventBus = new Core.Event_Bus();
</script>

<script setup lang="ts">
import AnimationPlayer from '@/components/common/AnimationPlayer.vue';
import GroupList from '@/components/common/GroupList.vue';
import CategoryWrapper from './CategoryWrapper.vue';
import SearchDropdown from '../common/SearchDropdown.vue';
import Svg from '../common/Svg.vue';

import { ref, computed, nextTick } from 'vue';
import { useGameDataStore } from '@/stores/GameData';
import { useI18n } from 'vue-i18n';
import { AssetBrowserEventBus } from '../asset_browser/AssetBrowser.vue';
import Core from '@/core';

import spriteIcon from '@/assets/sprite_icon.svg';
import physicsIcon from '@/assets/physics.svg';
import logicIcon from '@/assets/logic.svg';
import goTo from '@/assets/go_to.svg';

const { t } = useI18n();
const gameDataStore = useGameDataStore();

const props = defineProps<{
    selectedAsset: Core.Game_Object;
}>();

const emit = defineEmits(['asset-changed']);

const frameStartRef = ref<HTMLInputElement>();

const genericNoOption = {name: t('generic.no_option'), id: -1, value: null}
const exitBehaviors = [
    {name: t('object_editor.to_destination'), id: Core.Game_Object.EXIT_TYPES.TO_DESTINATION, value: Core.Game_Object.EXIT_TYPES.TO_DESTINATION},
    {name: t('object_editor.keep_position'), id: Core.Game_Object.EXIT_TYPES.KEEP_POSITION, value: Core.Game_Object.EXIT_TYPES.KEEP_POSITION},
    {name: t('object_editor.transition_only'), id: Core.Game_Object.EXIT_TYPES.TRANSITION_ONLY, value: Core.Game_Object.EXIT_TYPES.TRANSITION_ONLY},
];

const spriteChoices = computed(()=>{
    const sprites = gameDataStore.getAllSprites.map(s => ({
        name: s.name,
        id: s.id,
        value: s.id,
        thumbnail: s.frameIsEmpty(0) ? Core.Instance_Sprite.DEFAULT_SPRITE_ICON[0] : s.frames[0]
    }));

    return [genericNoOption, ...sprites];
});
const logicScripts = computed(()=>gameDataStore.getAllLogic);
const logicChoices = computed(()=>{
    const scripts = logicScripts.value.map(s => ({
        name: s.name,
        id: s.id,
        value: s.id,
        thumbnail: Core.Instance_Logic.DEFAULT_INSTANCE_ICON[0],
    }));

    return [genericNoOption, ...scripts, { name: t('generic.new'), id: Math.random(), value:'new' }];
});
const startFrame = computed({
    get(){
        return props.selectedAsset.startFrame;
    },
    set(newFrame: number){
        const selectedAsset = props.selectedAsset as Core.Game_Object;
        frameStartRef.value!.value = selectedAsset.startFrame.toString();
        selectedAsset.startFrame = newFrame;
        emit('asset-changed', selectedAsset.id);
    }
});

function setObjectSprite(id: number) : void {
    if (id >= 0){
        const allSprites = gameDataStore.getAllSprites;
        const selectedSprite = allSprites.find(s => s.id == id);
        props.selectedAsset.sprite = selectedSprite!;
    }
    else{
        props.selectedAsset.sprite = null;
    }

    nextTick(()=>{
        ObjectMainEventBus.emit('new-sprite-selected');

        if (props.selectedAsset.sprite){
            //triggers the frame count validation
            props.selectedAsset.startFrame = props.selectedAsset.startFrame;
        }
    });

    emit('asset-changed', props.selectedAsset.id);
}

function validateFPS(): void {
    props.selectedAsset.fps = Math.floor(props.selectedAsset.fps);
    ObjectMainEventBus.emit('fps-changed');
}

function groupChanged({add, groupName, newName, remove}: {add: boolean, groupName: string, newName: string, remove: boolean}): void {
    if (add){
        props.selectedAsset.groups.push(groupName);
    }

    if (newName){
        const groupIdx = props.selectedAsset.groups.indexOf(groupName);
        props.selectedAsset.groups[groupIdx] = newName;
    }

    if (remove){
        const groupIdx = props.selectedAsset.groups.indexOf(groupName);
        props.selectedAsset.groups.splice(groupIdx, 1);
    }
}

function logicScriptChanged(id: number | string): void {
    let scriptId: number;

    if (id == 'new'){
        let newScript;

        gameDataStore.addAsset(Core.CATEGORY_ID.LOGIC);
        newScript = logicScripts.value[logicScripts.value.length - 1];
        scriptId = newScript.id;
    }
    else{
        const numid = id as number;
        scriptId = numid;
    }

    props.selectedAsset.logicScriptId = scriptId;
}

function gotoLogicScript(){
    const selectedScriptId = props.selectedAsset.logicScriptId;

    if (selectedScriptId == null) return;

    const selectedScript = gameDataStore.getAllLogic.find(s => s.id == selectedScriptId)!;
    AssetBrowserEventBus.emit('select-asset', selectedScript);
}
</script>

<template>
    <div class="objMain">
        <div class="top-row">
            <CategoryWrapper class="cat-drawing" :iconPath="spriteIcon" :heading="t('object_editor.heading_sprite')">
                <div class="options">
                    <div class="control">
                        <SearchDropdown
                            :items="spriteChoices"
                            :value="props.selectedAsset.sprite ? props.selectedAsset.sprite.id : null"
                            :thumbnail="true"
                            :search="true"
                            @change="setObjectSprite"
                            v-tooltip="$t('object_editor.tt_sprite')"></SearchDropdown>
                    </div>
                    <div v-if="props.selectedAsset.sprite" class="control">
                        <label for="frameStart">{{$t('object_editor.start_frame')}}:</label>
                        <input type="number" ref="frameStartRef" id="frameStart"  v-model="startFrame" v-tooltip="$t('object_editor.tt_start_frame')"/>
                    </div>
                    <div v-if="props.selectedAsset.sprite" class="control">
                        <label for="fps">{{$t('object_editor.fps')}}:</label>
                        <input type="number" id="fps" v-model="props.selectedAsset.fps" @change="validateFPS" v-tooltip="$t('object_editor.tt_fps')"/>
                    </div>
                    <div v-if="props.selectedAsset.sprite" class="control">
                        <label for="loop">{{$t('object_editor.loop')}}:</label>
                        <input type="checkbox" id="loop" v-model="props.selectedAsset.animLoop" v-tooltip="$t('object_editor.tt_loop')"/>
                    </div>
                    <div v-if="props.selectedAsset.sprite" class="control">
                        <label for="isPlaying">{{$t('object_editor.is_playing')}}:</label>
                        <input type="checkbox" id="isPlaying" v-model="props.selectedAsset.animPlaying" v-tooltip="$t('object_editor.tt_is_playing')"/>
                    </div>
                    <div v-if="props.selectedAsset.sprite" class="control">
                        <label for="depth">{{$t('object_editor.depth')}}:</label>
                        <input type="number" id="depth" v-model.lazy="props.selectedAsset.zDepth" v-tooltip="$t('object_editor.tt_depth')"/>
                    </div>
                </div>
                <div class="v-divider"></div>
                <div class="options">
                    <div class="control">
                        <AnimationPlayer
                            :sprite="props.selectedAsset.sprite!"
                            :fps="props.selectedAsset.fps"
                            :startFrame="startFrame"
                            :loop="props.selectedAsset.animLoop"
                            :parent-event-bus="ObjectMainEventBus"/>
                    </div>
                </div>
            </CategoryWrapper>
            <CategoryWrapper class="cat-physics" :iconPath="physicsIcon" :heading="t('object_editor.heading_physics')">
                <div class="options">
                    <div class="control">
                        <label for="isSolid">{{$t('object_editor.is_solid')}}:</label>
                        <input type="checkbox" id="isSolid" v-model="props.selectedAsset.isSolid" v-tooltip="$t('object_editor.tt_solid')"/>
                    </div>
                    <div class="control">
                        <label for="useGravity">{{$t('object_editor.apply_gravity')}}:</label>
                        <input type="checkbox" id="useGravity" v-model="props.selectedAsset.applyGravity" v-tooltip="$t('object_editor.tt_gravity')"/>
                    </div>
                </div>
            </CategoryWrapper>
        </div>
        <CategoryWrapper class="cat-logic" :iconPath="logicIcon" :heading="t('object_editor.heading_logic')">
            <div class="options">
                <div class="control">
                    <label for="trigger_exits">{{$t('object_editor.trigger_exits')}}:</label>
                    <input type="checkbox" id="trigger_exits" v-model="props.selectedAsset.triggerExits" v-tooltip="$t('object_editor.tt_trigger_exits')" />
                </div>
                <div v-if="props.selectedAsset.triggerExits" class="control">
                    <label for="exit_behavior">{{$t('object_editor.exit_behavior')}}:</label>
                    <SearchDropdown id="exit_behavior" :items="exitBehaviors" :value="props.selectedAsset.exitBehavior" @change="props.selectedAsset.exitBehavior = $event"></SearchDropdown>
                </div>
                <div v-if="props.selectedAsset.triggerExits" class="control">
                    <label for="keep_camera_settings">{{$t('object_editor.keep_camera_settings')}}:</label>
                    <input type="checkbox" id="keep_camera_settings" v-model="props.selectedAsset.keepCameraSettings" v-tooltip="$t('object_editor.tt_keep_camera_settings')" />
                </div>
                <div v-if="props.selectedAsset.triggerExits" class="spacer"></div>
            </div>
            <div class="v-divider"></div>
            <div class="options">
                <div class="control">
                    <label for="logic_script_select">{{$t('object_editor.logic_script')}}:</label>
                    <SearchDropdown id="logic_script_select" :items="logicChoices" :value="props.selectedAsset.logicScriptId ?? null" @change="logicScriptChanged"></SearchDropdown>
                    <button style="width: 25px; height: 25px;" @click="gotoLogicScript" v-tooltip="$t('object_editor.tt_goto_logic')">
                        <Svg :src="goTo" style="width: 100%; height: 100%;"></Svg>
                    </button>
                </div>
            </div>
            <div class="v-divider"></div>
            <div class="options">
                <div class="control">
                    <GroupList
                        style="min-width: 200px"
                        :editList="props.selectedAsset.groups"
                        @group-changed="groupChanged"/>
                </div>
            </div>
        </CategoryWrapper>
    </div>
</template>

<style scoped>
@import '../common/formStyles.css';

.objMain{
    display: flex;
    flex-direction: column;
    justify-content: stretch;
    align-items: center;
    gap: 10px;
    box-sizing: border-box;
    background: white;
    padding: 20px;
    width: 100%;
    overflow-x: hidden;
    overflow-y: auto;
}

.options{
    display: flex;
    flex-direction: column;
    align-items: flex-end;
}

.v-divider{
    display: block;
    border-right: 1px solid rgba(0.0, 0.0, 0.0, 0.2);
    height: 100%;
    width: 1px;
}

.control{
    display: flex;
    flex-direction: row;
    align-items: center;
    margin: 3px;
    margin-left: none;
    margin-right: none;
}

.control > *:last-child{
    margin-left: 5px;
}

.spacer{
    display: block;
    height: 10px;
}

.top-row {
    display: flex;
    flex-direction: row;
    justify-content: stretch;
    gap: 10px;
    width: 100%;
    height: 270px;
    max-width: 1200px;
}

.cat-drawing{
    flex-grow: 1;
}

.cat-physics{
    width: 230px;
}

.cat-logic {
    width: 100%;
    max-width: 1200px;
}
</style>