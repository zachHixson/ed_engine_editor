<template>
    <div class="objMain">
        <CategoryWrapper :title="$t('object_editor.heading_sprite')" iconPath="assets/sprite_icon">
            <div class="options">
                <div class="control">
                    <label for="drawing_select">{{$t('object_editor.sprite_selector')}}:</label>
                    <select ref="spriteSelector" id="drawing_select" :value="selectedAsset.sprite ? selectedAsset.sprite.id : null" @change="setObjectSprite" :title="$t('object_editor.tt_sprite')">
                        <option :value="null">{{$t('generic.no_option')}}</option>
                        <option
                            v-for="sprite in spriteChoices"
                            :key="sprite.id"
                            :value="sprite.id">
                            {{sprite.name}}
                        </option>
                    </select>
                </div>
                <div v-if="selectedAsset.sprite" class="control">
                    <label for="frameStart">{{$t('object_editor.start_frame')}}:</label>
                    <input type="number" ref="frameStart" id="frameStart"  v-model="startFrame" :title="$t('object_editor.tt_start_frame')"/>
                </div>
                <div v-if="selectedAsset.sprite" class="control">
                    <label for="fps">{{$t('object_editor.fps')}}:</label>
                    <input type="number" id="fps" value="6" v-model="selectedAsset.fps" @change="validateFPS" :title="$t('object_editor.tt_fps')"/>
                </div>
                <div v-if="selectedAsset.sprite" class="control">
                    <label for="loop">{{$t('object_editor.loop')}}:</label>
                    <input type="checkbox" id="loop" checked="true" v-model="selectedAsset.animLoop" :title="$t('object_editor.tt_loop')"/>
                </div>
                <div v-if="selectedAsset.sprite" class="control">
                    <label for="isPlaying">{{$t('object_editor.is_playing')}}:</label>
                    <input type="checkbox" id="isPlaying" checked="false" v-model="selectedAsset.animPlaying" :title="$t('object_editor.tt_is_playing')"/>
                </div>
            </div>
            <AnimationPlayer ref="animPlayer" :sprite="selectedAsset.sprite" :fps="selectedAsset.fps" :startFrame="startFrame" :loop="selectedAsset.animLoop"/>
        </CategoryWrapper>
        <CategoryWrapper :title="$t('object_editor.heading_physics')" iconPath="assets/physics">
            <div class="options">
                <div class="control">
                    <label for="isSolid">{{$t('object_editor.is_solid')}}:</label>
                    <input type="checkbox" id="isSolid" checked="true" v-model="selectedAsset.isSolid" :title="$t('object_editor.tt_solid')"/>
                </div>
                <div class="control">
                    <label for="useGravity">{{$t('object_editor.apply_gravity')}}:</label>
                    <input type="checkbox" id="useGravity" checked="true" v-model="selectedAsset.applyGravity" :title="$t('object_editor.tt_gravity')"/>
                </div>
            </div>
        </CategoryWrapper>
        <CategoryWrapper :title="$t('object_editor.heading_logic')" iconPath="assets/logic">
            <div class="options">
                <div class="control">
                    <label for="trigger_exits">{{$t('object_editor.trigger_exits')}}:</label>
                    <input type="checkbox" id="trigger_exits" checked="false" v-model="selectedAsset.triggerExits" :title="$t('object_editor.tt_trigger_exits')" />
                </div>
                <div v-if="selectedAsset.triggerExits" class="control">
                    <label for="exit_behavior">{{$t('object_editor.exit_behavior')}}:</label>
                    <select id="exit_behavior" v-model="selectedAsset.exitBehavior" :title="$t('object_editor.tt_exit_behavior')">
                        <option :value="Shared.Game_Object.EXIT_TYPES.TO_DESTINATION">{{$t('object_editor.to_destination')}}</option>
                        <option :value="Shared.Game_Object.EXIT_TYPES.THROUGH_DESTINATION">{{$t('object_editor.through_destination')}}</option>
                        <option :value="Shared.Game_Object.EXIT_TYPES.KEEP_POSITION">{{$t('object_editor.keep_position')}}</option>
                        <option :value="Shared.Game_Object.EXIT_TYPES.TRANSITION_ONLY">{{$t('object_editor.transition_only')}}</option>
                    </select>
                </div>
                <div v-if="selectedAsset.triggerExits" class="control">
                    <label for="keep_camera_settings">{{$t('object_editor.keep_camera_settings')}}:</label>
                    <input type="checkbox" id="keep_camera_settings" checked="false" v-model="selectedAsset.keepCameraSettings" :title="$t('object_editor.tt_keep_camera_settings')" />
                </div>
                <div v-if="selectedAsset.triggerExits" class="spacer"></div>
                <div v-if="!selectedAsset.customLogic" class="control">
                    <label for="logic_preset_select">{{$t('object_editor.logic_preset')}}:</label>
                    <select id="logic_preset_select" :title="$t('object_editor.tt_logic_preset')">
                        <option :value="null">{{$t('generic.no_option')}}</option>
                    </select>
                </div>
                <div class="control">
                    <label for="logic_script_select">{{$t('object_editor.logic_script')}}:</label>
                    <select id="logic_script_select" :value="selectedLogic" @change="logicScriptChanged" :title="$t('object_editor.tt_logic_script')">
                        <option :value="null">{{$t('generic.no_option')}}</option>
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
                    :editList="selectedAsset.groups"
                    :tooltip_text="$t('object_editor.tt_groups')"
                    @group-changed="groupChanged"/>
            </div>
        </CategoryWrapper>
    </div>
</template>

<script>
import AnimationPlayer from '@/components/common/AnimationPlayer';
import GroupList from '@/components/common/GroupList';
import CategoryWrapper from './CategoryWrapper';

export default {
    name: 'ObjectEditor',
    props: ['selectedAsset'],
    components: {
        AnimationPlayer,
        GroupList,
        CategoryWrapper
    },
    computed: {
        Shared(){
            return Shared;
        },
        spriteChoices() {
            return this.$store.getters['GameData/getAllSprites'];
        },
        logicScripts() {
            return this.$store.getters['GameData/getAllLogic'];
        },
        selectedLogic(){
            return this.selectedAsset.logicScript;
        },
        startFrame: {
            get(){
                return this.selectedAsset.startFrame;
            },
            set(newFrame){
                this.$refs.frameStart.value = this.selectedAsset.startFrame;
                this.selectedAsset.startFrame = newFrame;
                this.$emit('asset-changed', this.selectedAsset.id);
            }
        },
    },
    watch: {
        selectedAsset(){
            if (this.selectedAsset.sprite){
                this.$refs.spriteSelector.value = this.selectedAsset.sprite.id;
            }
            else{
                this.$refs.spriteSelector.value = -1;
            }
        }
    },
    methods: {
        setObjectSprite() {
            const selectedSpriteId = this.$refs.spriteSelector.value;

            if (selectedSpriteId >= 0){
                const allSprites = this.$store.getters['GameData/getAllSprites'];
                const selectedSprite = allSprites.find(s => s.id == selectedSpriteId);
                this.selectedAsset.sprite = selectedSprite;
            }
            else{
                this.selectedAsset.sprite = null;
            }

            this.$nextTick(()=>{
                this.$refs.animPlayer.newSpriteSelection();

                if (this.selectedAsset.sprite){
                    //triggers the frame count validation
                    this.selectedAsset.startFrame = this.selectedAsset.startFrame;
                }
            });

            this.$emit('asset-changed', this.selectedAsset.id);
        },
        validateFPS(){
            this.selectedAsset.fps = Math.floor(this.selectedAsset.fps);
            this.$refs.animPlayer.fpsChanged();
        },
        groupChanged({add, groupName, newName, remove}){
            if (add){
                this.selectedAsset.groups.push(groupName);
            }

            if (newName){
                let groupIdx = this.selectedAsset.groups.indexOf(groupName);
                this.selectedAsset.groups[groupIdx] = newName;
            }

            if (remove){
                let groupIdx = this.selectedAsset.groups.indexOf(groupName);
                this.selectedAsset.groups.splice(groupIdx, 1);
            }
        },
        logicScriptChanged(event){
            const value = event.target.value;
            let scriptId;

            if (value == 'new'){
                let newScript;

                this.$store.dispatch('GameData/addAsset', Shared.CATEGORY_ID.LOGIC);
                newScript = this.logicScripts[this.logicScripts.length - 1];
                scriptId = newScript.id;
            }
            else{
                scriptId = value;
            }

            this.selectedAsset.logicScript = scriptId;

            this.$nextTick(()=>{
                event.target.value = this.selectedAsset.logicScript;
            })
        },
    }
}
</script>

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