<script lang="ts">
export const ObjectMainEventBus = new Core.Event_Bus();
</script>

<script setup lang="ts">
import AnimationPlayer from '@/components/common/AnimationPlayer.vue';
import GroupList from '@/components/common/GroupList.vue';
import CategoryWrapper from './CategoryWrapper.vue';

import { ref, computed, nextTick, onMounted } from 'vue';
import { useGameDataStore } from '@/stores/GameData';
import Core from '@/core';
import spriteIcon from '@/assets/sprite_icon.svg';
import physicsIcon from '@/assets/physics.svg';
import logicIcon from '@/assets/logic.svg';

const gameDataStore = useGameDataStore();

const props = defineProps<{
    selectedAsset: Core.Game_Object;
}>();

const emit = defineEmits(['asset-changed']);

const frameStartRef = ref<HTMLInputElement>();
const spriteSelectorRef = ref<HTMLSelectElement>();

const spriteChoices = computed(()=>gameDataStore.getAllSprites);
const logicScripts = computed(()=>gameDataStore.getAllLogic);
const selectedLogic = computed(()=>props.selectedAsset.logicScriptId);
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

function setObjectSprite() : void {
    const selectedSpriteId = parseInt(spriteSelectorRef.value!.value);

    if (selectedSpriteId >= 0){
        const allSprites = gameDataStore.getAllSprites;
        const selectedSprite = allSprites.find(s => s.id == selectedSpriteId);
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

function logicScriptChanged(event: Event): void {
    const target = event.target as HTMLInputElement;
    const value = target.value;
    let scriptId;

    if (value == 'new'){
        let newScript;

        gameDataStore.addAsset(Core.CATEGORY_ID.LOGIC);
        newScript = logicScripts.value[logicScripts.value.length - 1];
        scriptId = newScript.id;
    }
    else{
        scriptId = parseInt(value);
    }

    props.selectedAsset.logicScriptId = scriptId;

    nextTick(()=>{
        target.value = (props.selectedAsset.logicScriptId as any);
    });
}
</script>

<template>
    <div class="objMain">
        <CategoryWrapper :iconPath="spriteIcon" :heading="$t('object_editor.heading_sprite')">
            <div class="options">
                <div class="control">
                    <label for="drawing_select">{{$t('object_editor.sprite_selector')}}:</label>
                    <select ref="spriteSelectorRef" id="drawing_select" :value="props.selectedAsset.sprite ? props.selectedAsset.sprite.id : ''" @change="setObjectSprite" v-tooltip="$t('object_editor.tt_sprite')">
                        <option :value="''">{{$t('generic.no_option')}}</option>
                        <option
                            v-for="sprite in spriteChoices"
                            :key="sprite.id"
                            :value="sprite.id">
                            {{sprite.name}}
                        </option>
                    </select>
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
            </div>
            <AnimationPlayer
                :sprite="props.selectedAsset.sprite!"
                :fps="props.selectedAsset.fps"
                :startFrame="startFrame"
                :loop="props.selectedAsset.animLoop"
                :parent-event-bus="ObjectMainEventBus"/>
        </CategoryWrapper>
        <CategoryWrapper :iconPath="physicsIcon" :heading="$t('object_editor.heading_physics')">
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
        <CategoryWrapper :iconPath="logicIcon" :heading="$t('object_editor.heading_logic')">
            <div class="options">
                <div class="control">
                    <label for="trigger_exits">{{$t('object_editor.trigger_exits')}}:</label>
                    <input type="checkbox" id="trigger_exits" v-model="props.selectedAsset.triggerExits" v-tooltip="$t('object_editor.tt_trigger_exits')" />
                </div>
                <div v-if="props.selectedAsset.triggerExits" class="control">
                    <label for="exit_behavior">{{$t('object_editor.exit_behavior')}}:</label>
                    <select id="exit_behavior" v-model="props.selectedAsset.exitBehavior" v-tooltip="$t('object_editor.tt_exit_behavior')">
                        <option :value="Core.Game_Object.EXIT_TYPES.TO_DESTINATION">{{$t('object_editor.to_destination')}}</option>
                        <option :value="Core.Game_Object.EXIT_TYPES.THROUGH_DESTINATION">{{$t('object_editor.through_destination')}}</option>
                        <option :value="Core.Game_Object.EXIT_TYPES.KEEP_POSITION">{{$t('object_editor.keep_position')}}</option>
                        <option :value="Core.Game_Object.EXIT_TYPES.TRANSITION_ONLY">{{$t('object_editor.transition_only')}}</option>
                    </select>
                </div>
                <div v-if="props.selectedAsset.triggerExits" class="control">
                    <label for="keep_camera_settings">{{$t('object_editor.keep_camera_settings')}}:</label>
                    <input type="checkbox" id="keep_camera_settings" v-model="props.selectedAsset.keepCameraSettings" v-tooltip="$t('object_editor.tt_keep_camera_settings')" />
                </div>
                <div v-if="props.selectedAsset.triggerExits" class="spacer"></div>
                <div v-if="!props.selectedAsset.customLogic" class="control">
                    <label for="logic_preset_select">{{$t('object_editor.logic_preset')}}:</label>
                    <select id="logic_preset_select" v-tooltip="$t('object_editor.tt_logic_preset')">
                        <option :value="null">{{$t('generic.no_option')}}</option>
                    </select>
                </div>
                <div class="control">
                    <label for="logic_script_select">{{$t('object_editor.logic_script')}}:</label>
                    <select id="logic_script_select" :value="selectedLogic ?? ''" @change="logicScriptChanged" v-tooltip="$t('object_editor.tt_logic_script')">
                        <option :value="''">{{$t('generic.no_option')}}</option>
                        <option
                            v-for="script in logicScripts"
                            :key="script.id"
                            :value="script.id">
                            {{script.name}}
                        </option>
                        <option :value="'new'">{{$t('generic.new')}}</option>
                    </select>
                </div>
                <GroupList
                    :editList="props.selectedAsset.groups"
                    @group-changed="groupChanged"/>
            </div>
        </CategoryWrapper>
    </div>
</template>

<style scoped>
@import '../common/formStyles.css';

.objMain{
    display: flex;
    flex-direction: column;
    align-items: stretch;
    box-sizing: border-box;
    background: white;
    padding: 20px;
    width: 100%;
    overflow-x: none;
    overflow-y: auto;
}

.options{
    display: flex;
    flex-direction: column;
    align-items: flex-end;
    margin-right: 5px;
}

.control{
    display: flex;
    flex-direction: row;
    align-items: center;
    margin: 3px;
}

.control > *:last-child{
    margin-left: 5px;
}

.spacer{
    display: block;
    height: 10px;
}
</style>