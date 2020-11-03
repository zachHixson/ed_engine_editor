<template>
    <div class="objMain">
        <CategoryWrapper :title="$t('object_editor.heading_sprite')" iconPath="assets/sprite_icon">
            <div class="options">
                <div class="control">
                    <label for="drawing_select">{{$t('object_editor.sprite_selector')}}</label>
                    <select ref="spriteSelector" id="drawing_select" @change="setObjectSprite">
                        <option
                            v-for="sprite in spriteChoices"
                            :key="sprite.id"
                            :value="sprite.id">
                            {{sprite.name}}
                        </option>
                    </select>
                </div>
                <div class="control">
                    <label for="frameStart">{{$t('object_editor.start_frame')}}</label>
                    <input type="number" ref="frameStart" id="frameStart"  v-model="startFrame"/>
                </div>
                <div class="control">
                    <label for="fps">{{$t('object_editor.fps')}}</label>
                    <input type="number" id="fps" value="6" v-model="object.fps" @change="validateFPS"/>
                </div>
                <div class="control">
                    <label for="loop">{{$t('object_editor.loop')}}</label>
                    <input type="checkbox" id="loop" checked="true" v-model="object.animLoop"/>
                </div>
            </div>
            <AnimationPlayer ref="animPlayer" :sprite="object.sprite" :fps="object.fps" :startFrame="object.startFrame"/>
        </CategoryWrapper>
        <CategoryWrapper :title="$t('object_editor.heading_physics')" iconPath="assets/physics">
            <div class="options">
                <div class="control">
                    <label for="isSolid">{{$t('object_editor.is_solid')}}</label>
                    <input type="checkbox" id="isSolid" checked="true" v-model="object.isSolid"/>
                </div>
                <div class="control">
                    <label for="useGravity">{{$t('object_editor.apply_gravity')}}</label>
                    <input type="checkbox" id="useGravity" checked="true" v-model="object.applyGravity"/>
                </div>
                <div class="control">
                    <label for="roomGravity">{{$t('object_editor.room_gravity')}}</label>
                    <input type="checkbox" id="roomGravity" checked="true" v-model="object.useRoomGravity"/>
                </div>
                <div class="control">
                    <div>{{$t('object_editor.custom_grav_dir')}}</div>
                    <div class="gravPlaceholder"></div>
                </div>
            </div>
        </CategoryWrapper>
        <CategoryWrapper :title="$t('object_editor.heading_logic')" iconPath="assets/logic">
            <div class="options">
                <div class="control">
                    <label for="drawing_select">{{$t('object_editor.logic_type')}}</label>
                    <select id="drawing_select">
                        <option value="preset">{{$t('object_editor.preset')}}</option>
                        <option value="custom">{{$t('object_editor.custom')}}</option>
                    </select>
                </div>
                <div class="control">
                    <label for="drawing_select">{{$t('object_editor.logic_preset')}}</label>
                    <select id="drawing_select"></select>
                </div>
            </div>
        </CategoryWrapper>
    </div>
</template>

<script>
import AnimationPlayer from '@/components/common/AnimationPlayer';
import CategoryWrapper from './CategoryWrapper';

export default {
    name: 'ObjectEditor',
    components: {
        CategoryWrapper,
        AnimationPlayer
    },
    data() {
        return {
            object: this.getSelectedObject()
        }
    },
    computed: {
        spriteChoices() {
            let sprites = this.$store.getters['GameData/getAllSprites'];
            let spriteChoices = [{id:-1, name:this.$t('object_editor.none')}];

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
                this.$refs.animPlayer.drawFrame();
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

            this.vailidateStartFrame();
            this.$nextTick(()=>{
                this.$refs.animPlayer.newSpriteSelection();
            });
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
        }
    }
}
</script>

<style scoped>
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

input:not([type="checkbox"]), select{
    box-sizing: border-box;
    width: 150px;
}

.animPlaceholder{
    display: block;
    width: 200px;
    height: 200px;
    background: gray;
}

.gravPlaceholder{
    width: 100px;
    height: 100px;
    border-radius: 100%;
    background: white;
}
</style>