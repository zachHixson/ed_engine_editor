<template>
    <div class="animPanel">
        <button ref="collapseBtn" class="resizeBtn" @click="toggleSize()">&gt;</button>
        <button ref="expandBtn" class="resizeBtn" @click="toggleSize()">&lt;</button>
        <div ref="contents" class="panelContents">
            <div style="background: #AA0000; width: 100%; height: 100px">
                AnimPlayer palceholder
            </div>
            <div class="scrollWrapper">
                <div class="frames">
                    <AnimFrame 
                        v-for="(frame, idx) in sprite.frames"
                        :key="idx"
                        :index="idx"
                        :sprite="sprite"
                        ref="animFrame"
                        class="animFrame"
                        @frameChanged="frameChanged()"
                        @frameDeleted="updateFramePreviews(true)"
                        @frameCopied="updateFramePreviews(true)"
                        @frameMoved="updateFramePreviews(true)"/>
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

export default {
    name: 'AnimationPanel',
    components: {
        AnimFrame
    },
    data(){
        return {
            collapsed: false
        }
    },
    mounted(){
        this.resize();
    },
    computed: {
        sprite(){
            return this.$store.getters['AssetBrowser/getSelectedAsset'];
        }
    },
    methods: {
        toggleSize(){
            this.collapsed = !this.collapsed;
            this.resize();
        },
        resize(){
            let collapseBtn = this.$refs.collapseBtn;
            let expandBtn = this.$refs.expandBtn;
            let contents = this.$refs.contents;

            if (this.collapsed){
                collapseBtn.style.display = 'none';
                expandBtn.style.display = 'block';
                contents.style.display = 'none';
            }
            else{
                collapseBtn.style.display = 'block';
                expandBtn.style.display = 'none';
                contents.style.display = 'flex';
            }

            this.$emit('resized');
        },
        updateFramePreviews(forceUpdate = false){
            for (let i = 0; i < this.$refs.animFrame.length; i++){
                this.$refs.animFrame[i].index = i;
                this.$refs.animFrame[i].updateCanvas(forceUpdate);
            }
        },
        addFrame(){
            let newFrameIdx = this.sprite.addFrame();
            this.$store.dispatch('ArtEditor/selectFrame', newFrameIdx);
            this.frameChanged();
        },
        frameChanged(){
            this.$emit('frameChanged');
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
        width: 200px;
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