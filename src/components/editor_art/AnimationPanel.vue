<template>
    <div class="animPanel" :class="{animPanelClosed : !isOpen}">
        <div class="resizeBtnWrapper">
            <button ref="collapseBtn" class="resizeBtn" @click="toggleOpen">
                <img v-show="isOpen" class="arrow" src="@/assets/arrow_01.svg" style="transform: rotate(90deg)"/>
                <img v-show="!isOpen" class="arrow" src="@/assets/animation.svg"/>
            </button>
        </div>
        <div v-show="isOpen" ref="contents" class="panelContents">
            <div class="animPlayerWrapper">
                <AnimationPlayer ref="animPlayer" :sprite="sprite" fps="12" startFrame="0" :loop="true"/>
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
                        <img class="icon" src="@/assets/plus.svg"/>
                    </button>
                </div>
            </div>
        </div>
    </div>
</template>

<script>
import AnimFrame from './AnimFrame';
import AnimationPlayer from '@/components/common/AnimationPlayer';
import HotkeyMap from '@/components/common/HotkeyMap';

export default {
    name: 'AnimationPanel',
    components: {
        AnimFrame,
        AnimationPlayer
    },
    props: ['sprite', 'frameIDs'],
    data(){
        return {
            isOpen: this.isOpen = this.$store.getters['ArtEditor/isAnimPanelOpen'],
            hotkeyMap: new HotkeyMap(),
            hotkeyDown: null,
            hotkeyUp: null
        }
    },
    watch: {
        inputActive(newState){
            this.hotkeyMap.enabled = !newState;
        },
    },
    computed: {
        selectedFrameIdx: {
            get: function(){
                return this.$store.getters['ArtEditor/getSelectedFrame'];
            },
            set: function(newIdx){
                this.$store.dispatch('ArtEditor/selectFrame', newIdx);
            },
        },
        inputActive(){
            return this.$store.getters['getInputActive'];
        },
    },
    mounted(){
        this.hotkeyDown = this.hotkeyMap.keyDown.bind(this.hotkeyMap);
        this.hotkeyUp = this.hotkeyMap.keyUp.bind(this.hotkeyMap);

        window.addEventListener('keydown', this.hotkeyDown);
        window.addEventListener('keyup', this.hotkeyUp);

        this.hotkeyMap.enabled = true;
        this.bindHotkeys();
    },
    beforeDestroy(){
        window.removeEventListener('keydown', this.hotkeyDown);
        window.removeEventListener('keyup', this.hotkeyUp);
        
        this.$store.dispatch('ArtEditor/setAnimPanelState', this.isOpen);
    },
    methods: {
        bindHotkeys(){
            let prevFrame = () => {
                if (this.selectedFrameIdx > 0){
                    let newIdx = this.selectedFrameIdx - 1;
                    this.$store.dispatch('ArtEditor/selectFrame', newIdx);
                    this.selectedFrameChanged(newIdx);
                }
            }
            let nextFrame = () => {
                if (this.selectedFrameIdx < this.sprite.frames.length - 1){
                    let newIdx = this.selectedFrameIdx + 1;
                    this.$store.dispatch('ArtEditor/selectFrame', newIdx);
                    this.selectedFrameChanged(newIdx);
                }
            }

            this.hotkeyMap.bindKey(['n'], this.toggleOpen);
            this.hotkeyMap.bindKey(['arrowleft'], prevFrame);
            this.hotkeyMap.bindKey(['arrowright'], nextFrame);
            this.hotkeyMap.bindKey(['arrowdown'], this.$refs.animPlayer.playAnimation);
            this.hotkeyMap.bindKey(['escape'], this.$refs.animPlayer.stopAnimation);
        },
        toggleOpen(){
            this.isOpen = !this.isOpen;

            this.$nextTick(()=>{
                this.$refs.animPlayer.frameDataChanged();
                this.$emit('resized');
            })
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
        addFrame(){
            let newFrameIdx = this.sprite.addFrame();
            this.$store.dispatch('ArtEditor/selectFrame', newFrameIdx);
            this.$emit('frameAdded');
        },
        deleteFrame(idx){
            this.sprite.deleteFrame(idx);
            this.selectedFrameIdx = Math.min(this.selectedFrameIdx, this.sprite.frames.length - 1);
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
        }
    }
}
</script>

<style scoped>
.animPanel{
    position: relative;
    display: flex;
    flex-direction: row;
    height: 95%;
    top: 50%;
    transform: translateY(-50%);
    background: var(--tool-panel-bg);
    border: 2px solid var(--border);
    border-right: none;
    border-radius: var(--corner-radius) 0px 0px var(--corner-radius);
}

.animPanelClosed{
    border: none;
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
    background: var(--button-norm);
    border: 2px solid var(--border);
    border-radius: var(--corner-radius);
}

.addFrame:hover{
    background: var(--button-hover);
}

.addFrame > .icon{
    width: 25px;
    height: 25px;
    fill: var(--button-icon);
    stroke: var(--button-icon);
}

.resizeBtnWrapper{
    position: absolute;
    left: 0;
    top: 50%;
    transform: translateY(-50%);
}

.resizeBtn{
    position: relative;
    left: -100%;
    width: 30px;
    height: 70px;
    padding: 0;
    align-self: center;
    padding: 2px;
    background: var(--tool-panel-bg);
    border: 2px solid var(--border);
    border-right: none;
    border-radius: var(--corner-radius) 0px 0px var(--corner-radius);
}

.resizeBtn > .arrow{
    width: 100%;
    height: 100%;
    fill: var(--button-icon);
    stroke: var(--button-icon);
}
</style>