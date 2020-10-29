<template>
    <div class="artMain">
        <LeftPanel
            class="leftPanel"
            @resized="resize"
            @tool-selected="toolSelected" />
        <ArtCanvas
            class="artCanvas"
            ref="artCanvas"
            :undoLength="undoStore.undoLength"
            :redoLength="undoStore.redoLength"
            @spriteDataChanged="spriteDataChanged()"
            @nav-selected="navSelected()"
            @undo="undo()"
            @redo="redo()" />
        <AnimationPanel
            class="animPanel"
            ref="animPanel"
            :frameIDs="frameIDs"
            @resized="resize"
            @selectedFrameChanged="selectedFrameChanged()"
            @frameAdded="frameAdded()"
            @frameDeleted="commitFullState()"
            @frameMoved="commitFullState()"
            @frameCopied="commitFullState()" />
    </div>
</template>

<script>
import {store, mapActions, mapGetters} from 'vuex';
import Undo_Store from '@/common/Undo_Store';
import {CATEGORY_ID} from '@/common/Enums';
import LeftPanel from './LeftPanel';
import ArtCanvas from './ArtCanvas';
import AnimationPanel from './AnimationPanel';

const MAX_UNDO_STEPS = 32;

export default {
    name: 'ArtEditor',
    components: {
        LeftPanel,
        ArtCanvas,
        AnimationPanel
    },
    data(){
        return {
            undoStore: new Undo_Store(MAX_UNDO_STEPS),
            currentSprite: this.getSprite(),
            frameIDs: this.getSprite().frameIDs,
        }
    },
    mounted(){
        window.addEventListener('resize', this.resize);
        this.undoStore.setInitialState(this.packageUndoData());
    },
    beforeDestroy(){
        window.removeEventListener('resize', this.resize);
    },
    methods:{
        ...mapActions({
            selectTool: 'ArtEditor/selectTool',
            setNavTool: 'ArtEditor/setSelectedNavTool',
            selectFrame: 'ArtEditor/selectFrame'
        }),
        ...mapGetters({
            getSprite: 'AssetBrowser/getSelectedAsset',
            getSelectedFrame: 'ArtEditor/getSelectedFrame'
        }),
        resize() {
            this.$refs.artCanvas.resize();
        },
        spriteDataChanged(){
            this.$refs.animPanel.updateFramePreviews();
            this.commitFullState();
            this.getSprite().updateFrame(this.getSelectedFrame());
            this.updateFrameIDs();
            this.$emit('asset-changed', this.getSprite().ID);
        },
        selectedFrameChanged(){
            this.$refs.artCanvas.setSprite();
            this.updateFrameIDs();
        },
        frameAdded(){
            this.commitFullState();
            this.$refs.artCanvas.setSprite();
            this.updateFrameIDs();
        },
        navSelected(){
            this.selectTool(null);
        },
        toolSelected(){
            this.setNavTool(null);
        },
        commitFullState(){
            this.undoStore.commit(this.packageUndoData());
        },
        undo(){
            let prevStep = this.undoStore.stepBack();

            if (prevStep && prevStep.spriteData){
                this.currentSprite.setFramesFromArray(prevStep.spriteData);
            }
            else{
                this.currentSprite.setFramesFromArray(this.undoStore.initialState.spriteData);
            }

            this.updateFrameIDs();
            this.$refs.artCanvas.setSprite();
            
            this.$nextTick(()=>{
                this.$refs.animPanel.updateFramePreviews();
            });
        },
        redo(){
            let nextStep = this.undoStore.stepForward();

            if (nextStep && nextStep.spriteData){
                this.currentSprite.setFramesFromArray(nextStep.spriteData);
            }

            this.updateFrameIDs();
            this.$refs.artCanvas.setSprite();

            this.$nextTick(()=>{
                this.$refs.animPanel.updateFramePreviews();
            });
        },
        packageUndoData(){
            return {
                spriteData: [...this.getSprite().getFramesCopy()]
            }
        },
        updateAssetSelection(){
            let newAsset = this.getSprite();
            this.undoStore.clear();

            if (newAsset && newAsset.category_ID == CATEGORY_ID.SPRITE){
                this.currentSprite = this.getSprite();
                this.$refs.artCanvas.setSprite();
                this.$refs.animPanel.newSpriteSelection();
                this.updateFrameIDs()
            }
        },
        updateFrameIDs(){
            this.frameIDs = this.getSprite().frameIDs;
        }
    }
}
</script>

<style scoped>
    .artMain{
        display: flex;
        flex-direction: row;
        justify-content: space-between;
        width: 100%;
        height: 100%;
        margin:none;
        padding:none;
        overflow: none;
    }
</style>