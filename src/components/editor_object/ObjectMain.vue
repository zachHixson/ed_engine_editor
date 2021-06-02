<template>
    <div class="objMain">
        <CategoryWrapper :title="$t('object_editor.heading_sprite')" iconPath="assets/sprite_icon">
            <div class="options">
                <div class="control">
                    <label for="drawing_select">{{$t('object_editor.sprite_selector')}}</label>
                    <select ref="spriteSelector" id="drawing_select" @change="setObjectSprite" :title="$t('object_editor.tt_sprite')">
                        <option
                            v-for="sprite in spriteChoices"
                            :key="sprite.id"
                            :value="sprite.id">
                            {{sprite.name}}
                        </option>
                    </select>
                </div>
                <div v-if="object.sprite" class="control">
                    <label for="frameStart">{{$t('object_editor.start_frame')}}</label>
                    <input type="number" ref="frameStart" id="frameStart"  v-model="startFrame" :title="$t('object_editor.tt_start_frame')"/>
                </div>
                <div v-if="object.sprite" class="control">
                    <label for="fps">{{$t('object_editor.fps')}}</label>
                    <input type="number" id="fps" value="6" v-model="object.fps" @change="validateFPS" :title="$t('object_editor.tt_fps')"/>
                </div>
                <div v-if="object.sprite" class="control">
                    <label for="loop">{{$t('object_editor.loop')}}</label>
                    <input type="checkbox" id="loop" checked="true" v-model="object.animLoop" :title="$t('object_editor.tt_loop')"/>
                </div>
            </div>
            <AnimationPlayer ref="animPlayer" :sprite="object.sprite" :fps="object.fps" :startFrame="startFrame"/>
        </CategoryWrapper>
        <CategoryWrapper :title="$t('object_editor.heading_physics')" iconPath="assets/physics">
            <div class="options">
                <div class="control">
                    <label for="isSolid">{{$t('object_editor.is_solid')}}</label>
                    <input type="checkbox" id="isSolid" checked="true" v-model="object.isSolid" :title="$t('object_editor.tt_solid')"/>
                </div>
                <div class="control">
                    <label for="useGravity">{{$t('object_editor.apply_gravity')}}</label>
                    <input type="checkbox" id="useGravity" checked="true" v-model="object.applyGravity" :title="$t('object_editor.tt_gravity')"/>
                </div>
            </div>
        </CategoryWrapper>
        <CategoryWrapper :title="$t('object_editor.heading_logic')" iconPath="assets/logic">
            <div class="options">
                <div class="control">
                    <label for="trigger_exits">{{$t('object_editor.trigger_exits')}}:</label>
                    <input type="checkbox" id="trigger_exits" checked="false" v-model="object.triggerExits" :title="$t('object_editor.tt_trigger_exits')" />
                </div>
                <div class="control">
                    <label for="logic_type_select">{{$t('object_editor.logic_type')}}</label>
                    <select id="logic_type_select" v-model="object.customLogic" :title="$t('object_editor.tt_logic_type')">
                        <option :value="false">{{$t('object_editor.preset')}}</option>
                        <option :value="true">{{$t('object_editor.custom')}}</option>
                    </select>
                </div>
                <div v-if="!object.customLogic" class="control">
                    <label for="logic_preset_select">{{$t('object_editor.logic_preset')}}</label>
                    <select id="logic_preset_select" :title="$t('object_editor.tt_logic_preset')"></select>
                </div>
                <GroupList
                    :editList="object.groups"
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
    components: {
        AnimationPlayer,
        GroupList,
        CategoryWrapper
    },
    data() {
        return {
            object: this.getSelectedObject()
        }
    },
    computed: {
        spriteChoices() {
            let sprites = this.$store.getters['GameData/getAllSprites'];
            let spriteChoices = [{id:-1, name:this.$t('generic.no_option')}];

            for (let i = 0; i < sprites.length; i++){
                spriteChoices.push({
                    id: sprites[i].ID,
                    name: sprites[i].name
                });
            }

            return spriteChoices;
        },
        startFrame: {
            get(){
                return this.object.startFrame;
            },
            set(newFrame){
                this.$refs.frameStart.value = this.object.startFrame;
                this.object.startFrame = newFrame;
                this.$emit('asset-changed', this.object.ID);
            }
        }
    },
    mounted() {
        this.updateAssetSelection();
    },
    methods: {
        getSelectedObject() {
            return this.$store.getters['AssetBrowser/getSelectedAsset'];
        },
        setObjectSprite() {
            let selectedSpriteId = this.$refs.spriteSelector.value;

            if (selectedSpriteId >= 0){
                let allSprites = this.$store.getters['GameData/getAllSprites'];
                let selectedSprite = allSprites.find(s => s.ID == selectedSpriteId);
                this.object.sprite = selectedSprite;
            }
            else{
                this.object.sprite = null;
            }

            this.$nextTick(()=>{
                this.$refs.animPlayer.newSpriteSelection();
            });

            this.$emit('asset-changed', this.object.ID);
        },
        validateFPS(){
            this.object.fps = Math.floor(this.object.fps);
            this.$refs.animPlayer.fpsChanged();
        },
        updateAssetSelection() {
            this.object = this.getSelectedObject();
            
            if (this.object.sprite){
                this.$refs.spriteSelector.value = this.object.sprite.ID;
            }
            else{
                this.$refs.spriteSelector.value = -1;
            }

            this.$refs.animPlayer.newSpriteSelection();
        },
        groupChanged({add, groupName, newName, remove}){
            if (add){
                this.object.groups.push(groupName);
            }

            if (newName){
                let groupIdx = this.object.groups.indexOf(groupName);
                this.object.groups[groupIdx] = newName;
            }

            if (remove){
                let groupIdx = this.object.groups.indexOf(groupName);
                this.object.groups.splice(groupIdx, 1);
            }
        }
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
</style>