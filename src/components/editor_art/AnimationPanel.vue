<template>
    <div class="animPanel">
        <button v-show="isOpen" ref="collapseBtn" class="resizeBtn" @click="toggleSize()">&gt;</button>
        <button v-show="!isOpen" ref="expandBtn" class="resizeBtn" @click="toggleSize()">&lt;</button>
        <div v-show="isOpen" ref="contents" class="panelContents">
            <div class="animPlayerWrapper">
                <AnimationPlayer ref="animPlayer" :sprite="sprite" fps="12" startFrame="0"/>
            </div>
            <div class="scrollWrapper">
                <div v-if="isOpen" class="frames">
                    <AnimFrame 
                        v-for="(id, idx) in frameIDs"
                        :key="id"
                        :index="idx"
                        :sprite="sprite"
                        ref="animFrame"
                        class="animFrame"
                        @selectedFrameChanged="selectedFrameChanged"
                        @frameDeleted="deleteFrame"
                        @frameCopied="frameCopied"
                        @frameMoved="frameMoved"/>
                    <button class="addFrame" :title="$t('art_editor.add_frame')" @click="addFrame()">
                        +
                    </button>
                </div>
            </div>
        </div>
    </div>
</template>

<script>
import {store} from 'vuex';
import AnimFrame from './AnimFrame';
import AnimationPlayer from '@/components/common/AnimationPlayer';

export default {
    name: 'AnimationPanel',
    components: {
        AnimFrame,
        AnimationPlayer
    },
    props: ['frameIDs'],
    data(){
        return {
            isOpen: false,
            sprite: this.$store.getters['AssetBrowser/getSelectedAsset']
        }
    },
    beforeMount(){
        this.isOpen = this.$store.getters['ArtEditor/isAnimPanelOpen'];
    },
    beforeDestroy(){
        this.$store.dispatch('ArtEditor/setAnimPanelState', this.isOpen);
    },
    methods: {
        toggleSize(){
            this.isOpen = !this.isOpen;
            this.$nextTick(()=>{
                if (this.isOpen){
                    this.$refs.animPlayer.frameDataChanged();
                }
                this.$emit('resized');
            });
        },
        updateFramePreviews(range = [0, -1]){
            if (range[1] == -1){
                range[1] = this.sprite.frames.length - 1;
            }

            if (this.isOpen){
                this.$refs.animPlayer.frameDataChanged();

                if (range.length == 1){
                    range = [range[0], range[0] + 1];
                }

                for (let i = range[0]; i <= range[1]; i++){
                    this.$refs.animFrame[i].updateCanvas();
                }
            }
        },
        getSelectedFrame(){
            return this.$store.getters['ArtEditor/getSelectedFrame'];
        },
        addFrame(){
            let newFrameIdx = this.sprite.addFrame();
            this.$store.dispatch('ArtEditor/selectFrame', newFrameIdx);
            this.$emit('frameAdded');
        },
        deleteFrame(idx){
            this.$emit('frameDeleted');
        },
        frameMoved({idx, dir}){
            if (dir < 0){
                this.updateFramePreviews([
                    Math.max(idx - 1, 0),
                    Math.min(idx + 1, this.sprite.frames.length - 1)
                ]);
            }
            else{
                this.updateFramePreviews([
                    idx,
                    Math.min(idx + 2, this.sprite.frames.length - 1)
                ]);
            }
            
            this.$emit('frameMoved');
        },
        frameCopied(idx){
            this.$emit('frameCopied');
        },
        selectedFrameChanged(idx){
            this.$emit('selectedFrameChanged');
        },
        newSpriteSelection(){
            this.$refs.animPlayer.newSpriteSelection();
        }
    }
}
</script>

<style scoped>
    .animPanel{
        display: flex;
        flex-direction: row;
        height: 100%;
        background: #FFAAAA;
    }

    .panelContents{
        display: flex;
        flex-direction: column;
        width: 100%;
    }

    .animPlayerWrapper{
        display: flex;
        justify-content: center;
        border-bottom: 1px solid black;
        padding: 10px;
    }

    .scrollWrapper{
        overflow: auto;
    }

    .frames{
        display: flex;
        flex-direction: column;
        align-items: flex-end;
        width: auto;
        padding: 5px;
    }

    .animFrame{
        margin-top: 5px;
    }

    .addFrame{
        width: 50px;
        height: 50px;
        margin-top: 5px;
    }

    .resizeBtn{
        height: 50px;
        padding: 0;
        align-self: center;
        padding: 2px;
        background: none;
        border: 1px solid black;
    }
</style>